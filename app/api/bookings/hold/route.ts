import { NextRequest, NextResponse } from 'next/server';
import { createPendingBooking } from '../../../../lib/booking';
import { clientKey, rateLimit } from '../../../../lib/security';

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`hold:${clientKey(request)}`, 20);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many booking attempts. Please try again shortly.' }, { status: 429 });
    const body = await request.json();
    const roomTypeId = String(body?.roomTypeId ?? '').trim();
    const checkIn = String(body?.checkIn ?? '').trim();
    const guests = Number(body?.guests ?? 1);
    const guestName = String(body?.guestName ?? '').trim();
    const guestEmail = String(body?.guestEmail ?? '').trim();
    const guestPhone = String(body?.guestPhone ?? '').trim();
    const holdMinutes = Number(body?.holdMinutes ?? 15);

    if (!roomTypeId || !checkIn) {
      return NextResponse.json({ error: 'Room type and check-in date are required.' }, { status: 400 });
    }

    const booking = await createPendingBooking({
      roomTypeId,
      checkIn,
      guests,
      guestName,
      guestEmail,
      guestPhone,
      holdMinutes,
    });

    return NextResponse.json({ ok: true, booking });
  } catch (error) {
    console.error('Booking hold failed', error);
    return NextResponse.json({ error: 'Unable to create booking hold. Please check your details and try again.' }, { status: 400 });
  }
}
