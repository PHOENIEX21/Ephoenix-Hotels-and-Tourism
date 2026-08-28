import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  const { token, password } = await request.json() as { token?: string; password?: string };
  if (!token || !password || password.length < 8) return NextResponse.json({ error: 'A valid reset token and password of at least 8 characters are required.' }, { status: 400 });
  const hashedToken = createHash('sha256').update(token).digest('hex');
  const record = await prisma.verificationToken.findFirst({ where: { token: hashedToken, expires: { gt: new Date() } } });
  if (!record) return NextResponse.json({ error: 'This reset link is invalid or expired.' }, { status: 400 });
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { email: record.identifier }, data: { passwordHash } });
  await prisma.verificationToken.delete({ where: { token: hashedToken } });
  return NextResponse.json({ message: 'Password updated.' });
}
