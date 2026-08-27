import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { hotels, rooms, policiesByHotel, halls } from '../lib/data';
const prisma = new PrismaClient();
const main = async () => {
  await prisma.payment.deleteMany(); await prisma.refund.deleteMany(); await prisma.booking.deleteMany(); await prisma.room.deleteMany(); await prisma.roomType.deleteMany(); await prisma.policy.deleteMany(); await prisma.eventHall.deleteMany(); await prisma.hotel.deleteMany(); await prisma.account.deleteMany(); await prisma.session.deleteMany(); await prisma.verificationToken.deleteMany(); await prisma.user.deleteMany();
  for (const hotel of hotels) {
    const created = await prisma.hotel.create({ data: { name: hotel.name, slug: hotel.slug, address: hotel.address, phone: hotel.phone, description: hotel.description, vatMode: hotel.vatMode, serviceNote: hotel.serviceNote } });
    const hotelRooms = rooms.filter(room => room.hotel === hotel.slug);
    for (const room of hotelRooms) {
      const photoUrls = room.image ? [room.image] : [];
      const type = await prisma.roomType.create({ data: { hotelId: created.id, name: room.name, slug: room.slug, priceKobo: room.price * 100, depositKobo: room.deposit * 100, photoUrls, notes: 'Real tariff-card data' } });
      await prisma.room.createMany({ data: room.roomNumbers.map(number => ({ hotelId: created.id, roomTypeId: type.id, number })) });
    }
    for (const policy of policiesByHotel[hotel.slug]) await prisma.policy.create({ data: { hotelId: created.id, item: policy.item, detail: policy.detail } });
    for (const hall of halls.filter(item => item.hotel === hotel.slug)) await prisma.eventHall.create({ data: { hotelId: created.id, name: hall.name, type: 'Event Hall', priceKobo: hall.price * 100, depositKobo: hall.deposit * 100 } });
  }

  const testPassword = process.env.PHASE8_TEST_PASSWORD;
  if (!testPassword) throw new Error('PHASE8_TEST_PASSWORD must be set when seeding test accounts.');
  const passwordHash = await bcrypt.hash(testPassword, 10);
  await prisma.user.create({ data: { name: 'Phase 8 Admin', email: 'phase8.admin@ephoenix.test', passwordHash, role: 'ADMIN' } });
  const staffHotel = await prisma.hotel.findUniqueOrThrow({ where: { slug: 'main' } });
  await prisma.user.create({ data: { name: 'Phase 8 Main Staff', email: 'phase8.staff@ephoenix.test', passwordHash, role: 'STAFF', hotelId: staffHotel.id } });

};
main().catch(error => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
