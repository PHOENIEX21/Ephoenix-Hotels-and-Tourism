'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Unable to create your account.');
        return;
      }
      router.push('/login');
    } catch {
      setError('Unable to reach registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page"><section className="auth-card"><div className="auth-kicker">EPhoenix guest portal</div><h1>Make yourself at home.</h1><p className="auth-lead">Create an account to keep your reservations and stay details together.</p><form className="auth-form" onSubmit={handleSubmit}><label>Full name<input type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>{error ? <p className="auth-error" role="alert">{error}</p> : null}<button className="button button-gold auth-submit" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create guest account'}</button></form><p className="auth-switch">Already have an account? <Link href="/login">Sign in securely</Link></p></section></main>
  );
}
