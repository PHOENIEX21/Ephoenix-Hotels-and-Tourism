import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { rateLimit } from '../../../../lib/security';

export async function POST(request: Request) {
  const { email } = await request.json() as { email?: string };
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  if (!rateLimit(`password-reset:${normalizedEmail}`, 3, 60 * 60_000).allowed) return NextResponse.json({ message: 'If an account exists, a reset link will be sent.' });

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return NextResponse.json({ message: 'If an account exists, a reset link will be sent.' });

  const rawToken = randomBytes(32).toString('hex');
  const token = createHash('sha256').update(rawToken).digest('hex');
  await prisma.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });
  await prisma.verificationToken.create({ data: { identifier: normalizedEmail, token, expires: new Date(Date.now() + 30 * 60_000) } });

  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  if (!apiKey || !fromEmail) return NextResponse.json({ error: 'Password recovery email is not configured.' }, { status: 503 });
  const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ personalizations: [{ to: [{ email: user.email, name: user.name }] }], from: { email: fromEmail, name: 'EPhoenix Hotels & Tourism' }, subject: 'Reset your EPhoenix password', content: [{ type: 'text/plain', value: `Reset your password within 30 minutes: ${resetUrl}` }] }),
  });
  if (!response.ok) return NextResponse.json({ error: 'Unable to send the reset email right now.' }, { status: 502 });
  return NextResponse.json({ message: 'If an account exists, a reset link will be sent.' });
}
