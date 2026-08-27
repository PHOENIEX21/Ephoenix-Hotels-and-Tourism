import { DiscountType, Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireStaff } from '../../../../lib/staff';
import { writeAudit } from '../../../../lib/audit';
import { clientKey, rateLimit } from '../../../../lib/security';

export async function GET() {
  try { const user = await requireStaff(); if (user.role !== Role.ADMIN) return NextResponse.json({ error: 'Only admins can manage offers.' }, { status: 403 }); return NextResponse.json({ offers: await prisma.offer.findMany({ include: { hotel: true, roomType: true }, orderBy: { startsAt: 'desc' } }) }); } catch (error) { console.error('Offers request failed', error); return NextResponse.json({ error: 'Unable to load offers.' }, { status: 400 }); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireStaff(); if (user.role !== Role.ADMIN) return NextResponse.json({ error: 'Only admins can create offers.' }, { status: 403 });
    const limit = rateLimit(`offer:${clientKey(request)}`, 20);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many offer changes. Please try again later.' }, { status: 429 });
    const body = await request.json(); const name = String(body?.name ?? '').trim(); const description = String(body?.description ?? '').trim() || null; const discountType = String(body?.discountType ?? '') as DiscountType; const discountValue = Number(body?.discountValue); const startsAt = new Date(String(body?.startsAt ?? '')); const endsAt = new Date(String(body?.endsAt ?? '')); const hotelId = String(body?.hotelId ?? '') || null; const roomTypeId = String(body?.roomTypeId ?? '') || null;
    if (!name || !Object.values(DiscountType).includes(discountType) || !Number.isInteger(discountValue) || discountValue <= 0 || (discountType === DiscountType.PERCENTAGE && discountValue > 100) || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt >= endsAt || (hotelId && roomTypeId)) return NextResponse.json({ error: 'Invalid offer details or targeting.' }, { status: 400 });
    const offer = await prisma.offer.create({ data: { name, description, discountType, discountValue, startsAt, endsAt, hotelId, roomTypeId } });
    await writeAudit(user.id, 'OFFER_CREATED', 'Offer', offer.id, { name, discountType, discountValue, hotelId, roomTypeId, startsAt, endsAt });
    return NextResponse.json({ ok: true, offer }, { status: 201 });
  } catch (error) { console.error('Offer creation failed', error); return NextResponse.json({ error: 'Unable to create offer.' }, { status: 400 }); }
}