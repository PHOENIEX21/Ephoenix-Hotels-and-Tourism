'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function naira(value: number) {
  return `₦${Math.round(value / 100).toLocaleString('en-NG')}`;
}

type BookingFormProps = {
  roomType: {
    id: string;
    name: string;
    priceKobo: number;
    depositKobo: number;
    hotel: { slug: string; name: string };
    capacity: number;
    photoUrls: string[];
  };
  offer?: { name: string; discountType: 'PERCENTAGE' | 'FIXED'; discountValue: number } | null;
  checkIn: string;
  guests: number;
};

export function BookingForm({ roomType, offer, checkIn, guests }: BookingFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [guestName, setGuestName] = useState(session?.user?.name ?? '');
  const [guestEmail, setGuestEmail] = useState(session?.user?.email ?? '');
  const [guestPhone, setGuestPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const pricing = useMemo(() => {
    const isInclusive = roomType.hotel.slug === 'annex-ii';
    const discountKobo = offer?.discountType === 'PERCENTAGE' ? Math.min(roomType.priceKobo, Math.round(roomType.priceKobo * offer.discountValue / 100)) : Math.min(roomType.priceKobo, offer?.discountValue ?? 0);
    const subtotalKobo = roomType.priceKobo - discountKobo;
    const serviceChargeKobo = isInclusive ? 0 : Math.round(subtotalKobo * 0.1);
    const vatKobo = isInclusive ? 0 : Math.round((subtotalKobo + serviceChargeKobo) * 0.075);
    const totalKobo = isInclusive ? subtotalKobo : subtotalKobo + serviceChargeKobo + vatKobo;

    return {
      subtotalKobo,
      serviceChargeKobo,
      vatKobo,
      totalKobo,
      depositKobo: roomType.depositKobo,
      originalSubtotalKobo: roomType.priceKobo,
      discountKobo,
      offerName: offer?.name ?? null,
      vatMode: isInclusive ? 'inclusive' : 'exclusive',
    };
  }, [roomType, offer]);

  async function handlePayNow() {
    if (!bookingId) {
      setError('Create a booking hold before paying.');
      return;
    }
    setPaying(true);
    setError('');
    try {
      const response = await fetch('/api/payments/paystack/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, email: guestEmail }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to start payment.');

      setReference(payload.reference);
      window.location.href = payload.authorization_url;
    } catch (payError) {
      setError(payError instanceof Error ? payError.message : 'Unable to start payment.');
    } finally {
      setPaying(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage(null);

    try {
      const response = await fetch('/api/bookings/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId: roomType.id,
          checkIn,
          guests,
          guestName,
          guestEmail,
          guestPhone,
          holdMinutes: 15,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to create booking hold.');

      setBookingId(payload.booking.id);
      setReference(payload.booking.reference);
      setMessage(`Booking hold created. Reference: ${payload.booking.reference}. Expires at ${new Date(payload.booking.expiresAt).toLocaleString()}.`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create booking hold.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1.2fr 0.8fr' }}>
        <section>
          <h1>Complete your booking</h1>
          <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
            <h2>{roomType.name}</h2>
            <p>{roomType.hotel.name}</p>
            <p>Check-in: {new Date(`${checkIn}T12:00:00`).toLocaleDateString()}</p>
            <p>Guests: {guests}</p>
            <p>Stay model: 24-hour stay · checkout at noon the following day</p>
            {roomType.photoUrls[0] ? <img src={roomType.photoUrls[0]} alt={roomType.name} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10 }} /> : null}
          </div>
        </section>

        <aside style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
          <h3>Pricing summary</h3>
          <p>{pricing.vatMode === 'exclusive' ? 'VAT/service charge added' : 'Price includes VAT and service charge'}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            <li>Room rate: {naira(pricing.subtotalKobo)}</li>
            {pricing.discountKobo > 0 ? <li>Offer discount: -{naira(pricing.discountKobo)} ({pricing.offerName})</li> : null}
            <li>Service charge: {naira(pricing.serviceChargeKobo)}</li>
            <li>VAT: {naira(pricing.vatKobo)}</li>
            <li>Deposit: {naira(pricing.depositKobo)}</li>
            <li><strong>Total hold amount: {naira(pricing.totalKobo)}</strong></li>
          </ul>
        </aside>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', marginTop: '2rem', maxWidth: 600 }}>
        <label>
          Full name
          <input value={guestName} onChange={event => setGuestName(event.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={guestEmail} onChange={event => setGuestEmail(event.target.value)} required />
        </label>
        <label>
          Phone
          <input value={guestPhone} onChange={event => setGuestPhone(event.target.value)} required />
        </label>

        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        {message ? <p style={{ color: 'green' }}>{message}</p> : null}

        <button type="submit" disabled={submitting}>{submitting ? 'Creating booking...' : 'Create pending hold'}</button>
        {bookingId ? <button type="button" onClick={handlePayNow} disabled={paying}>{paying ? 'Redirecting to Paystack...' : 'Pay with Paystack'}</button> : null}
        {reference ? <p>Reference: {reference}</p> : null}
      </form>
    </main>
  );
}
