-- Create enums
CREATE TYPE "StaffStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE');
CREATE TYPE "Department" AS ENUM (
  'FRONT_OFFICE', 'HOUSEKEEPING', 'RESTAURANT', 'KITCHEN',
  'POOL_BAR', 'ACCOUNTS', 'SECURITY', 'MAINTENANCE', 'MANAGEMENT', 'OTHER'
);
CREATE TYPE "WhatsAppInvitationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- Add explicit permission flags to User (additive, defaults false)
ALTER TABLE "User"
  ADD COLUMN "isGlobalManager" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canManageStaff" BOOLEAN NOT NULL DEFAULT false;

-- Create StaffRegistration table (phone is NOT unique)
CREATE TABLE "StaffRegistration" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "hotelId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "profilePhotoUrl" TEXT,
  "originalRole" TEXT NOT NULL,
  "department" "Department" NOT NULL,
  "confirmedRole" TEXT,
  "confirmedDepartment" "Department",
  "confirmedById" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "staffStatus" "StaffStatus" NOT NULL DEFAULT 'PENDING',
  "whatsappConsent" BOOLEAN NOT NULL DEFAULT false,
  "whatsappInvitationStatus" "WhatsAppInvitationStatus" NOT NULL DEFAULT 'PENDING',
  "invitedAt" TIMESTAMP(3),
  "userId" TEXT UNIQUE,
  "duplicatePhoneFlag" BOOLEAN NOT NULL DEFAULT false,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Foreign keys (only to Hotel and User — no Booking/Payment/Room links)
ALTER TABLE "StaffRegistration"
  ADD CONSTRAINT "StaffRegistration_hotelId_fkey"
  FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT;

ALTER TABLE "StaffRegistration"
  ADD CONSTRAINT "StaffRegistration_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;

ALTER TABLE "StaffRegistration"
  ADD CONSTRAINT "StaffRegistration_confirmedById_fkey"
  FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL;

-- Indexes
CREATE INDEX "StaffRegistration_hotelId_staffStatus_idx" ON "StaffRegistration"("hotelId", "staffStatus");
CREATE INDEX "StaffRegistration_phone_idx" ON "StaffRegistration"("phone");
