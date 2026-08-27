import { notFound } from 'next/navigation';
import { prisma } from '../../lib/prisma';
import { getActiveOffer } from '../../lib/booking';
import { BookingForm } from '../../components/BookingForm';

export default async function BookPage({ searchParams }: { searchParams: { roomTypeId?: string; checkIn?: string; guests?: string } }) {
  const roomTypeId = searchParams.roomTypeId;
  const checkIn = searchParams.checkIn;
  const guests = Number(searchParams.guests ?? '1');

  if (!roomTypeId || !checkIn) {
    notFound();
  }

  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: { hotel: true, rooms: true },
  });

  if (!roomType) {
    notFound();
  }

  const offer = await getActiveOffer(roomType.id, roomType.hotelId, new Date(`${checkIn}T00:00:00.000Z`));
  return <BookingForm roomType={{ id: roomType.id, name: roomType.name, priceKobo: roomType.priceKobo, depositKobo: roomType.depositKobo, hotel: { slug: roomType.hotel.slug, name: roomType.hotel.name }, capacity: roomType.capacity, photoUrls: roomType.photoUrls }} offer={offer ? { name: offer.name, discountType: offer.discountType, discountValue: offer.discountValue } : null} checkIn={checkIn} guests={Number.isFinite(guests) ? guests : 1} />;
}
