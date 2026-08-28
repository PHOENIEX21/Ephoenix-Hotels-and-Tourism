'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    setLoading(false);
    setSent(true);
  }

  return <main className="auth-page"><section className="auth-card"><div className="auth-kicker">Secure account recovery</div><h1>Reset your password.</h1><p className="auth-lead">Enter your account email and, if it exists, we&apos;ll send a secure reset link.</p>{sent ? <p role="status">Check your email for a reset link. For your security, we use the same message whether or not an account exists.</p> : <form className="auth-form" onSubmit={submit}><label>Email address<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></label><button className="button button-gold auth-submit" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button></form>}<p className="auth-switch"><Link href="/login">Back to guest sign in</Link> · <Link href="/staff/login">Staff sign in</Link></p></section></main>;
}
