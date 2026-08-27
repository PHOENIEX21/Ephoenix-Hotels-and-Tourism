import crypto from 'crypto';
import { prisma } from './prisma';

export type PaymentProvider = 'paystack' | 'flutterwave' | 'stripe';

export type PaymentProviderConfig = {
  name: string;
  enabled: boolean;
  publicKey?: string;
};

export const paymentProviders: Record<PaymentProvider, PaymentProviderConfig> = {
  paystack: { name: 'Paystack', enabled: true, publicKey: process.env.PAYSTACK_PUBLIC_KEY },
  flutterwave: { name: 'Flutterwave', enabled: false },
  stripe: { name: 'Stripe', enabled: false },
};

export function getPaystackConfig() {
  const publicKey = process.env.PAYSTACK_PUBLIC_KEY ?? '';
  const secretKey = process.env.PAYSTACK_SECRET_KEY ?? '';

  return {
    publicKey,
    secretKey,
    enabled: Boolean(publicKey && secretKey),
  };
}

export function verifyPaystackWebhookSignature(rawBody: string, signature: string | null) {
  const { secretKey } = getPaystackConfig();
  if (!secretKey || !signature) return false;

  const expected = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
  const normalizedSignature = signature.replace(/^sha512=/i, '').trim();

  if (!normalizedSignature || normalizedSignature.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(normalizedSignature));
}

export async function createPaystackTransaction(input: {
  bookingId: string;
  amountKobo: number;
  email: string;
  userName?: string;
  callbackUrl?: string;
}) {
  const { secretKey } = getPaystackConfig();
  if (!secretKey) {
    throw new Error('Paystack test keys are not configured.');
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: 'NGN',
      callback_url: input.callbackUrl ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/payments/paystack/verify`,
      metadata: {
        booking_id: input.bookingId,
        user_name: input.userName ?? '',
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload?.data?.authorization_url) {
    throw new Error(payload?.message || 'Unable to initialize Paystack payment.');
  }

  return payload.data as {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function verifyPaystackTransaction(reference: string) {
  const { secretKey } = getPaystackConfig();
  if (!secretKey) {
    throw new Error('Paystack test keys are not configured.');
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });

  const payload = await response.json();
  if (!response.ok || !payload?.data) {
    throw new Error(payload?.message || 'Unable to verify Paystack transaction.');
  }

  return payload.data as {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at?: string;
    channel?: string;
    customer?: { email?: string };
  };
}

export async function sendBookingConfirmationEmail(bookingId: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    throw new Error('SendGrid email configuration is missing.');
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking record not found for confirmation email.');

  const room = await prisma.room.findUnique({
    where: { id: booking.roomId },
    include: { roomType: true, hotel: { include: { policies: true } } },
  });
  if (!room) throw new Error('Room record not found for confirmation email.');

  const payment = await prisma.payment.findFirst({
    where: { bookingId, provider: 'paystack', status: 'SUCCESSFUL' },
    orderBy: { id: 'desc' },
  });
  const amountPaidKobo = payment?.amountKobo ?? booking.totalKobo;
  const amountPaid = `NGN ${(amountPaidKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  const checkIn = booking.checkIn.toLocaleDateString('en-NG', { dateStyle: 'full' });
  const checkOut = booking.checkOut.toLocaleDateString('en-NG', { dateStyle: 'full' });
  const cancellationPolicy = room.hotel.policies
    .filter(policy => policy.item.toLowerCase().includes('cancellation') || policy.item.toLowerCase() === 'no-show')
    .map(policy => `${policy.item}: ${policy.detail}`)
    .join('\n');
  const text = [
    `Booking confirmed: ${booking.reference}`,
    `Room: ${room.roomType.name}`,
    `Branch: ${room.hotel.name}`,
    `Address: ${room.hotel.address}`,
    `Check-in: ${checkIn}`,
    `Stay: 24-hour stay model; checkout at 12:00 noon the following day (${checkOut}).`,
    `Total amount paid: ${amountPaid}`,
    'Cancellation policy:',
    cancellationPolicy,
  ].join('\n');
  const html = text
    .split('\n')
    .map(line => `<p>${line || '&nbsp;'}</p>`)
    .join('');

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: booking.guestEmail, name: booking.guestName || undefined }] }],
      from: { email: fromEmail, name: 'E-Phoenix Hotels and Tourism' },
      subject: `Booking confirmed: ${booking.reference}`,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });

  const responseBody = await response.text();
  if (!response.ok) {
    throw new Error(`SendGrid mail send failed (HTTP ${response.status}): ${responseBody || '<empty response body>'}`);
  }
}

