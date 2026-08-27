'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export function AuthControls() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <span>Loading...</span>;
  }

  if (session) {
    return (
      <>
        <span>Hi, {session.user?.name ?? 'Guest'}</span>
        <button type="button" onClick={() => signOut({ callbackUrl: '/' })}>Sign out</button>
      </>
    );
  }

  return (
    <>
      <Link href="/login">Login</Link>
      <Link href="/register">Register</Link>
    </>
  );
}
