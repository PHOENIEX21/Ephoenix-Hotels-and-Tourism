import { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireStaff } from '../../../../../lib/staff';
import { writeAudit } from '../../../../../lib/audit';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireStaff();
    if (user.role !== Role.ADMIN) return NextResponse.json({ error: 'Only admins can manage room pricing.' }, { status: 403 });
    const { id } = await params;
    const body = await request.json();
    const price = Number(body?.priceKobo); const deposit = Number(body?.depositKobo);
    if (!Number.isInteger(price) || price < 0 || !Number.isInteger(deposit) || deposit < 0) return NextResponse.json({ error: 'Price and deposit must be non-negative whole kobo amounts.' }, { status: 400 });
    const roomType = await prisma.roomType.update({ where: { id }, data: { priceKobo: price, depositKobo: deposit } });
    await writeAudit(user.id, 'ROOM_TYPE_PRICING_CHANGED', 'RoomType', id, { priceKobo: price, depositKobo: deposit });
    return NextResponse.json({ ok: true, roomType });
  } catch (error) { console.error('Room pricing update failed', error); return NextResponse.json({ error: 'Unable to update room type pricing.' }, { status: 400 }); }
}