import { NextRequest, NextResponse } from 'next/server';
import { PaymentStatus, BookingStatus, RefundStatus } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';
import { sendBookingConfirmationEmail, sendCancellationConfirmationEmail, verifyPaystackWebhookSignature } from '../../../../../lib/payments';
import { writeAudit } from '../../../../../lib/audit';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!verifyPaystackWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid Paystack signature.' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    if (!event || !data || !data.reference) {
      return NextResponse.json({ error: 'Malformed Paystack webhook payload.' }, { status: 400 });
    }

    if (event === 'charge.success' || event === 'transaction.success') {
      const payment = await prisma.payment.findFirst({ where: { providerReference: data.reference, provider: 'paystack' } });
      if (payment) {
        // Amount verification (belt-and-braces per §9): never confirm a booking for a
        // different amount than we recorded. data.amount is in kobo.
        if (typeof data.amount === 'number' && payment.amountKobo !== data.amount) {
          console.error('Paystack amount mismatch', { reference: data.reference, expectedKobo: payment.amountKobo, receivedKobo: data.amount });
          await prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
          return NextResponse.json({ error: 'Payment amount mismatch.' }, { status: 200 });
        }
        const wasSuccessful = payment.status === PaymentStatus.SUCCESSFUL;
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.SUCCESSFUL, paidAt: data.paid_at ? new Date(data.paid_at) : new Date() },
        });
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: BookingStatus.CONFIRMED },
        });
        if (!wasSuccessful) {
          await writeAudit(null, 'BOOKING_CONFIRMED', 'Booking', payment.bookingId, { reference: data.reference, provider: 'paystack', amountKobo: payment.amountKobo });
          await sendBookingConfirmationEmail(payment.bookingId);
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (event === 'charge.failed' || event === 'transaction.failed') {
      const payment = await prisma.payment.findFirst({ where: { providerReference: data.reference, provider: 'paystack' } });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (event === 'refund.processed' || event === 'refund.success') {
      const refundId = String(data.id ?? data.reference ?? '');
      const refund = await prisma.refund.findFirst({ where: { providerReference: refundId }, include: { booking: true } });
      if (refund && refund.status !== RefundStatus.SUCCESSFUL) {
        await prisma.refund.update({ where: { id: refund.id }, data: { status: RefundStatus.SUCCESSFUL } });
        await prisma.booking.update({ where: { id: refund.bookingId }, data: { status: BookingStatus.CANCELLED } });
        await prisma.payment.updateMany({ where: { bookingId: refund.bookingId, provider: 'paystack' }, data: { status: PaymentStatus.REFUNDED, refundedAt: new Date() } });
        await writeAudit(null, 'REFUND_COMPLETED', 'Refund', refund.id, { bookingId: refund.bookingId, providerReference: refundId, amountKobo: refund.requestedAmountKobo });
        console.info('[refund.processed] entering cancellation email send', { bookingId: refund.bookingId, refundId });
        const emailResult = await sendCancellationConfirmationEmail(refund.bookingId, refund.requestedAmountKobo, refund.adminChargeKobo, refund.reason);
        console.info('[refund.processed] cancellation email send completed', { bookingId: refund.bookingId, refundId, ...emailResult });
      }
      return NextResponse.json({ ok: true });
    }

    if (event === 'refund.failed') {
      const refundId = String(data.id ?? data.reference ?? '');
      await prisma.refund.updateMany({ where: { providerReference: refundId }, data: { status: RefundStatus.FAILED } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Paystack webhook failed', error);
    return NextResponse.json({ error: 'Unable to process payment notification.' }, { status: 400 });
  }
}
