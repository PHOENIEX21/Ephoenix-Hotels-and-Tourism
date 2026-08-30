import { notFound } from 'next/navigation';
import { prisma } from '../../lib/prisma';
import { getActiveOffer } from '../../lib/booking';
import { BookingForm } from '../../components/BookingForm';

export default async function BookPage({ searchParams }: { searchParams: Promise<{ roomTypeId?: string; roomTypeSlug?: string; hotel?: string; checkIn?: string; guests?: string; nights?: string }> }) {
  const params = await searchParams;
  const checkIn = params.checkIn ?? new Date().toISOString().slice(0, 10);
  const guests = Number(params.guests ?? '1');
  const nights = Number(params.nights ?? '1');

  const roomTypeId = params.roomTypeId;
  const roomTypeSlug = params.roomTypeSlug;
  const hotelSlug = params.hotel;
  if (!roomTypeId && (!roomTypeSlug || !hotelSlug)) {
    notFound();
  }
  const roomType = await prisma.roomType.findFirst({
    where: roomTypeId
      ? { id: roomTypeId }
      : { slug: roomTypeSlug, hotel: { slug: hotelSlug } },
    include: { hotel: true, rooms: true },
  });

  if (!roomType) {
    notFound();
  }

  const offer = await getActiveOffer(roomType.id, roomType.hotelId, new Date(`${checkIn}T00:00:00.000Z`));
  return <BookingForm roomType={{ id: roomType.id, name: roomType.name, priceKobo: roomType.priceKobo, depositKobo: roomType.depositKobo, hotel: { slug: roomType.hotel.slug, name: roomType.hotel.name }, capacity: roomType.capacity, photoUrls: roomType.photoUrls }} offer={offer ? { name: offer.name, discountType: offer.discountType, discountValue: offer.discountValue } : null} checkIn={checkIn} guests={Number.isFinite(guests) ? guests : 1} nights={Number.isInteger(nights) && nights > 0 ? nights : 1} />;
}
