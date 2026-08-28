'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(''); const result = await signIn('credentials', { email, password, redirect: false }); setLoading(false); if (result?.error) { setError('Invalid staff credentials.'); return; } router.push('/staff'); }
  return <main className="auth-page auth-page-staff"><section className="auth-card"><div className="auth-kicker">EPhoenix operations</div><h1>Staff sign in.</h1><p className="auth-lead">Access bookings, offers, reports, and guest reviews from the secure console.</p><form className="auth-form" onSubmit={submit}><label>Work email<input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>{error ? <p className="auth-error" role="alert">{error}</p> : null}<button className="button button-gold auth-submit" type="submit" disabled={loading}>{loading ? 'Checking access...' : 'Enter staff console'}</button></form><p className="auth-switch"><Link href="/forgot-password">Forgot your password?</Link></p><p className="auth-note">Authorised EPhoenix team members only.</p></section></main>;
}