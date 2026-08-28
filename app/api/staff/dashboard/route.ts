import { BookingStatus, Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { createPendingBooking } from '../../../../lib/booking';
import { prisma } from '../../../../lib/prisma';
import { requireStaff } from '../../../../lib/staff';
import { writeAudit } from '../../../../lib/audit';

function errorResponse(error: unknown) { console.error('Staff dashboard request failed', error); return NextResponse.json({ error: 'Unable to load staff dashboard.' }, { status: 400 }); }

export async function GET(request: NextRequest) {
  try {
    const user = await requireStaff();
    const params = request.nextUrl.searchParams;
    const status = params.get('status');
    const search = params.get('search')?.trim();
    const branchWhere = user.role === Role.STAFF ? { room: { hotelId: user.hotelId as string } } : {};
    const bookings = await prisma.booking.findMany({
      where: { ...branchWhere, ...(status && Object.values(BookingStatus).includes(status as BookingStatus) ? { status: status as BookingStatus } : {}), ...(search ? { OR: [{ reference: { contains: search, mode: 'insensitive' } }, { guestName: { contains: search, mode: 'insensitive' } }, { guestEmail: { contains: search, mode: 'insensitive' } }] } : {}) },
      orderBy: { checkIn: 'asc' },
      include: { room: { include: { roomType: true, hotel: true } } },
    });
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0); const tomorrow = new Date(todayStart); tomorrow.setDate(tomorrow.getDate() + 1);
    const todayWhere = { ...branchWhere, OR: [{ checkIn: { gte: todayStart, lt: tomorrow } }, { checkOut: { gte: todayStart, lt: tomorrow } }] };
    const todayBookings = await prisma.booking.findMany({ where: todayWhere, include: { room: { include: { roomType: true, hotel: true } } }, orderBy: { checkIn: 'asc' } });
    const otherBranches = await prisma.roomType.findMany({ where: user.role === Role.STAFF ? { hotelId: { not: user.hotelId as string } } : {}, include: { hotel: true, rooms: true } });
    const otherRoomIds = otherBranches.flatMap(roomType => roomType.rooms.map(room => room.id));
    const occupied = await prisma.booking.findMany({ where: { roomId: { in: otherRoomIds }, status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }, checkIn: { lt: tomorrow }, checkOut: { gt: todayStart } }, select: { roomId: true } });
    const occupiedIds = new Set(occupied.map(booking => booking.roomId));
    const roomTypes = await prisma.roomType.findMany({ where: user.role === Role.ADMIN ? {} : { hotelId: user.hotelId as string }, include: { hotel: true }, orderBy: [{ hotel: { slug: 'asc' } }, { name: 'asc' }] });
    return NextResponse.json({ user, bookings, todayBookings, otherBranches: otherBranches.map(roomType => ({ hotel: roomType.hotel.name, hotelId: roomType.hotelId, roomType: roomType.name, totalRooms: roomType.rooms.length, availableRooms: roomType.rooms.filter(room => !occupiedIds.has(room.id)).length })), roomTypes });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireStaff();
    const body = await request.json();
    const roomTypeId = String(body?.roomTypeId ?? '').trim();
    const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId }, select: { hotelId: true } });
    if (!roomType || (user.role === Role.STAFF && roomType.hotelId !== user.hotelId)) return NextResponse.json({ error: 'Walk-in bookings are limited to your branch.' }, { status: 403 });
    const booking = await createPendingBooking({ roomTypeId, checkIn: String(body?.checkIn ?? ''), guests: Number(body?.guests ?? 1), nights: Number(body?.nights ?? 1), guestName: String(body?.guestName ?? ''), guestEmail: String(body?.guestEmail ?? ''), guestPhone: String(body?.guestPhone ?? ''), holdMinutes: 24 * 60 });
    const confirmed = await prisma.booking.update({ where: { id: booking.id }, data: { status: BookingStatus.CONFIRMED, expiresAt: null } });
    await writeAudit(user.id, 'WALK_IN_BOOKING_CREATED', 'Booking', confirmed.id, { reference: confirmed.reference, roomTypeId, branchId: roomType.hotelId });
    return NextResponse.json({ ok: true, booking: confirmed }, { status: 201 });
  } catch (error) { console.error('Walk-in booking failed', error); return NextResponse.json({ error: 'Unable to create walk-in booking. Please check the details and try again.' }, { status: 400 }); }
}