import { BookingStatus, Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireStaff } from '../../../../../lib/staff';
import { writeAudit } from '../../../../../lib/audit';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireStaff();
    const body = await request.json();
    const { id } = await params;
    const booking = await prisma.booking.findUnique({ where: { id }, include: { room: true } });
    if (!booking || (user.role === Role.STAFF && booking.room.hotelId !== user.hotelId)) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    const action = String(body?.action ?? '');
    const data = action === 'check-in' ? { checkedInAt: new Date() } : action === 'check-out' ? { checkedOutAt: new Date() } : action === 'complete' ? { status: BookingStatus.COMPLETED } : null;
    if (!data) return NextResponse.json({ error: 'Action must be check-in, check-out, or complete.' }, { status: 400 });
    const updated = await prisma.booking.update({ where: { id: booking.id }, data });
    await writeAudit(user.id, `BOOKING_${action.replace('-', '_').toUpperCase()}`, 'Booking', booking.id, { action });
    return NextResponse.json({ ok: true, booking: updated });
  } catch (error) { console.error('Staff booking update failed', error); return NextResponse.json({ error: 'Unable to update booking.' }, { status: 400 }); }
}
