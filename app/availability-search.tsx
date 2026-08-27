'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

type RoomType = { id: string; name: string; hotel: string; priceKobo: number; depositKobo: number; availableRooms: number; totalRooms: number };
type Branch = { slug: string; name: string; roomTypes: RoomType[] };
type Result = { checkIn: string; checkOut: string; branches: Branch[] };

const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString('en-NG')}`;

export default function AvailabilitySearch() {
  const [checkIn, setCheckIn] = useState('');
  const [guests, setGuests] = useState('1');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const response = await fetch(`/api/availability?checkIn=${encodeURIComponent(checkIn)}&guests=${guests}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to check availability');
      setResult(data);
    } catch (searchError) { setError(searchError instanceof Error ? searchError.message : 'Unable to check availability'); }
    finally { setLoading(false); }
  }

  return <section className="availability-panel" aria-labelledby="availability-title">
    <div><div className="eyebrow">Plan your stay</div><h2 id="availability-title">Check room availability</h2><p className="muted">Choose a check-in date and guest count. Stays run for 24 hours, with checkout at noon the following day.</p></div>
    <form className="availability-form" onSubmit={search}>
      <label>Check-in date<input type="date" required value={checkIn} min={new Date().toISOString().slice(0, 10)} onChange={event => setCheckIn(event.target.value)} /></label>
      <label>Guests<input type="number" required min="1" max="20" value={guests} onChange={event => setGuests(event.target.value)} /></label>
      <button className="button button-gold" type="submit" disabled={loading}>{loading ? 'Checking...' : 'Check availability'}</button>
    </form>
    {error && <p className="search-error" role="alert">{error}</p>}
    {result && <div className="availability-results"><p className="result-window">{new Date(result.checkIn).toLocaleString()} to {new Date(result.checkOut).toLocaleString()}</p>{result.branches.map(branch => <section className="availability-branch" key={branch.slug}><h3>{branch.name}</h3>{branch.roomTypes.length ? <div className="availability-list">{branch.roomTypes.map(room => <article className="availability-item" key={room.id}><div><strong>{room.name}</strong><span>{room.availableRooms} of {room.totalRooms} rooms available</span></div><div className="price">{naira(room.priceKobo)} <small>/ 24 hours</small></div><Link href={`/book?roomTypeId=${encodeURIComponent(room.id)}&checkIn=${encodeURIComponent(checkIn)}&guests=${encodeURIComponent(guests)}`} className="button button-outline">Select room</Link></article>)}</div> : <p className="muted">No rooms match this guest count or date.</p>}</section>)}</div>}
  </section>;
}