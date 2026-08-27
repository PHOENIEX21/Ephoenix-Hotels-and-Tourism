# EPhoenix Hotels and Tourism — Technical Architecture Proposal

**Status:** Approved baseline. All architecture decisions confirmed — see "Decisions Confirmed" near the end. No code, files, or dependencies created yet; this document governs Phase 1 onward.
**Audience:** Written for a learner working alongside a coding agent, so reasoning is explained, not just prescribed.

---

## 1. Guiding Principles

Before the stack: three rules that shaped every choice below.

1. **One moving part beats three.** A hotel booking platform *feels* like it needs microservices, message queues, and separate frontend/backend deployments. It doesn't — not at MVP stage, and not for a learner. Every extra service is something that can fail, and something you have to understand to debug.
2. **Money and inventory correctness are non-negotiable.** Everything else (design polish, extra features) can be imperfect at first. Double-booking a room or losing track of a payment cannot happen, even in prototype form. This drives the database and booking-flow decisions more than anything else.
3. **Boring technology wins.** Well-documented, widely-used tools mean the coding agent (and Claude, when you ask for help) has seen thousands of examples of how to use them correctly. Novel or clever tooling saves little and costs a lot when something breaks at 11pm.

---

## 2. Recommended Stack at a Glance

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14+ (App Router) + TypeScript + Tailwind CSS | One framework does both the public site and the app; huge ecosystem; TypeScript catches bugs before runtime |
| Backend | Same Next.js app (API routes / Server Actions) | No second server to deploy, secure, and keep in sync — see §3 |
| Database | PostgreSQL | Relational integrity, transactions, and constraints are exactly what booking/payment data needs |
| ORM | Prisma | Type-safe queries, readable schema file, easy migrations — good fit for a learner |
| Auth | Auth.js (formerly NextAuth) + bcrypt + RBAC | Battle-tested, handles sessions/JWT for you, supports credentials + future social login |
| Local payments | Paystack first, Flutterwave added later | Paystack covers the Nigeria-based customer base at launch; the provider abstraction (§8) makes adding Flutterwave later straightforward |
| International payments | Stripe | Industry standard for card payments outside Nigeria; excellent docs |
| Email | Resend (or SendGrid) | Simple transactional email API, generous free tier |
| Caching / locking | Redis (Upstash) | Needed for booking-hold locks and rate limiting, not much else at MVP |
| Hosting | Vercel (app) + managed Postgres (Neon or Supabase) | Zero-ops deployment, free tiers suitable for prototype |
| Image storage | Cloudinary | Free tier (~25GB) comfortably covers 150+ hotel photos; auto-optimizes/resizes images, which noticeably improves perceived polish for a demo build |
| CI | GitHub Actions | Free, standard, integrates with Vercel automatically |
| Monitoring | Sentry | Free tier, catches production errors you'd otherwise never see |

---

## 3. Frontend & Backend Architecture

**Recommendation: a single Next.js application, not separate frontend/backend projects.**

Why: A separate Express/NestJS backend plus a separate React frontend means two codebases, two deployments, CORS configuration, and two things to keep in sync on every change. Next.js lets the public site, guest dashboard, and admin dashboard all live in one project, with API routes (or Server Actions) acting as the backend layer — same database access, same auth, same deploy.

This is not a toy shortcut — it's the same architecture used in production by many real booking and e-commerce platforms. If EPhoenix later needs a genuinely separate backend (e.g., a dedicated service for heavy reporting), that can be extracted later without rewriting the frontend.

**Structure inside the app:**
- `/app/(public)` — homepage, rooms, gallery, offers, reviews, contact
- `/app/(guest)` — guest account, bookings, profile (auth-protected)
- `/app/(admin)` — staff/admin dashboard, reports (role-protected)
- `/app/api` — payment webhooks, booking endpoints, anything needing server-only secrets
- `/lib` — shared business logic (availability checks, pricing, payment provider abstraction)
- `/prisma` — database schema and migrations

---

## 4. Database Technology & Schema Strategy

