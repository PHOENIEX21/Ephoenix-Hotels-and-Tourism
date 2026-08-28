-- Additive migration for multi-room orders. Existing single-booking payments remain valid.
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
ALTER TABLE "Payment" ALTER COLUMN "bookingId" DROP NOT NULL;
ALTER TABLE "Payment" ADD COLUMN "orderId" TEXT;

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "guestName" TEXT NOT NULL,
  "guestEmail" TEXT NOT NULL,
  "guestPhone" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "subtotalKobo" INTEGER NOT NULL DEFAULT 0,
  "vatKobo" INTEGER NOT NULL DEFAULT 0,
  "serviceChargeKobo" INTEGER NOT NULL DEFAULT 0,
  "totalKobo" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Order_reference_key" ON "Order"("reference");

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "roomTypeId" TEXT NOT NULL,
  "checkIn" TIMESTAMP(3) NOT NULL,
  "checkOut" TIMESTAMP(3) NOT NULL,
  "guests" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitTotalKobo" INTEGER NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrderItem_bookingId_key" ON "OrderItem"("bookingId");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
