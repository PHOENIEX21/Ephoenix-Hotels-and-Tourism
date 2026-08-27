import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const rows = await p.$queryRawUnsafe(`SELECT conname FROM pg_constraint WHERE conname = 'booking_room_overlap_excl'`);
console.log('constraint present on Neon:', rows.length === 1 ? 'YES (' + rows[0].conname + ')' : 'NO');
await p.$disconnect();
