import { NextRequest, NextResponse } from 'next/server';
import { PaymentStatus, BookingStatus } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';
import { createPaystackTransaction } from '../../../../../lib/payments';
import { clientKey, rateLimit } from '../../../../../lib/security';

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`payment-initiate:${clientKey(request)}`, 10);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many payment attempts. Please try again shortly.' }, { status: 429 });
    const body = await request.json();
    const bookingId = String(body?.bookingId ?? '').trim();
    const orderId = String(body?.orderId ?? '').trim();
    const email = String(body?.email ?? '').trim().toLowerCase();

    if ((!bookingId && !orderId) || !email) {
      return NextResponse.json({ error: 'Booking or order ID and email are required.' }, { status: 400 });
    }

    const order = orderId ? await prisma.order.findUnique({ where: { id: orderId }, include: { items: { include: { booking: true } } } }) : null;
    const booking = bookingId ? await prisma.booking.findUnique({ where: { id: bookingId } }) : order?.items[0]?.booking;

    if (!booking || (orderId && !order)) {
      return NextResponse.json({ error: 'Booking or order not found.' }, { status: 404 });
    }

    if (booking.status !== BookingStatus.PENDING || (order && order.status !== 'PENDING')) {
      return NextResponse.json({ error: 'This booking is no longer pending and cannot be paid for.' }, { status: 400 });
    }

    const existingPayment = await prisma.payment.findFirst({ where: order ? { orderId: order.id, provider: 'paystack' } : { bookingId: booking.id, provider: 'paystack' } });
    if (existingPayment && existingPayment.status === PaymentStatus.SUCCESSFUL) {
      return NextResponse.json({ error: 'The payment for this booking has already been completed.' }, { status: 400 });
    }

    const transaction = await createPaystackTransaction({
      bookingId: booking.id,
      amountKobo: order?.totalKobo || booking.totalKobo || booking.depositKobo || 0,
      email,
      userName: booking.guestName || 'Guest',
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/payments/paystack/verify`,
    });

    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {         amountKobo: order?.totalKobo || booking.totalKobo || booking.depositKobo || 0, providerReference: transaction.reference, status: PaymentStatus.PENDING },
      });
    } else {
      await prisma.payment.create({
        data: {
          bookingId: order ? undefined : booking.id,
          orderId: order?.id,
          provider: 'paystack',
          amountKobo: order?.totalKobo || booking.totalKobo || booking.depositKobo || 0,
          currency: 'NGN',
          providerReference: transaction.reference,
          status: PaymentStatus.PENDING,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      orderId: order?.id,
      reference: transaction.reference,
      authorization_url: transaction.authorization_url,
    });
  } catch (error) {
    console.error('Payment initialization failed', error);
    return NextResponse.json({ error: 'Unable to initialize payment. Please try again.' }, { status: 400 });
  }
}