**PostgreSQL**, not a NoSQL database. Reasoning: bookings involve relationships (guest → booking → room → payment → hotel) and require transactional guarantees (a payment and a reservation must succeed or fail together). Postgres gives you foreign keys, unique constraints, and transactions natively — a NoSQL database would require you to reinvent these guarantees in application code, which is a common source of real-world double-booking bugs.

**Core schema (simplified — full schema designed at implementation time):**

- `hotels` — for future multi-property support, even if v1 has one property
- `room_types` — e.g. Deluxe, Suite; pricing, description, capacity
- `rooms` — individual physical rooms, linked to `room_types`
- `room_availability` or a computed availability approach (see §6)
- `users` — guests, staff, admins, distinguished by a `role` field
- `bookings` — guest, room, dates, status (pending / confirmed / cancelled / completed)
- `payments` — booking reference, provider, amount, currency, status, provider transaction ID
- `refunds` — linked to payments, status, reason
- `reviews`, `offers`, `notifications`, `audit_logs` — supporting tables

**Migration strategy:** Prisma Migrate, with every schema change committed as a migration file — never edit the production database by hand.

---

## 5. Authentication & Authorization

- **Authentication:** Auth.js with the Credentials provider (email + password, hashed with bcrypt). Session via JWT stored in an HTTP-only cookie — not localStorage, which is vulnerable to XSS.
- **Authorization:** Role-based access control with three roles at minimum: `guest`, `staff`, `admin`. Every admin/staff route checks role server-side (never trust a hidden UI element as security).
- **Password policy:** minimum length + complexity enforced at signup; rate-limited login attempts to slow brute force.
- Future-proofing: Auth.js supports adding Google/social login later without restructuring.

---

## 6. Hotel/Room Inventory Structure — Multi-Property (Confirmed)

**Confirmed:** EPhoenix operates three properties (62, 52, and 50 rooms) in close proximity. This is built as a first-class part of the schema, not a future add-on.

Structure, in three layers:
- **Hotel** (property) — e.g. "EPhoenix — [Location A]," with its own address, description, images, contact details, and amenities.
- **Room Type** (what a guest books and sees) — e.g. "Deluxe King Room," scoped to a specific hotel, with price, amenities, photos, max occupancy.
- **Physical Room** (what actually gets assigned) — e.g. Room 204 at a specific property, belonging to a Room Type.

Every `room_type`, `room`, `booking`, `staff` account, `offer`, and `review` carries a `hotel_id`. This keeps availability, booking, and reporting logic naturally scoped per property, while still allowing cross-property queries (search, admin reports) by simply querying across all `hotel_id`s instead of filtering to one.

**Guest-facing browsing:** guests see all rooms across all three properties in one listing, each room clearly tagged with its property/location and price — guests pick whichever room/property suits them, rather than having to pick a property first. This matches how you described wanting it to work, and is consistent with how large multi-property chains run their central reservation systems (see §12 for how staff visibility differs from guest visibility).

---

## 7. Availability & Booking Architecture (Double-Booking Prevention)

This is the most important correctness requirement in the whole system.

**Approach:**
1. **Search/availability check:** query for physical rooms of the requested type with no overlapping *confirmed or held* booking in the date range.
2. **Booking hold:** when a guest starts checkout, create a `booking` row with status `pending` and an `expires_at` timestamp (e.g., 10–15 minutes out). This "soft-locks" the room without fully committing it.
3. **Database-level protection:** a unique constraint / exclusion constraint on (room_id, date range) prevents two overlapping confirmed bookings from ever existing, even if application logic has a bug. Postgres supports range-based exclusion constraints for exactly this purpose.
4. **Transaction + row locking:** the actual booking-creation step runs inside a database transaction with `SELECT ... FOR UPDATE` on the relevant room row, so two simultaneous requests can't both "see" the room as free.
5. **Hold cleanup:** an expired `pending` booking (payment never completed) is either cleaned up by a scheduled job or lazily invalidated the next time that room/date range is queried.

This gives you two layers of protection — good application logic, backed by a database constraint that makes double-booking structurally impossible rather than just "unlikely."

---

## 8. Payment Architecture (Local & International)

