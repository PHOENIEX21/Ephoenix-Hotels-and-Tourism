'use client';

import { SessionProvider } from 'next-auth/react';
import LiveChat from '../components/LiveChat';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}<LiveChat /></SessionProvider>;
}
