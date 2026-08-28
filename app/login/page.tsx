'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid email or password.');
      return;
    }

    router.push('/');
  };

  return <main className="auth-page"><section className="auth-card"><div className="auth-kicker">EPhoenix guest portal</div><h1>Welcome back.</h1><p className="auth-lead">Sign in to keep your reservations and stay details in one place.</p><form className="auth-form" onSubmit={handleSubmit}><label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error ? <p className="auth-error" role="alert">{error}</p> : null}<button className="button button-gold auth-submit" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in securely'}</button></form><p className="auth-switch"><Link href="/forgot-password">Forgot your password?</Link></p><p className="auth-switch">New to EPhoenix? <Link href="/register">Create your guest account</Link></p></section></main>;
}
