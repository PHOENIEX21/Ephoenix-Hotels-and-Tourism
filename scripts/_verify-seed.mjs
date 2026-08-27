import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const [hotels, roomTypes, rooms, users, offers] = await Promise.all([
  p.hotel.count(), p.roomType.count(), p.room.count(), p.user.count(), p.offer.count()
]);
const annexSL = await p.room.findMany({ where: { roomType: { name: 'Superior Luxury', hotel: { slug: 'annex-i' } } }, select: { number: true } });
console.log(JSON.stringify({ hotels, roomTypes, rooms, users, offers, annexSuperiorLuxury: annexSL.map(r=>r.number) }, null, 2));
await p.$disconnect();
