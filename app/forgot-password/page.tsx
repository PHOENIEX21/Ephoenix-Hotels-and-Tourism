'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to send the reset email.');
      setSent(true);
    } catch (resetError) { setError(resetError instanceof Error ? resetError.message : 'Unable to send the reset email.'); }
    finally { setLoading(false); }
  }

  return <main className="auth-page"><section className="auth-card"><div className="auth-kicker">Secure account recovery</div><h1>Reset your password.</h1><p className="auth-lead">Enter your account email and, if it exists, we&apos;ll send a secure reset link.</p>{sent ? <p role="status">Check your email for a reset link. For your security, we use the same message whether or not an account exists.</p> : <form className="auth-form" onSubmit={submit}><label>Email address<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>{error ? <p className="auth-error" role="alert">{error}</p> : null}<button className="button button-gold auth-submit" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button></form>}<p className="auth-switch"><Link href="/login">Back to guest sign in</Link> · <Link href="/staff/login">Staff sign in</Link></p></section></main>;
}
