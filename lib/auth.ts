import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcrypt';
import { prisma } from './prisma';
import { rateLimit } from './security';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        if (!rateLimit(`login:${email}`, 10, 15 * 60_000).allowed) return null;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const jwtToken = token as typeof token & { id?: string; role?: string };

      if (user) {
        jwtToken.id = user.id as string;
        jwtToken.role = (user as { role?: string }).role ?? 'GUEST';
      }

      return jwtToken;
    },
    async session({ session, token }) {
      if (session.user) {
        const jwtToken = token as typeof token & { id?: string; role?: string };
        const userSession = session.user as typeof session.user & { id?: string; role?: string };
        userSession.id = jwtToken.id ?? token.sub ?? undefined;
        userSession.role = typeof jwtToken.role === 'string' ? jwtToken.role : 'GUEST';
      }

      return session;
    },
  },
};
