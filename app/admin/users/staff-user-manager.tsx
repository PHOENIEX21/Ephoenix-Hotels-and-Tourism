'use client';

import { FormEvent, useEffect, useState } from 'react';

type Hotel = { id: string; name: string; slug: string };
type User = { id: string; name: string; email: string; hotelId: string | null; hotel: Hotel | null };

export default function StaffUserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    const response = await fetch('/api/admin/users');
    const payload = await response.json();
    if (!response.ok) setError(payload.error || 'Unable to load users.');
    else { setUsers(payload.users); setHotels(payload.hotels); setError(''); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const payload = await response.json();
    if (!response.ok) { setError(payload.error || 'Unable to create user.'); return; }
    setMessage('Staff user created.'); setError(''); form.reset(); load();
  }
  async function remove(id: string) {
    if (!window.confirm('Delete this staff account?')) return;
    const response = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok) { const payload = await response.json(); setError(payload.error); return; }
    setMessage('Staff user deleted.'); load();
  }

  return <main className="staff-admin-page"><header className="staff-admin-header"><div><div className="auth-kicker">Admin · team access</div><h1>Staff and branches</h1><p>Create a staff login, assign one branch, and they will see that branch&apos;s guest work when they sign in.</p></div><a className="button button-outline" href="/admin">Back to admin home</a></header>{error ? <p className="dashboard-alert" role="alert">{error}</p> : null}{message ? <p className="dashboard-success" role="status">{message}</p> : null}<section className="staff-create-panel"><div className="panel-heading"><div><div className="eyebrow">Step 1 · Create login</div><h2>Add a staff member</h2><p>Give the team member their email and a temporary password.</p></div></div><form className="staff-create-form" onSubmit={submit}><label>Full name<input name="name" placeholder="e.g. Amina Yusuf" required minLength={2} maxLength={100} /></label><label>Work email<input name="email" type="email" placeholder="name@ephoenix.com" required /></label><label>Temporary password<input name="password" type="password" placeholder="At least 8 characters" minLength={8} maxLength={128} required autoComplete="new-password" /></label><label>Assigned branch<select name="hotelId" required defaultValue=""><option value="" disabled>Choose one branch</option>{hotels.map(hotel => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}</select></label><button className="button button-gold" type="submit">Create staff login</button></form></section><section className="staff-list-panel"><div className="panel-heading"><div><div className="eyebrow">Step 2 · Assign and review</div><h2>Current staff</h2><p>Each staff member can manage bookings for their assigned branch. They can see other-branch availability, but not edit it.</p></div></div>{loading ? <p>Loading staff accounts...</p> : <div className="table-scroll"><table><thead><tr><th>Staff member</th><th>Email</th><th>Assigned branch</th><th>Action</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><strong>{user.name}</strong></td><td>{user.email}</td><td><select aria-label={`Branch for ${user.name}`} value={user.hotelId ?? ''} onChange={async event => { const response = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: user.id, name: user.name, hotelId: event.target.value }) }); if (response.ok) { setMessage('Branch assignment updated.'); load(); } else { const payload = await response.json(); setError(payload.error); } }}>{hotels.map(hotel => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}</select></td><td><button className="table-action" type="button" onClick={() => remove(user.id)}>Remove access</button></td></tr>)}</tbody></table></div>}</section><p className="staff-help"><strong>What staff can do:</strong> Sign in at <a href="/staff/login">Staff sign in</a>, manage their branch reservations, create walk-in bookings, and view availability at other branches.</p></main>;
}
