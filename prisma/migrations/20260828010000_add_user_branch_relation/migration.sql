-- Add the branch relation used to scope staff accounts.
ALTER TABLE "User"
  ADD CONSTRAINT "User_hotelId_fkey"
  FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_hotelId_idx" ON "User"("hotelId");
