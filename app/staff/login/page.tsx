'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(''); const result = await signIn('credentials', { email, password, redirect: false }); setLoading(false); if (result?.error) { setError('Invalid staff credentials.'); return; } router.push('/staff'); }
  return <main style={{ maxWidth: 500, margin: '4rem auto', padding: '0 1rem' }}><h1>Staff and admin login</h1><form onSubmit={submit} style={{ display: 'grid', gap: '1rem' }}><label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} required /></label>{error ? <p style={{ color: 'crimson' }}>{error}</p> : null}<button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button></form></main>;
}