import { prisma } from '../lib/prisma';

export default async function PublicRoomExtras({ hotelSlug, roomTypeSlug }: { hotelSlug: string; roomTypeSlug: string }) {
  const roomType = await prisma.roomType.findFirst({ where: { slug: roomTypeSlug, hotel: { slug: hotelSlug } }, include: { hotel: { include: { offers: { where: { active: true, startsAt: { lte: new Date() }, endsAt: { gte: new Date() } }, orderBy: { discountValue: 'desc' }, take: 1 } } }, reviews: { where: { published: true }, orderBy: { createdAt: 'desc' }, take: 3 }, offers: { where: { active: true, startsAt: { lte: new Date() }, endsAt: { gte: new Date() } }, orderBy: { discountValue: 'desc' }, take: 1 } } });
  if (!roomType) return null;
  const offer = roomType.offers[0] || roomType.hotel.offers[0];
  return <>{offer ? <p style={{ color: '#a36b18' }}><strong>{offer.name}</strong>: {offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}% off` : `₦${(offer.discountValue / 100).toLocaleString('en-NG')} off`}</p> : null}{roomType.reviews.map(review => <blockquote key={review.id}>&ldquo;{review.body}&rdquo; <small>· {review.guestName} · {review.rating}/5</small></blockquote>)}</>;
}
