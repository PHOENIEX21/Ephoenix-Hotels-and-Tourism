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

  return <main style={{ maxWidth: 1000, margin: '4rem auto', padding: '0 1rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}><div><h1>Staff users</h1><p>Create accounts and assign each team member to one branch.</p></div><a href="/admin">Admin dashboard</a></div>
    {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}{message ? <p style={{ color: 'green' }}>{message}</p> : null}
    <section><h2>Create staff account</h2><form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><input name="name" placeholder="Full name" required minLength={2} maxLength={100} /><input name="email" type="email" placeholder="Email" required /><input name="password" type="password" placeholder="Temporary password (8+ characters)" minLength={8} maxLength={128} required autoComplete="new-password" /><select name="hotelId" required defaultValue=""><option value="" disabled>Select branch</option>{hotels.map(hotel => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}</select><button type="submit">Create staff</button></form></section>
    <section><h2>Current staff</h2>{loading ? <p>Loading...</p> : <table><thead><tr><th>Name</th><th>Email</th><th>Branch</th><th>Action</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td><select value={user.hotelId ?? ''} onChange={async event => { const response = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: user.id, name: user.name, hotelId: event.target.value }) }); if (response.ok) { setMessage('Branch assignment updated.'); load(); } else { const payload = await response.json(); setError(payload.error); } }}>{hotels.map(hotel => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}</select></td><td><button type="button" onClick={() => remove(user.id)}>Delete</button></td></tr>)}</tbody></table>}</section>
    <p><a href="/staff">Back to operations</a></p>
  </main>;
}