**Providers:**
- **Paystack** (confirmed) for Nigerian cards, bank transfer, and USSD — built first, since EPhoenix is Nigeria-based and this covers the primary customer base.
- **Flutterwave** — deferred, added later as a second local option once Paystack is working end-to-end. The provider abstraction below means adding it later is a matter of writing one more implementation of the same interface, not a redesign.
- **Stripe** for international cards (USD, GBP, EUR, etc.) — for guests booking from outside Nigeria.

**Design pattern: a Payment Provider abstraction.** Rather than hard-coding Paystack calls throughout the app, define a common interface (`initiatePayment`, `verifyPayment`) and implement it once per provider, starting with Paystack. The booking flow calls the interface, not the provider directly — this is what makes adding Flutterwave later straightforward instead of a rewrite.

**Currency handling:** store amounts in the smallest unit (kobo/cents) as integers to avoid floating-point rounding bugs — a classic and completely avoidable payment bug.

**No live credentials during development** — every provider above has a sandbox/test mode with test card numbers. Nothing touches real money until you explicitly switch environment variables to production keys.

---

## 9. Payment Verification & Webhook Handling

Never trust the frontend to say "payment succeeded." The flow:

1. Frontend initiates payment via the provider's checkout (Paystack Popup, Stripe Checkout, etc.).
2. Provider redirects back with a reference, **but** the booking is *not* confirmed yet.
3. The provider sends a **webhook** (server-to-server call) to a dedicated API route (`/api/webhooks/paystack`, etc.) reporting the payment outcome.
4. The webhook handler **verifies the signature** using the provider's secret (proves the request really came from the provider, not an attacker forging a "success" call).
5. Only after signature verification does the server mark the booking `confirmed` and the payment `successful`.
6. As a safety net, also call the provider's "verify transaction" API directly using the reference — belt-and-braces in case a webhook is delayed or missed.

This two-path verification (webhook + direct verify) is standard practice and prevents the common vulnerability of trusting a client-side "payment successful" redirect.

---

## 10. Cancellation & Refund Architecture

