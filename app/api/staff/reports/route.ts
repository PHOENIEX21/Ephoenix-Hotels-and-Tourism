import { BookingStatus, PaymentStatus, RefundStatus, Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireStaff } from '../../../../lib/staff';

function dateBoundary(value: string | null, end = false) {
  const date = new Date(`${value || ''}${end ? 'T23:59:59.999' : 'T00:00:00.000'}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireStaff();
    if (user.role !== Role.ADMIN) return NextResponse.json({ error: 'Only admins can view reports.' }, { status: 403 });
    const params = request.nextUrl.searchParams;
    const start = dateBoundary(params.get('start'));
    const end = dateBoundary(params.get('end'), true);
    const branch = params.get('branch') || 'all';
    if (!start || !end || start > end) return NextResponse.json({ error: 'A valid start and end date are required.' }, { status: 400 });

    const hotelWhere = branch === 'all' ? {} : { slug: branch };
    const hotels = await prisma.hotel.findMany({ where: hotelWhere, include: { rooms: true, roomTypes: true } });
    const hotelIds = hotels.map(hotel => hotel.id);
    const bookings = await prisma.booking.findMany({
      where: { checkIn: { gte: start, lte: end }, room: { hotelId: { in: hotelIds } } },
      include: { room: { include: { roomType: true, hotel: true } } },
      orderBy: { checkIn: 'asc' },
    });
    const confirmed = bookings.filter(booking => booking.status === BookingStatus.CONFIRMED);
    const bookingIds = bookings.map(booking => booking.id);
    const payments = await prisma.payment.findMany({ where: { bookingId: { in: bookingIds }, status: PaymentStatus.SUCCESSFUL } });
    const refunds = await prisma.refund.findMany({ where: { bookingId: { in: bookingIds }, status: RefundStatus.SUCCESSFUL } });
    const hotelReport = hotels.map(hotel => {
      const branchBookings = confirmed.filter(booking => booking.room.hotelId === hotel.id);
      const bookedRooms = new Set(branchBookings.map(booking => booking.roomId));
      const branchPayments = payments.filter(payment => branchBookings.some(booking => booking.id === payment.bookingId));
      const branchRefunds = refunds.filter(refund => branchBookings.some(booking => booking.id === refund.bookingId));
      return { branch: hotel.slug, name: hotel.name, totalRooms: hotel.rooms.length, bookedRooms: bookedRooms.size, grossRevenueKobo: branchPayments.reduce((total, payment) => total + payment.amountKobo, 0), refundedKobo: branchRefunds.reduce((total, refund) => total + refund.requestedAmountKobo, 0), netRevenueKobo: branchPayments.reduce((total, payment) => total + payment.amountKobo, 0) - branchRefunds.reduce((total, refund) => total + refund.requestedAmountKobo, 0) };
    });
    const roomTypeRevenue = hotels.flatMap(hotel => (hotel.roomTypes ?? []).map(roomType => ({ hotel, roomType }))).map(({ hotel, roomType }) => {
      const typeBookings = confirmed.filter(booking => booking.room.roomTypeId === roomType.id);
      const typePayments = payments.filter(payment => typeBookings.some(booking => booking.id === payment.bookingId));
      const typeRefunds = refunds.filter(refund => typeBookings.some(booking => booking.id === refund.bookingId));
      const grossRevenueKobo = typePayments.reduce((total, payment) => total + payment.amountKobo, 0);
      const refundedKobo = typeRefunds.reduce((total, refund) => total + refund.requestedAmountKobo, 0);
      return { branch: hotel.slug, branchName: hotel.name, roomType: roomType.name, grossRevenueKobo, refundedKobo, netRevenueKobo: grossRevenueKobo - refundedKobo };
    });
    const statusBreakdown = Object.values(BookingStatus).map(status => ({ status: status.toLowerCase(), count: bookings.filter(booking => booking.status === status).length }));
    return NextResponse.json({ start: start.toISOString(), end: end.toISOString(), branch, occupancy: { branches: hotelReport, combined: { totalRooms: hotelReport.reduce((total, item) => total + item.totalRooms, 0), bookedRooms: hotelReport.reduce((total, item) => total + item.bookedRooms, 0) } }, revenue: { branches: hotelReport, roomTypes: roomTypeRevenue, grossRevenueKobo: payments.reduce((total, payment) => total + payment.amountKobo, 0), refundedKobo: refunds.reduce((total, refund) => total + refund.requestedAmountKobo, 0), netRevenueKobo: payments.reduce((total, payment) => total + payment.amountKobo, 0) - refunds.reduce((total, refund) => total + refund.requestedAmountKobo, 0), note: 'Net revenue subtracts successful refunds from successful Paystack payments. Payment totals are attributed by booking check-in date because payments have no timestamp.' }, statusBreakdown });
  } catch (error) {
    console.error('Reports request failed', error);
    return NextResponse.json({ error: 'Unable to load reports.' }, { status: 400 });
  }
}