import { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';
import { requireStaff } from '../../../../lib/staff';
import { writeAudit } from '../../../../lib/audit';

const userSelect = { id: true, name: true, email: true, role: true, hotelId: true, createdAt: true, hotel: { select: { id: true, name: true, slug: true } } } as const;

async function requireAdmin() {
  const user = await requireStaff();
  if (user.role !== Role.ADMIN) throw new Error('Only admins can manage staff users.');
  return user;
}

function validatePassword(password: unknown) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

export async function GET() {
  try {
    await requireAdmin();
    const [users, hotels] = await Promise.all([
      prisma.user.findMany({ where: { role: Role.STAFF }, select: userSelect, orderBy: { name: 'asc' } }),
      prisma.hotel.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
    ]);
    return NextResponse.json({ users, hotels });
  } catch (error) {
    console.error('Admin user list failed', error);
    return NextResponse.json({ error: 'Unable to load staff users.' }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = body?.password;
    const hotelId = String(body?.hotelId ?? '').trim();
    if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !validatePassword(password) || !hotelId) {
      return NextResponse.json({ error: 'Name, valid email, branch, and a password of 8-128 characters are required.' }, { status: 400 });
    }
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId }, select: { id: true } });
    if (!hotel) return NextResponse.json({ error: 'Selected branch was not found.' }, { status: 400 });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, passwordHash, role: Role.STAFF, hotelId }, select: userSelect });
    await writeAudit(admin.id, 'STAFF_USER_CREATED', 'User', user.id, { email, hotelId });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2002') return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 409 });
    console.error('Staff user creation failed', error);
    return NextResponse.json({ error: 'Unable to create staff user.' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const id = String(body?.id ?? '').trim();
    const name = String(body?.name ?? '').trim();
    const hotelId = String(body?.hotelId ?? '').trim();
    const password = body?.password;
    if (!id || name.length < 2 || name.length > 100 || !hotelId || (password !== undefined && !validatePassword(password))) {
      return NextResponse.json({ error: 'Name and branch are required; password must be 8-128 characters when provided.' }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!existing || existing.role !== Role.STAFF) return NextResponse.json({ error: 'Staff user was not found.' }, { status: 404 });
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId }, select: { id: true } });
    if (!hotel) return NextResponse.json({ error: 'Selected branch was not found.' }, { status: 400 });
    const user = await prisma.user.update({ where: { id }, data: { name, hotelId, ...(password !== undefined ? { passwordHash: await bcrypt.hash(password, 12) } : {}) }, select: userSelect });
    await writeAudit(admin.id, 'STAFF_USER_UPDATED', 'User', id, { hotelId, passwordChanged: password !== undefined });
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Staff user update failed', error);
    return NextResponse.json({ error: 'Unable to update staff user.' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const id = request.nextUrl.searchParams.get('id')?.trim();
    if (!id) return NextResponse.json({ error: 'User id is required.' }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!user || user.role !== Role.STAFF) return NextResponse.json({ error: 'Staff user was not found.' }, { status: 404 });
    await prisma.user.delete({ where: { id } });
    await writeAudit(admin.id, 'STAFF_USER_DELETED', 'User', id, {});
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Staff user deletion failed', error);
    return NextResponse.json({ error: 'Unable to delete staff user.' }, { status: 400 });
  }
}
