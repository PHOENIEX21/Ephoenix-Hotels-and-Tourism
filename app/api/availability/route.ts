import { NextRequest, NextResponse } from 'next/server';
import { findAvailability } from '../../../lib/availability';

export async function GET(request: NextRequest) {
  const checkIn = request.nextUrl.searchParams.get('checkIn');
  const guests = Number(request.nextUrl.searchParams.get('guests') || '1');
  const nights = Number(request.nextUrl.searchParams.get('nights') || '1');
  if (!checkIn) return NextResponse.json({ error: 'checkIn is required' }, { status: 400 });
  try { return NextResponse.json(await findAvailability(checkIn, guests, nights)); } catch (error) { console.error('Availability lookup failed', error); return NextResponse.json({ error: 'Unable to check availability.' }, { status: 400 }); }
}