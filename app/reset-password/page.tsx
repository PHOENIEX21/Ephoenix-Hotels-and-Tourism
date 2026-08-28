'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => setToken(new URLSearchParams(window.location.search).get('token') || ''), []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
    const payload = await response.json();
    setMessage(response.ok ? 'Password updated. You can now sign in.' : payload.error || 'This reset link is invalid or expired.');
  }
  return <main className="auth-page"><section className="auth-card"><div className="auth-kicker">Secure account recovery</div><h1>Choose a new password.</h1>{message ? <p role="status">{message}</p> : <form className="auth-form" onSubmit={submit}><label>New password<input type="password" minLength={8} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required /></label><button className="button button-gold auth-submit" type="submit" disabled={!token}>Update password</button></form>}<p className="auth-switch"><Link href="/login">Return to sign in</Link></p></section></main>;
}
