import { BookingStatus, Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireStaff } from '../../../lib/staff';
import { clientKey, rateLimit } from '../../../lib/security';
import { writeAudit } from '../../../lib/audit';

export async function GET(request: NextRequest) {
  const roomTypeId = request.nextUrl.searchParams.get('roomTypeId');
  if (!roomTypeId) return NextResponse.json({ error: 'Room type is required.' }, { status: 400 });
  const reviews = await prisma.review.findMany({ where: { roomTypeId, published: true }, orderBy: { createdAt: 'desc' }, select: { guestName: true, rating: true, body: true, createdAt: true } });
  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`review:${clientKey(request)}`, 10);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many review attempts. Please try again later.' }, { status: 429 });
    const body = await request.json();
    const reference = String(body?.reference ?? '').trim(); const email = String(body?.email ?? '').trim().toLowerCase(); const rating = Number(body?.rating); const reviewBody = String(body?.body ?? '').trim();
    if (!reference || !email || !Number.isInteger(rating) || rating < 1 || rating > 5 || !reviewBody) return NextResponse.json({ error: 'Reference, email, a 1-5 rating, and written review are required.' }, { status: 400 });
    const booking = await prisma.booking.findFirst({ where: { reference, guestEmail: email }, include: { room: { include: { roomType: true, hotel: true } }, review: true } });
    if (!booking) return NextResponse.json({ error: 'Booking was not found for these details.' }, { status: 404 });
    if (booking.status !== BookingStatus.CONFIRMED || booking.checkIn >= new Date()) return NextResponse.json({ error: 'Reviews are available after your confirmed stay has started.' }, { status: 400 });
    if (booking.review) return NextResponse.json({ error: 'This booking already has a review.' }, { status: 409 });
    const review = await prisma.review.create({ data: { bookingId: booking.id, hotelId: booking.room.hotelId, roomTypeId: booking.room.roomTypeId, guestName: booking.guestName || 'Guest', rating, body: reviewBody } });
    return NextResponse.json({ ok: true, published: review.published, message: 'Review submitted for admin approval.' }, { status: 201 });
  } catch (error) { console.error('Review submission failed', error); return NextResponse.json({ error: 'Unable to submit review. Please check your details and try again.' }, { status: 400 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireStaff();
    if (user.role !== Role.ADMIN) return NextResponse.json({ error: 'Only admins can moderate reviews.' }, { status: 403 });
    const body = await request.json(); const id = String(body?.id ?? ''); const published = Boolean(body?.published);
    const review = await prisma.review.update({ where: { id }, data: { published } });
    await writeAudit(user.id, published ? 'REVIEW_APPROVED' : 'REVIEW_UNPUBLISHED', 'Review', id, { published });
    return NextResponse.json({ ok: true, review });
  } catch (error) { console.error('Review moderation failed', error); return NextResponse.json({ error: 'Unable to moderate review.' }, { status: 400 }); }
}