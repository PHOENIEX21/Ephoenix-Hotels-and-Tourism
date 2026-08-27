'use client';

import { FormEvent, useEffect, useState } from 'react';

type Booking = { id: string; reference: string; guestName: string | null; guestEmail: string; status: string; checkIn: string; checkOut: string; checkedInAt: string | null; checkedOutAt: string | null; room: { number: string; roomType: { name: string }; hotel: { name: string } } };
type Dashboard = { user: { name: string; role: string; hotelId: string | null }; bookings: Booking[]; todayBookings: Booking[]; otherBranches: { hotel: string; roomType: string; totalRooms: number; availableRooms: number }[]; roomTypes: { id: string; name: string; priceKobo: number; depositKobo: number; hotel: { name: string } }[] };

export default function StaffDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/staff/dashboard?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`);
    const payload = await response.json();
    if (!response.ok) setError(payload.error || 'Unable to load dashboard.');
    else { setData(payload); setError(''); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [status]);

  async function updateBooking(id: string, action: string) {
    const response = await fetch(`/api/staff/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    if (!response.ok) { const payload = await response.json(); setError(payload.error); return; }
    load();
  }

  async function updatePricing(id: string, priceKobo: number, depositKobo: number) {
    const response = await fetch(`/api/staff/room-types/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priceKobo, depositKobo }) });
    if (!response.ok) { const payload = await response.json(); setError(payload.error); return; }
    load();
  }

  async function createWalkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch('/api/staff/dashboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const payload = await response.json();
    if (!response.ok) { setError(payload.error); return; }
    form.reset();
    load();
  }

  if (loading && !data) return <main style={{ maxWidth: 1100, margin: '4rem auto', padding: '0 1rem' }}><p>Loading staff dashboard...</p></main>;
  return <main style={{ maxWidth: 1100, margin: '4rem auto', padding: '0 1rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}><div><h1>Operations dashboard</h1><p>{data?.user.name} · {data?.user.role}</p></div><div><a href="/staff/login">Switch account</a>{data?.user.role === 'ADMIN' ? <><a href="/staff/reports" style={{ marginLeft: 16 }}>Reports</a><a href="/staff/offers" style={{ marginLeft: 16 }}>Offers</a><a href="/staff/reviews" style={{ marginLeft: 16 }}>Reviews</a></> : null}</div></div>
    {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
    <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', margin: '2rem 0' }}><div className="card card-body"><h2>Today</h2><p>{data?.todayBookings.length ?? 0} arrivals or departures</p></div><div className="card card-body"><h2>Reservations</h2><p>{data?.bookings.length ?? 0} matching bookings</p></div><div className="card card-body"><h2>Access</h2><p>{data?.user.role === 'ADMIN' ? 'All branches' : 'Own branch detail'}</p></div></section>
    <section><h2>Walk-in booking</h2><form onSubmit={createWalkIn} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '1rem 0' }}><select name="roomTypeId" required defaultValue=""><option value="" disabled>Select room type</option>{data?.roomTypes.map(roomType => <option key={roomType.id} value={roomType.id}>{roomType.hotel.name} · {roomType.name}</option>)}</select><input name="checkIn" type="date" required /><input name="guests" type="number" min="1" max="20" defaultValue="1" required /><input name="guestName" placeholder="Guest name" required /><input name="guestEmail" type="email" placeholder="Guest email" required /><input name="guestPhone" placeholder="Guest phone" required /><button type="submit">Create walk-in booking</button></form></section>
  <section><h2>Reservations</h2><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '1rem 0' }}><input placeholder="Search reference, guest name or email" value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') load(); }} /><select value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option><option value="CANCELLED">Cancelled</option><option value="COMPLETED">Completed</option></select><button type="button" onClick={load}>Search</button></div><div style={{ overflowX: 'auto' }}><table><thead><tr><th>Reference</th><th>Guest</th><th>Branch / room</th><th>Stay</th><th>Status</th><th>Presence</th></tr></thead><tbody>{data?.bookings.map(booking => <tr key={booking.id}><td>{booking.reference}</td><td>{booking.guestName}<br />{booking.guestEmail}</td><td>{booking.room.hotel.name}<br />{booking.room.roomType.name} · {booking.room.number}</td><td>{new Date(booking.checkIn).toLocaleDateString()} to {new Date(booking.checkOut).toLocaleDateString()}</td><td>{booking.status}</td><td><button type="button" onClick={() => updateBooking(booking.id, 'check-in')} disabled={!!booking.checkedInAt}>Check in</button> <button type="button" onClick={() => updateBooking(booking.id, 'check-out')} disabled={!!booking.checkedOutAt}>Check out</button></td></tr>)}</tbody></table></div></section>
    {data?.user.role !== 'ADMIN' ? <section><h2>Other branch availability summary</h2><ul>{data?.otherBranches.map(item => <li key={item.hotel + item.roomType}>{item.hotel}: {item.roomType} · {item.availableRooms} of {item.totalRooms} available</li>)}</ul></section> : <section><h2>Room type pricing</h2><div style={{ display: 'grid', gap: 8 }}>{data.roomTypes.map(roomType => <form key={roomType.id} onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); updatePricing(roomType.id, Number(form.get('priceKobo')), Number(form.get('depositKobo'))); }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><strong>{roomType.hotel.name} · {roomType.name}</strong><input name="priceKobo" type="number" defaultValue={roomType.priceKobo} min="0" /><input name="depositKobo" type="number" defaultValue={roomType.depositKobo} min="0" /><button type="submit">Save pricing</button></form>)}</div></section>}
  </main>;
}
