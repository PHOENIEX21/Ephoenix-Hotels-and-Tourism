import { BookingStatus, Prisma } from '@prisma/client';
import { getStayWindow } from './availability';
import { prisma } from './prisma';

export const DEFAULT_HOLD_MINUTES = 15;

type RoomSummary = { id: string; number: string };
type RoomTypeWithRooms = {
  id: string;
  name: string;
  capacity: number;
  priceKobo: number;
  depositKobo: number;
  hotel: { id: string; slug: string; name: string };
  photoUrls: string[];
  rooms: RoomSummary[];
};


export async function getActiveOffer(roomTypeId: string, hotelId: string, checkIn: Date) {
  return prisma.offer.findFirst({
    where: {
      active: true,
      startsAt: { lte: checkIn },
      endsAt: { gte: checkIn },
      OR: [{ roomTypeId }, { hotelId, roomTypeId: null }, { hotelId: null, roomTypeId: null }],
    },
    orderBy: [{ roomTypeId: 'desc' }, { hotelId: 'desc' }, { discountValue: 'desc' }],
  });
}

export function getBranchPricing(roomType: { hotel: { slug: string }; priceKobo: number; depositKobo: number }, offer?: { name: string; discountType: 'PERCENTAGE' | 'FIXED'; discountValue: number } | null) {
  const isInclusiveBranch = roomType.hotel.slug === 'annex-ii';
  const discountKobo = offer?.discountType === 'PERCENTAGE'
    ? Math.min(roomType.priceKobo, Math.round(roomType.priceKobo * offer.discountValue / 100))
    : Math.min(roomType.priceKobo, offer?.discountValue ?? 0);
  const subtotalKobo = roomType.priceKobo - discountKobo;
  const serviceChargeKobo = isInclusiveBranch ? 0 : Math.round(subtotalKobo * 0.1);
  const vatKobo = isInclusiveBranch ? 0 : Math.round((subtotalKobo + serviceChargeKobo) * 0.075);
  const totalKobo = isInclusiveBranch ? subtotalKobo : subtotalKobo + serviceChargeKobo + vatKobo;

  return {
    subtotalKobo,
    serviceChargeKobo,
    vatKobo,
    totalKobo,
    depositKobo: roomType.depositKobo,
    discountKobo,
    offerName: offer?.name ?? null,
    vatMode: isInclusiveBranch ? 'inclusive' : 'exclusive',
  };
}

export async function createPendingBooking(input: {
  roomTypeId: string;
  checkIn: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  holdMinutes?: number;
}) {
  const guestName = input.guestName.trim();
  const guestEmail = input.guestEmail.trim().toLowerCase();
  const guestPhone = input.guestPhone.trim();

  if (!guestName) throw new Error('Guest name is required.');
  if (!guestEmail) throw new Error('Guest email is required.');
  if (!guestPhone) throw new Error('Guest phone is required.');

  const { checkIn, checkOut } = getStayWindow(input.checkIn);
  const guests = Number(input.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > 20) {
    throw new Error('Guests must be a whole number between 1 and 20');
  }

  const roomType = (await prisma.roomType.findUnique({
    where: { id: input.roomTypeId },
    include: { hotel: true, rooms: { orderBy: { number: 'asc' }, select: { id: true, number: true } } },
  })) as RoomTypeWithRooms | null;

  if (!roomType) throw new Error('Selected room type was not found.');
  if (roomType.capacity < guests) throw new Error('This room type does not accommodate the selected guest count.');

  const offer = await getActiveOffer(roomType.id, roomType.hotel.id, checkIn);
  const pricing = getBranchPricing(roomType, offer);
  const holdMinutes = input.holdMinutes ?? DEFAULT_HOLD_MINUTES;
  const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

  // Serialize concurrent holds and rely on the DB exclusion constraint for the
  // structural guarantee. Everything that decides which physical room is booked
  // and the insert itself runs inside one transaction with the candidate rooms
  // row-locked (SELECT ... FOR UPDATE), so two simultaneous requests can't both
  // "see" the same room as free (architecture §7).
  const booking = await prisma.$transaction(async (tx) => {
    const roomIds = roomType.rooms.map((room) => room.id);

    // Expire stale holds so the exclusion constraint (which counts PENDING) stays accurate.
    await tx.booking.updateMany({
      where: { roomId: { in: roomIds }, status: BookingStatus.PENDING, expiresAt: { lt: new Date() } },
      data: { status: BookingStatus.CANCELLED },
    });

    // Lock the candidate rooms for the duration of this transaction.
    await tx.$queryRaw`SELECT 1 FROM "Room" WHERE id IN (${Prisma.join(roomIds)}) FOR UPDATE`;

    const overlapping = await tx.booking.findMany({
      where: {
        roomId: { in: roomIds },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
      select: { roomId: true },
    });
    const bookedRoomIds = new Set(overlapping.map((b) => b.roomId));
    const room = roomType.rooms.find((candidate) => !bookedRoomIds.has(candidate.id));
    if (!room) {
      throw new Error('This room type is not available for the selected dates.');
    }

    return tx.booking.create({
      data: {
        reference: `EPX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        roomId: room.id,
        guestName,
        guestPhone,
        guestEmail,
        checkIn,
        checkOut,
        status: BookingStatus.PENDING,
        depositKobo: pricing.depositKobo,
        subtotalKobo: pricing.subtotalKobo,
        vatKobo: pricing.vatKobo,
        serviceChargeKobo: pricing.serviceChargeKobo,
        totalKobo: pricing.totalKobo,
        currency: 'NGN',
        expiresAt,
      },
    });
  });

  const room = roomType.rooms.find((candidate) => candidate.id === booking.roomId)!;
  return {
    ...booking,
    roomNumber: room.number,
    branch: roomType.hotel.slug,
    branchName: roomType.hotel.name,
    pricing,
  };
}