export async function refundPaystackTransaction(transaction: string, amountKobo: number) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('Paystack test keys are not configured.');

  const response = await fetch('https://api.paystack.co/refund', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction, amount: amountKobo }),
  });
  const responseBody = await response.text();
  let payload: { status?: boolean; message?: string; data?: { id?: string; status?: string } } = {};
  try { payload = JSON.parse(responseBody); } catch { /* Preserve the provider body below. */ }
  if (!response.ok || !payload.status) {
    throw new Error(`Paystack refund failed (HTTP ${response.status}): ${responseBody || '<empty response body>'}`);
  }
  return { reference: payload.data?.id ? String(payload.data.id) : undefined, status: payload.data?.status ?? 'pending' };
}

export async function getPaystackRefundStatus(refundId: string) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('Paystack test keys are not configured.');
  const response = await fetch(`https://api.paystack.co/refund/${encodeURIComponent(refundId)}`, { headers: { Authorization: `Bearer ${secretKey}` } });
  const responseBody = await response.text();
  let payload: { status?: boolean; message?: string; data?: { status?: string } } = {};
  try { payload = JSON.parse(responseBody); } catch { /* Preserve the provider body below. */ }
  if (!response.ok || !payload.status) throw new Error(`Paystack refund status failed (HTTP ${response.status}): ${responseBody || '<empty response body>'}`);
  return payload.data?.status ?? 'pending';
}

export async function sendCancellationConfirmationEmail(bookingId: string, refundAmountKobo: number, adminChargeKobo: number, reason: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  if (!apiKey || !fromEmail) throw new Error('SendGrid email configuration is missing.');

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking record not found for cancellation email.');
  const room = await prisma.room.findUnique({ where: { id: booking.roomId }, include: { roomType: true, hotel: true } });
  if (!room) throw new Error('Room record not found for cancellation email.');
  const money = (amountKobo: number) => `NGN ${(amountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  const text = [
    `Booking cancelled: ${booking.reference}`,
    `Room: ${room.roomType.name}`,
    `Branch: ${room.hotel.name}`,
    `Address: ${room.hotel.address}`,
    `Check-in: ${booking.checkIn.toLocaleDateString('en-NG', { dateStyle: 'full' })}`,
    `Cancellation policy applied: ${reason}`,
    `Refund amount: ${money(refundAmountKobo)}`,
    `Administrative charge: ${money(adminChargeKobo)}`,
    'Paystack refunds may remain pending while the provider processes them.',
  ].join('\n');
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: booking.guestEmail, name: booking.guestName || undefined }] }],
      from: { email: fromEmail, name: 'E-Phoenix Hotels and Tourism' },
      subject: `Booking cancelled: ${booking.reference}`,
      content: [{ type: 'text/plain', value: text }, { type: 'text/html', value: text.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('') }],
    }),
  });
  const responseBody = await response.text();
  if (!response.ok) throw new Error(`SendGrid cancellation email failed (HTTP ${response.status}): ${responseBody || '<empty response body>'}`);
  return { status: response.status, body: responseBody, messageId: response.headers.get('x-message-id') };
}

export function getPaymentProvider(provider: PaymentProvider) {
  const config = paymentProviders[provider];

  return {
    ...config,
    createCheckoutUrl: async () => {
      throw new Error(`${provider} payment integration is not yet implemented in this phase.`);
    },
  };
}
