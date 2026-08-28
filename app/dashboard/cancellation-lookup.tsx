'use client';

import { FormEvent, useState } from 'react';

export default function CancellationLookup({ reference = '', email = '', disabled = false }: { reference?: string; email?: string; disabled?: boolean }) {
  const [bookingReference, setBookingReference] = useState(reference);
  const [guestEmail, setGuestEmail] = useState(email);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setMessage(''); setError('');
    try { const response = await fetch('/api/bookings/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reference: bookingReference, email: guestEmail }) }); const raw = await response.text(); let payload: { error?: string; status?: string; refundAmountKobo?: number }; try { payload = JSON.parse(raw); } catch { throw new Error(response.ok ? 'The cancellation service returned an invalid response.' : `Cancellation service error (${response.status}).`); } if (!response.ok) throw new Error(payload.error || 'Unable to cancel booking.'); setMessage(`Cancellation ${payload.status}. Refund: NGN ${((payload.refundAmountKobo || 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}.`); } catch (cancelError) { setError(cancelError instanceof Error ? cancelError.message : 'Unable to cancel booking.'); } finally { setLoading(false); }
  }
  return <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 500 }}><label>Booking reference<input value={bookingReference} onChange={event => setBookingReference(event.target.value)} required disabled={disabled} /></label><label>Guest email<input type="email" value={guestEmail} onChange={event => setGuestEmail(event.target.value)} required disabled={disabled} /></label><button type="submit" disabled={disabled || loading}>{loading ? 'Processing refund...' : 'Request cancellation'}</button>{message ? <p style={{ color: 'green' }}>{message}</p> : null}{error ? <p style={{ color: 'crimson' }}>{error}</p> : null}</form>;
}