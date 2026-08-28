import { NextRequest, NextResponse } from 'next/server';
import { PaymentStatus, BookingStatus } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';
import { sendBookingConfirmationEmail, verifyPaystackTransaction } from '../../../../../lib/payments';
import { writeAudit } from '../../../../../lib/audit';

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get('reference');
    if (!reference) {
      return NextResponse.json({ error: 'Payment reference is required.' }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({ where: { providerReference: reference, provider: 'paystack' }, include: { order: { include: { items: true } } } });
    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 });
    }

    const verification = await verifyPaystackTransaction(reference);
    if (verification.status === 'success') {
      if (typeof verification.amount === 'number' && payment.amountKobo !== verification.amount) {
        console.error('Paystack amount mismatch', { reference, expectedKobo: payment.amountKobo, receivedKobo: verification.amount });
        await prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
        return NextResponse.json({ error: 'Payment amount mismatch.' }, { status: 400 });
      }
      const wasSuccessful = payment.status === PaymentStatus.SUCCESSFUL;
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.SUCCESSFUL, paidAt: verification.paid_at ? new Date(verification.paid_at) : new Date() },
      });
      if (payment.bookingId) await prisma.booking.update({ where: { id: payment.bookingId }, data: { status: BookingStatus.CONFIRMED } });
      if (payment.orderId && payment.order) {
        await prisma.booking.updateMany({ where: { id: { in: payment.order.items.map(item => item.bookingId) } }, data: { status: BookingStatus.CONFIRMED } });
        await prisma.order.update({ where: { id: payment.orderId }, data: { status: 'CONFIRMED' } });
      }
      if (!wasSuccessful) {
        const bookingIds = payment.order?.items.map(item => item.bookingId) ?? (payment.bookingId ? [payment.bookingId] : []);
        for (const bookingId of bookingIds) {
          await writeAudit(null, 'BOOKING_CONFIRMED', 'Booking', bookingId, { reference, provider: 'paystack', amountKobo: payment.amountKobo });
          await sendBookingConfirmationEmail(bookingId);
        }
      }
      return NextResponse.json({ ok: true, status: 'confirmed', reference });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });

    return NextResponse.json({ ok: true, status: 'failed', reference });
  } catch (error) {
    console.error('Payment verification failed', error);
    return NextResponse.json({ error: 'Unable to verify payment. Please try again.' }, { status: 400 });
  }
}