- Guest-initiated cancellation checked against a cancellation policy (e.g., free before 48 hours, partial refund after).
- Cancellation creates a `refund` record with status `requested`, then calls the relevant provider's refund API.
- Refund status updates via the same webhook pattern as payments — the refund isn't "complete" until the provider confirms it.
- Admin can view and manually process edge cases (e.g., bank transfer refunds that providers can't automate).

---

## 11. Guest Accounts (Confirmed: Optional)

**Confirmed:** account creation is optional, not required to book — matching how Hilton/Marriott-style platforms work.

- Guests can complete the full booking flow (search → book → pay) using just name, email, and phone — no account needed. The booking is linked by email.
- After a successful booking, the guest is offered the option to create an account (pre-filled from the booking details) to track bookings across all three EPhoenix properties, save details for faster future checkout, and receive offers/promotions.
- Signup/login, when used, is via email + password (Auth.js).
- Guest dashboard (for those who do create an account): booking history across all three properties, upcoming stays, profile details, saved payment method reference (never store raw card numbers — providers handle that via tokenization).

---

## 12. Admin/Staff Roles & Permissions — Multi-Property Model (Confirmed)

This is where the three-property structure has the most impact. The model mirrors how prominent hotel chains split head-office vs. front-desk access:

- **`admin` (head office / you):** not scoped to any single hotel — sees all three properties combined. Full access: reservations across all properties, consolidated financial/occupancy reports, room type and pricing management for any property, staff account management, offers/promotions.
- **`staff` (reception, scoped to one property via `hotel_id`):**
  - **Full detail on their own property:** manage bookings, check guests in/out, view/edit their own hotel's availability calendar.
  - **Read-only summary of the other two properties:** can see whether a room type is booked or available at a sister property (so a receptionist can redirect a walk-in guest — "we're full, but [Location B] has a room"), without seeing that property's guest details or being able to edit its bookings.
- **`manager` (optional, add later if needed):** a middle tier overseeing all three properties like `admin`, but without pricing/staff-management control — worth adding only if you bring on someone below you who needs cross-property visibility but not full control.

Every role check happens server-side on every route and API call — never enforced only in the UI. A staff account's `hotel_id` scope is checked on every query, not just used to filter what's displayed.

---

## 13. Notifications / Email Architecture

- Transactional emails via Resend (or SendGrid): booking confirmation, payment receipt, cancellation confirmation, refund status.
- Triggered server-side, right after the relevant database state change — never from the frontend, so an email can't be spoofed by a client-side call.
- SMS (e.g., via Termii, a Nigeria-focused SMS provider) can be added later for booking reminders — noted as a future enhancement, not v1 scope.

---

## 14. Security Requirements

- HTTPS everywhere (handled automatically by Vercel).
- All secrets (DB URL, payment keys, auth secret) in environment variables, never committed to source control.
- Input validation on every API route (see §15).
- Rate limiting on auth and payment endpoints (via Redis) to slow brute-force and abuse.
- Standard security headers (CSP, HSTS, etc.) — Next.js supports these via middleware/config.
- Least-privilege database credentials in production.
- Regular dependency updates (`npm audit` / Dependabot).

---

## 15. Data Validation

- **Zod** schemas for every API input — validate shape, types, and constraints (e.g., check-in date before check-out date, positive integers only) before anything touches the database.
- Validation happens server-side always; client-side validation is a UX nicety, not a security boundary.

---

## 16. Error Handling & Recovery

- Consistent API error shape (status code + machine-readable error code + human message).
- Payment and booking operations wrapped in database transactions — if any step fails, everything rolls back rather than leaving a booking "half-created."
- User-facing errors are friendly and actionable; internal errors are logged with full detail server-side (see §17) but never expose stack traces to the client.

---

## 17. Logging & Audit Trails

- Structured logging (e.g., Pino) for application logs.
- **Sentry** for error tracking and alerting — you find out about production errors immediately instead of when a guest complains.
- A dedicated `audit_logs` table recording sensitive admin actions (price changes, manual booking edits, refund approvals) with who/what/when — important both for debugging and for trust in a system handling money.

---

## 18. Testing Strategy

- **Unit tests** (Vitest) for business logic: pricing calculation, availability logic, validation schemas.
- **Integration tests** for API routes, especially booking creation and payment webhook handling — these are the highest-risk areas.
- **End-to-end tests** (Playwright) for the critical path: search → book → pay (sandbox) → confirm.
- Testing isn't "extra" here — it's the main defense against a double-booking or payment bug slipping through.

---

## 19. Development Environment

- Docker Compose for local Postgres + Redis — one command spins up the same services production uses, no "works on my machine" drift.
- `.env.example` checked into the repo documenting every required environment variable (without real values).
- Seed script to populate sample hotels/rooms/offers for local development.

---

## 20. Production Deployment Strategy

- **Vercel** for the Next.js app — automatic deploys from GitHub, preview deployments per pull request, zero server management.
- **Neon or Supabase** for managed Postgres — automated backups included, connection pooling for serverless.
- **Upstash** for managed Redis (serverless-friendly, pay-per-use).
- **Cloudinary** for all room/hotel/gallery photos (confirmed) — images are uploaded to Cloudinary and referenced by URL in the database, not bundled into the app. This keeps deploys fast regardless of photo count and gives free automatic resizing/optimization for the site's various image sizes (thumbnails, gallery, hero images).
- GitHub Actions runs tests on every push; deployment only proceeds if tests pass.

---

## 21. Database Backup & Recovery

- Automated daily backups (provided by Neon/Supabase out of the box) plus point-in-time recovery.
- Periodic manual export as an extra safety net once real guest/payment data exists.
- A documented, tested restore procedure — a backup nobody has practiced restoring from is not a real backup.

---

## 22. Scalability Considerations

The architecture above deliberately starts as a monolith — appropriate for a prototype and early production traffic. Growth path, in order, as/if needed:
1. Add caching (Redis) for expensive read queries like availability search.
2. Add a CDN for static assets/images (Vercel does this automatically).
3. Read replicas for the database if reporting queries start competing with booking traffic.
4. Only if traffic genuinely demands it: extract specific heavy workloads (e.g., reporting) into a separate service.

Multi-hotel support is already accounted for in the schema (`hotels` table) even though v1 will likely run a single property.

---

## 23. Repository Structure

**Single repository (monorepo not needed)** — one Next.js project contains public site, guest app, admin dashboard, and API layer. For a project of this scope with one deploy target, splitting into multiple repos would add coordination overhead (versioning, cross-repo PRs) with no corresponding benefit. Revisit only if the project later splits into genuinely independent deployable services.

---

## 24. End-to-End Booking Flow

```
Search (dates, guests)
   → Availability check (room_type + physical room query)
   → Room selection
   → Guest details (or login/signup)
   → Create booking (status: pending, hold expiry set)
   → Payment initiation (Paystack / Flutterwave / Stripe, sandbox)
   → Provider webhook → signature verified → server-side payment verification
   → Booking status: confirmed
   → Notification (email confirmation to guest)
   → Admin dashboard reflects new reservation + audit log entry
```

---

## 25. Phased Build Order

Building all 16 feature areas at once isn't realistic or safe. Proposed order:

1. **Foundation** — project scaffold, database schema, auth skeleton, Docker dev environment.
2. **Public site (static-ish)** — homepage, room/suite listings, gallery, location/contact.
3. **Availability search** — search UI + backend availability logic (no booking yet).
4. **Guest accounts** — signup/login, guest dashboard shell.
5. **Booking flow (pre-payment)** — room selection → guest details → booking created as `pending`, no payment yet.
6. **Payment integration (sandbox)** — Paystack/Flutterwave/Stripe, webhook verification, booking → `confirmed`.
7. **Notifications** — booking confirmation emails.
8. **Cancellation & refund workflow.**
9. **Admin/staff dashboard** — reservations view, room management.
10. **Reports** — occupancy, revenue, admin analytics.
11. **Reviews & offers/promotions.**
12. **Hardening pass** — security review, audit logging, test coverage, production deployment.

---

## 26. Brand Identity — Confirmed Palette & Typography

Colors extracted directly from the official EPhoenix logo, so the site matches the brand exactly rather than approximating it.

| Role | Color | Hex | Usage |
|---|---|---|---|
| Primary | Royal Purple | `#502078` | Headers, navigation, primary buttons, structural elements |
| Accent / CTA | Brass Gold | `#D0A068` | "Book Now" buttons, price highlights, room-tier markers (ties to Diamond/Platinum/Presidential naming) |
| Highlight (sparing use) | Coral Red | `#E83828` | Small accents only — sold-out badges, limited-time offers. Vivid; use minimally |
| Background | Off-White | `#F9F7FB` | Page background — slightly purple-tinted, warmer than flat white |
| Text / structure | Deep Charcoal-Purple | `#221733` | Body text and headings instead of pure black — keeps the purple thread consistent |

**Typography:** serif display face for headings (pairs naturally with the crest-style logo and the "established" feel of tier names like Senatorial Suite and Chairman's Suite), clean humanist sans for body text, and a tabular/monospace numeral face for room rates specifically — since pricing tables are a large, precise part of this site's actual content.

**Logo:** the existing EPhoenix crest (purple wreath, gold "O," coral "E," eagle/phoenix mark) is the source of truth for the palette above — do not introduce additional brand colors without checking against it.

1. **Guest checkout:** optional. Booking doesn't require an account; account creation is offered after booking.
2. **Properties:** three EPhoenix hotels (62, 52, 50 rooms), built as first-class multi-property from day one — not a single-property build.
3. **Guest browsing:** unified room listing across all three properties, each room tagged with location and price; guest picks freely.
4. **Roles:** `admin` sees all three properties combined; `staff` (reception) is scoped to one property with full detail on their own bookings and a read-only availability summary of the other two.
5. **Payments:** Paystack first (Nigeria-based customer base), Stripe alongside it for international guests. Flutterwave deferred, added later as a second local option via the same provider abstraction.
6. **Image storage:** Cloudinary, free tier — all 150+ hotel photos hosted there and referenced by URL, not bundled into the app.
7. **Brand palette:** confirmed from the official logo — Royal Purple `#502078`, Brass Gold `#D0A068`, Coral Red `#E83828` (sparing accent), Off-White `#F9F7FB` background. See §26.

All open questions are resolved. This architecture is ready to serve as the approved baseline — next step is scaffolding Phase 1: project skeleton and the public, multi-property pages, no payments or auth complexity yet.
