import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';
import { clientKey, rateLimit } from '../../../lib/security';

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`register:${clientKey(request)}`, 5, 15 * 60_000);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 });
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');

    if (!name || !email || password.length < 8) {
      return NextResponse.json({ error: 'Name, email, and a password of at least 8 characters are required.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account already exists for this email address.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'GUEST',
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error('Registration failed', error);
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });
  }
}
