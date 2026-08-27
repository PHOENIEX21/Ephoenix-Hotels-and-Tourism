import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import OffersManager from './offers-manager';

export default async function OffersPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'ADMIN') redirect('/staff/login');
  const [hotels, roomTypes, offers] = await Promise.all([prisma.hotel.findMany({ orderBy: { slug: 'asc' } }), prisma.roomType.findMany({ include: { hotel: true }, orderBy: [{ hotel: { slug: 'asc' } }, { name: 'asc' }] }), prisma.offer.findMany({ include: { hotel: true, roomType: true }, orderBy: { startsAt: 'desc' } })]);
  return <OffersManager hotels={hotels.map(h => ({ id: h.id, name: h.name }))} roomTypes={roomTypes.map(r => ({ id: r.id, name: `${r.hotel.name} · ${r.name}` }))} offers={offers.map(o => ({ id: o.id, name: o.name, discountType: o.discountType, discountValue: o.discountValue, startsAt: o.startsAt.toISOString(), endsAt: o.endsAt.toISOString(), target: o.roomType?.name || o.hotel?.name || 'All branches' }))} />;
}
