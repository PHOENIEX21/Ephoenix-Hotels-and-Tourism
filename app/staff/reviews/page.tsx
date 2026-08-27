import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import ReviewModeration from './review-moderation';

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions); const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'ADMIN') redirect('/staff/login');
  const reviews = await prisma.review.findMany({ where: { published: false }, include: { hotel: true, roomType: true }, orderBy: { createdAt: 'asc' } });
  return <ReviewModeration reviews={reviews.map(r => ({ id: r.id, guestName: r.guestName, rating: r.rating, body: r.body, hotel: r.hotel.name, roomType: r.roomType.name }))} />;
}
