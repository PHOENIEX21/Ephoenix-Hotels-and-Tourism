import { PrismaClient } from '@prisma/client';
import { createPendingBooking } from '../lib/booking';

const prisma = new PrismaClient();
const slug = `dbverify-${Date.now()}`;
const checkIn = '2027-03-15';

async function main() {
  const hotel = await prisma.hotel.create({
    data: { name: 'DB Verify', slug, address: 'x', phone: 'x', description: 'x', vatMode: 'exclusive', serviceNote: 'x' },
  });
  const roomType = await prisma.roomType.create({
    data: { hotelId: hotel.id, name: 'Verify Type', slug: 'verify-type', priceKobo: 10000, depositKobo: 1000, capacity: 2 },
  });
  await prisma.room.create({ data: { hotelId: hotel.id, roomTypeId: roomType.id, number: 'V1' } });

  const attempt = (email: string) =>
    createPendingBooking({
      roomTypeId: roomType.id,
      checkIn,
      guests: 1,
      guestName: 'Verifier',
      guestEmail: email,
      guestPhone: '08000000000',
    });

  // Fire both holds concurrently (no await between them) to race the transaction.
  const results = await Promise.allSettled([attempt('a@verify.test'), attempt('b@verify.test')]);
  const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
  const rejected = results.filter((r) => r.status === 'rejected').length;

  const roomIds = (await prisma.room.findMany({ where: { roomTypeId: roomType.id } })).map((r) => r.id);
  const bookings = await prisma.booking.findMany({ where: { roomId: { in: roomIds } } });
  const activeForRoom = bookings.filter((b) => b.status === 'PENDING' || b.status === 'CONFIRMED').length;

  console.log(JSON.stringify({ fulfilled, rejected, totalBookings: bookings.length, activeForRoom }, null, 2));

  let ok = true;
  if (activeForRoom !== 1) {
    ok = false;
    console.error(`FAIL: expected exactly 1 active booking for the room, got ${activeForRoom}`);
  }
  if (fulfilled !== 1) {
    ok = false;
    console.error(`FAIL: expected exactly 1 fulfilled hold, got ${fulfilled}`);
  }

  await prisma.hotel.delete({ where: { id: hotel.id } }); // cascade removes roomType/room/booking
  console.log(ok ? 'PASS: only one concurrent booking succeeded (double-booking prevented).' : 'FAIL');
  process.exit(ok ? 0 : 1);
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
