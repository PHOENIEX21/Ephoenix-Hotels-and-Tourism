# EPhoenix Hotels & Tourism

Phase 1 public site for the three EPhoenix GRA properties in Ilorin.

## Run locally

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL`.
2. Install dependencies with `npm install`.
3. Generate Prisma Client with `npm run db:generate`.
4. Apply the schema with `npm run db:push`.
5. Seed tariff-card data with `npm run db:seed`.
6. Start the site with `npm run dev`.

For local PostgreSQL, run `docker compose up -d postgres` first. The schema is pushed with `npm run db:push` and the seed includes all three branches, room types, deposits, event halls, branch-specific policies, and VAT handling.

Public routes: `/`, `/rooms`, `/gallery`, and `/locations`.

## Cloudinary

The representative photos and the available branch photo batches are staged in `public/media`. Set the three Cloudinary variables in `.env.local`, then run `npm run media:upload`. The script recursively uploads into `ephoenix/main`, `ephoenix/annex-i`, and `ephoenix/annex-ii` folders while preserving category paths. Room-type sorting is intentionally left ready for the next photo batch; unpictured room types use neutral placeholders.

Phase 1 deliberately excludes booking, payment, authentication, and admin functionality.
