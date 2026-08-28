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

  if (loading && !data) return <main className="operations-page"><div className="loading-panel"><p>Loading your operations dashboard...</p></div></main>;
  const branchName = data?.user.role === 'ADMIN' ? 'All branches' : data?.roomTypes[0]?.hotel.name || 'Your branch';
  return <main className="operations-page"><header className="operations-header"><div><div className="auth-kicker">{data?.user.role === 'ADMIN' ? 'Administrator workspace' : 'Branch workspace'}</div><h1>Good day, {data?.user.name?.split(' ')[0] || 'team'}</h1><p>{branchName} · {data?.user.role === 'ADMIN' ? 'Full access' : 'Branch access'}</p></div><div className="operations-links"><a href="/staff/login">Switch account</a>{data?.user.role === 'ADMIN' ? <><a href="/admin">Admin home</a><a href="/staff/reports">Reports</a><a href="/staff/offers">Offers</a><a href="/staff/reviews">Reviews</a></> : null}</div></header>{error ? <p className="dashboard-alert" role="alert">{error}</p> : null}<section className="operations-stats"><div className="stat-card"><span>Today</span><strong>{data?.todayBookings.length ?? 0}</strong><p>arrivals or departures</p></div><div className="stat-card"><span>Reservations</span><strong>{data?.bookings.length ?? 0}</strong><p>matching bookings</p></div><div className="stat-card"><span>Access</span><strong>{data?.user.role === 'ADMIN' ? '3' : '1'}</strong><p>{data?.user.role === 'ADMIN' ? 'branches available' : 'assigned branch'}</p></div></section><div className="operations-layout"><div className="operations-main"><section className="operations-panel"><div className="panel-heading"><div><div className="eyebrow">Front desk</div><h2>Start a walk-in booking</h2><p>Use this for a guest who is standing at the desk.</p></div></div><form className="operations-form" onSubmit={createWalkIn}><label>Room type<select name="roomTypeId" required defaultValue=""><option value="" disabled>Select a room type</option>{data?.roomTypes.map(roomType => <option key={roomType.id} value={roomType.id}>{roomType.hotel.name} · {roomType.name}</option>)}</select></label><label>Check-in<input name="checkIn" type="date" required /></label><label>Guests<input name="guests" type="number" min="1" max="20" defaultValue="1" required /></label><label>Guest name<input name="guestName" placeholder="Full name" required /></label><label>Guest email<input name="guestEmail" type="email" placeholder="Email address" required /></label><label>Guest phone<input name="guestPhone" placeholder="Phone number" required /></label><button className="button button-gold" type="submit">Create walk-in booking</button></form></section><section className="operations-panel"><div className="panel-heading"><div><div className="eyebrow">Reservations</div><h2>Find a guest booking</h2><p>Search by reference, name, or email, then update arrival status.</p></div></div><div className="reservation-tools"><input aria-label="Search reservations" placeholder="Search reference, guest name or email" value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') load(); }} /><select aria-label="Filter status" value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option><option value="CANCELLED">Cancelled</option><option value="COMPLETED">Completed</option></select><button className="button button-outline" type="button" onClick={load}>Search bookings</button></div><div className="table-scroll"><table><thead><tr><th>Reference</th><th>Guest</th><th>Room</th><th>Stay</th><th>Status</th><th>Action</th></tr></thead><tbody>{data?.bookings.map(booking => <tr key={booking.id}><td><strong>{booking.reference}</strong></td><td>{booking.guestName || 'Guest'}<br /><span>{booking.guestEmail}</span></td><td>{booking.room.roomType.name}<br /><span>{booking.room.hotel.name} · {booking.room.number}</span></td><td>{new Date(booking.checkIn).toLocaleDateString()}<br /><span>to {new Date(booking.checkOut).toLocaleDateString()}</span></td><td><span className={`status-pill status-${booking.status.toLowerCase()}`}>{booking.status}</span></td><td><button className="table-action" type="button" onClick={() => updateBooking(booking.id, 'check-in')} disabled={!!booking.checkedInAt}>Check in</button><button className="table-action" type="button" onClick={() => updateBooking(booking.id, 'check-out')} disabled={!!booking.checkedOutAt}>Check out</button></td></tr>)}</tbody></table></div></section></div><aside className="operations-side"><section className="operations-panel"><div className="panel-heading"><div><div className="eyebrow">Live view</div><h2>Other branch availability</h2><p>Read-only overview for helping guests choose another branch.</p></div></div><div className="availability-list">{data?.otherBranches.map(item => <div className="availability-row" key={item.hotel + item.roomType}><div><strong>{item.roomType}</strong><span>{item.hotel}</span></div><b>{item.availableRooms}<small> / {item.totalRooms}</small></b></div>)}</div></section>{data?.user.role === 'ADMIN' ? <section className="operations-panel pricing-panel"><div className="panel-heading"><div><div className="eyebrow">Admin only</div><h2>Room pricing</h2><p>Update prices across every branch.</p></div></div>{data.roomTypes.map(roomType => <form className="pricing-row" key={roomType.id} onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); updatePricing(roomType.id, Number(form.get('priceKobo')), Number(form.get('depositKobo'))); }}><strong>{roomType.hotel.name}<br /><span>{roomType.name}</span></strong><input aria-label={`${roomType.name} price`} name="priceKobo" type="number" defaultValue={roomType.priceKobo} min="0" /><button className="table-action" type="submit">Save</button></form>)}</section> : null}</aside></div></main>;
}
