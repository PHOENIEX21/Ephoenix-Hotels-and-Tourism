-- Phase 11: structural double-booking protection (architecture ?7).
-- Prisma's schema DSL cannot express Postgres exclusion constraints, so this is
-- applied as raw SQL. Run against every environment (local, staging, prod):
--   npx prisma db execute --file prisma/exclusion-constraint.sql
-- It is idempotent and safe to re-run.
--
-- Booking.checkIn/checkOut are Prisma "DateTime" -> timestamp (no time zone),
-- so we use tsrange (not tstzrange) to keep the index expression IMMUTABLE.

CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_room_overlap_excl'
  ) THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "booking_room_overlap_excl"
      EXCLUDE USING gist ("roomId" WITH =, tsrange("checkIn", "checkOut") WITH &&)
      WHERE (status IN ('PENDING', 'CONFIRMED'));
  END IF;
END $$;
