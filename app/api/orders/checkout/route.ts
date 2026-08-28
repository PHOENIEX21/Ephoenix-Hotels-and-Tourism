import { NextRequest, NextResponse } from 'next/server';
import { createOrderFromCart } from '../../../../lib/cart';
import { clientKey, rateLimit } from '../../../../lib/security';

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`checkout:${clientKey(request)}`, 10);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many checkout attempts.' }, { status: 429 });
    const body = await request.json();
    const order = await createOrderFromCart({
      items: Array.isArray(body?.items) ? body.items : [],
      guestName: String(body?.guestName ?? ''),
      guestEmail: String(body?.guestEmail ?? ''),
      guestPhone: String(body?.guestPhone ?? ''),
      holdMinutes: 15,
    });
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to checkout.' }, { status: 400 });
  }
}
