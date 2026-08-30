import { BookingStatus, PaymentStatus, RefundStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { getPaystackRefundStatus, refundPaystackTransaction, sendCancellationConfirmationEmail } from '../../../../lib/payments';
import { clientKey, rateLimit } from '../../../../lib/security';
import { writeAudit } from '../../../../lib/audit';

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`cancel:${clientKey(request)}`, 10);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many cancellation attempts. Please try again shortly.' }, { status: 429 });
    const body = await request.json();
    const reference = String(body?.reference ?? '').trim();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const session = await getServerSession(authOptions);
    const sessionEmail = session?.user?.email?.toLowerCase();
    const lookupEmail = sessionEmail || email;
    if (!reference || !lookupEmail) return NextResponse.json({ error: 'Booking reference and guest email are required.' }, { status: 400 });

    const booking = await prisma.booking.findFirst({
      where: { reference, guestEmail: lookupEmail },
      include: { refund: true },
    });
    if (!booking) return NextResponse.json({ error: 'Confirmed booking was not found for these details.' }, { status: 404 });
    if (booking.status === BookingStatus.CANCELLED) return NextResponse.json({ error: 'This booking has already been cancelled.' }, { status: 400 });
    if (booking.status !== BookingStatus.CONFIRMED) return NextResponse.json({ error: 'This booking is not yet confirmed and cannot be cancelled — pending holds expire automatically if payment isn\'t completed.' }, { status: 400 });
    if (booking.refund?.status === RefundStatus.PENDING && booking.refund.providerReference) {
      const providerStatus = (await getPaystackRefundStatus(booking.refund.providerReference)).toLowerCase();
      if (!['processed', 'success', 'successful', 'completed'].includes(providerStatus)) {
        return NextResponse.json({ ok: true, status: 'refund-pending', reference, refundStatus: providerStatus }, { status: 202 });
      }
      await prisma.refund.update({ where: { id: booking.refund.id }, data: { status: RefundStatus.SUCCESSFUL } });
      await prisma.booking.update({ where: { id: booking.id }, data: { status: BookingStatus.CANCELLED } });
      if (booking.refund.requestedAmountKobo > 0) await prisma.payment.updateMany({ where: { bookingId: booking.id, provider: 'paystack' }, data: { status: PaymentStatus.REFUNDED, refundedAt: new Date() } });
      await sendCancellationConfirmationEmail(booking.id, booking.refund.requestedAmountKobo, booking.refund.adminChargeKobo, booking.refund.reason);
      return NextResponse.json({ ok: true, status: 'cancelled', reference, refundAmountKobo: booking.refund.requestedAmountKobo });
    }

    const hoursUntilArrival = (booking.checkIn.getTime() - Date.now()) / 3600000;
    const chargePercent = hoursUntilArrival <= 0 ? 100 : hoursUntilArrival >= 24 ? 20 : 50;
    const payment = await prisma.payment.findFirst({ where: { bookingId: booking.id, provider: 'paystack', status: PaymentStatus.SUCCESSFUL }, orderBy: { id: 'desc' } });
    const paidAmountKobo = payment?.amountKobo ?? booking.totalKobo;
    const refundableDepositKobo = Math.min(booking.depositKobo, paidAmountKobo);
    const refundableBeforeAdminKobo = Math.round(refundableDepositKobo * (100 - chargePercent) / 100);
    const adminChargeKobo = Math.round(refundableBeforeAdminKobo * 0.075);
    const refundAmountKobo = Math.max(0, refundableBeforeAdminKobo - adminChargeKobo);
    const reason = chargePercent === 100 ? '100% no-show charge' : `${chargePercent}% cancellation charge (${hoursUntilArrival.toFixed(1)} hours before arrival)`;

    const refund = await prisma.refund.upsert({
      where: { bookingId: booking.id },
      create: { bookingId: booking.id, provider: 'paystack', requestedAmountKobo: refundAmountKobo, adminChargeKobo, reason, status: RefundStatus.PENDING },
      update: { requestedAmountKobo: refundAmountKobo, adminChargeKobo, reason, status: RefundStatus.PENDING },
    });

    let refundStatus: RefundStatus = RefundStatus.SUCCESSFUL;
    let providerReference: string | undefined;
    if (refundAmountKobo > 0) {
      if (!payment?.providerReference) throw new Error('Successful Paystack transaction reference is missing.');
      const providerRefund = await refundPaystackTransaction(payment.providerReference, refundAmountKobo);
      providerReference = providerRefund.reference;
      refundStatus = providerRefund.status.toLowerCase() === 'processed' || providerRefund.status.toLowerCase() === 'success' ? RefundStatus.SUCCESSFUL : RefundStatus.PENDING;
    }

    await prisma.refund.update({ where: { id: refund.id }, data: { status: refundStatus, providerReference } });
    await writeAudit(null, 'REFUND_REQUESTED', 'Refund', refund.id, { bookingId: booking.id, amountKobo: refundAmountKobo, chargePercent });
    if (refundStatus === RefundStatus.SUCCESSFUL) {
      await prisma.booking.update({ where: { id: booking.id }, data: { status: BookingStatus.CANCELLED } });
      if (refundAmountKobo > 0) await prisma.payment.updateMany({ where: { bookingId: booking.id, provider: 'paystack' }, data: { status: PaymentStatus.REFUNDED, refundedAt: new Date() } });
      await sendCancellationConfirmationEmail(booking.id, refundAmountKobo, adminChargeKobo, reason);
    }
    return NextResponse.json({ ok: true, status: refundStatus === RefundStatus.SUCCESSFUL ? 'cancelled' : 'refund-pending', reference, chargePercent, paidAmountKobo, adminChargeKobo, refundAmountKobo }, { status: refundStatus === RefundStatus.SUCCESSFUL ? 200 : 202 });
  } catch (error) {
    console.error('Booking cancellation failed', error);
    return NextResponse.json({ error: 'Unable to cancel booking. Please try again or contact the hotel.' }, { status: 400 });
  }
}