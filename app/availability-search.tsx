'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

type RoomType = { id: string; name: string; hotel: string; priceKobo: number; depositKobo: number; availableRooms: number; totalRooms: number };
type Branch = { slug: string; name: string; roomTypes: RoomType[] };
type Result = { checkIn: string; checkOut: string; nights: number; branches: Branch[] };

const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString('en-NG')}`;

export default function AvailabilitySearch() {
  const [checkIn, setCheckIn] = useState('');
  const [guests, setGuests] = useState('1');
  const [nights, setNights] = useState('1');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  function addToCart(room: RoomType) {
    const key = 'ephoenix-cart';
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    const existing = items.find((item: { roomTypeId: string; checkIn: string; nights: number; guests: number }) => item.roomTypeId === room.id && item.checkIn === checkIn && item.nights === Number(nights) && item.guests === Number(guests));
    if (existing) existing.quantity += 1;
    else items.push({ roomTypeId: room.id, checkIn, nights: Number(nights), guests: Number(guests), quantity: 1, name: room.name, hotel: room.hotel, priceKobo: room.priceKobo });
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new Event('ephoenix-cart-updated'));
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const response = await fetch(`/api/availability?checkIn=${encodeURIComponent(checkIn)}&guests=${guests}&nights=${nights}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to check availability');
      setResult(data);
    } catch (searchError) { setError(searchError instanceof Error ? searchError.message : 'Unable to check availability'); }
    finally { setLoading(false); }
  }

  return <section id="availability-title" className="availability-panel" aria-labelledby="availability-title">
    <div><div className="eyebrow">Plan your stay</div><h2 id="availability-title">Check room availability</h2><p className="muted">Choose a check-in date and guest count. Stays run for 24 hours, with checkout at noon the following day.</p></div>
    <form className="availability-form" onSubmit={search}>
      <label>Check-in date<input type="date" required value={checkIn} min={new Date().toISOString().slice(0, 10)} onChange={event => setCheckIn(event.target.value)} /></label>
      <label>Guests<input type="number" required min="1" max="20" value={guests} onChange={event => setGuests(event.target.value)} /></label><label>Nights<input type="number" required min="1" max="30" value={nights} onChange={event => setNights(event.target.value)} /></label>
      <button className="button button-gold" type="submit" disabled={loading}>{loading ? 'Checking...' : 'Check availability'}</button>
    </form>
    {error && <p className="search-error" role="alert">{error}</p>}
    {result && <div className="availability-results"><p className="result-window">{result.nights} night{result.nights === 1 ? '' : 's'} · {new Date(result.checkIn).toLocaleString()} to {new Date(result.checkOut).toLocaleString()}</p>{result.branches.map(branch => <section className="availability-branch" key={branch.slug}><Link className="availability-branch-link" href={`/rooms?hotel=${encodeURIComponent(branch.slug)}`}><h3>{branch.name}</h3><span>View all rooms at this branch →</span></Link>{branch.roomTypes.length ? <div className="availability-list">{branch.roomTypes.map(room => <article className="availability-item" key={room.id}><div><strong>{room.name}</strong><span>{room.availableRooms} of {room.totalRooms} rooms available</span></div>    <div className="price">{naira(room.priceKobo * Number(nights))} <small>/ {nights} night{nights === '1' ? '' : 's'}</small></div>    <button type="button" className="button button-outline" onClick={() => addToCart(room)}>Add to cart</button><Link href={`/book?roomTypeId=${encodeURIComponent(room.id)}&checkIn=${encodeURIComponent(checkIn)}&guests=${encodeURIComponent(guests)}&nights=${encodeURIComponent(nights)}`} className="button button-outline">Book now</Link></article>)}</div> : <p className="muted">No rooms match this guest count or date.</p>}</section>)}</div>}
  </section>;
}