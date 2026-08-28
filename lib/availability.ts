import { BookingStatus } from '@prisma/client';
import { prisma } from './prisma';

export const getStayWindow = (checkInDate: string, nights = 1) => {
  if (!Number.isInteger(nights) || nights < 1 || nights > 30) throw new Error('Nights must be a whole number between 1 and 30');
  const checkIn = new Date(`${checkInDate}T12:00:00`);
  if (Number.isNaN(checkIn.getTime())) throw new Error('Invalid check-in date');
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + nights);
  return { checkIn, checkOut };
};

export async function findAvailability(checkInDate: string, guests: number, nights = 1) {
  if (!Number.isInteger(guests) || guests < 1 || guests > 20) throw new Error('Guests must be a whole number between 1 and 20');
  const { checkIn, checkOut } = getStayWindow(checkInDate, nights);
  const roomTypes = await prisma.roomType.findMany({ include: { hotel: true, rooms: true }, orderBy: [{ hotel: { slug: 'asc' } }, { name: 'asc' }] });
  const roomIds = roomTypes.flatMap(roomType => roomType.rooms.map(room => room.id));
  const bookings = await prisma.booking.findMany({ where: { roomId: { in: roomIds }, status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }], checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }, select: { roomId: true } });
  const bookedRoomIds = new Set(bookings.map(booking => booking.roomId));
  return { checkIn: checkIn.toISOString(), checkOut: checkOut.toISOString(), guests, nights, branches: roomTypes.reduce<Array<{ slug: string; name: string; roomTypes: unknown[] }>>((branches, roomType) => { let branch = branches.find(item => item.slug === roomType.hotel.slug); if (!branch) { branch = { slug: roomType.hotel.slug, name: roomType.hotel.name, roomTypes: [] }; branches.push(branch); } const availableRooms = roomType.rooms.filter(room => !bookedRoomIds.has(room.id)).length; if (roomType.capacity >= guests && availableRooms > 0) branch.roomTypes.push({ id: roomType.id, name: roomType.name, hotel: roomType.hotel.slug, priceKobo: roomType.priceKobo, depositKobo: roomType.depositKobo, availableRooms, totalRooms: roomType.rooms.length, photoUrls: roomType.photoUrls }); return branches; }, []) };
}