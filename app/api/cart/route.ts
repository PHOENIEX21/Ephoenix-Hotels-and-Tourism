import { NextRequest, NextResponse } from 'next/server';

// Cart contents are intentionally client-owned so guests can shop without an
// account; this endpoint provides a stable API for clients that prefer syncing.
export async function GET() { return NextResponse.json({ items: [] }); }
export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ ok: true, items: Array.isArray(body?.items) ? body.items : [] });
}
