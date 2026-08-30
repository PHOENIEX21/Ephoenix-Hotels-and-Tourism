import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { hotels, naira, rooms } from '../../../../lib/data';
import RoomDetailGallery from '../../../../components/RoomDetailGallery';

export default async function RoomDetailPage({ params }: { params: Promise<{ hotel: string; slug: string }> }) {
  const resolvedParams = await params;
  const room = rooms.find(item => item.hotel === resolvedParams.hotel && item.slug === resolvedParams.slug);
  const hotel = hotels.find(item => item.slug === resolvedParams.hotel);
  if (!room || !hotel) notFound();
  const images = room.images?.length ? room.images : room.image ? [room.image] : [];
  const amenities = ['24-hour power supply', 'Complimentary breakfast', 'Air conditioning', 'En-suite bathroom', 'Complimentary Wi-Fi'];

  return <main className="room-detail-page"><div className="room-detail-crumb"><Link href="/rooms">Rooms</Link><span>/</span><span>{hotel.shortName}</span></div><div className="room-detail-grid"><section><RoomDetailGallery images={images} name={room.name} /></section><section className="room-detail-copy"><div className="eyebrow">{hotel.shortName}</div><h1>{room.name}</h1><p className="room-detail-price">{naira(room.price)} <small>/ night</small></p><p className="room-detail-description">A comfortable {room.name.toLowerCase()} prepared for a restful stay at {hotel.name}. Enjoy thoughtful essentials, warm service, and the convenience of our 24-hour stay model.</p><h2>Amenities</h2><ul className="room-amenities">{amenities.map(amenity => <li key={amenity}>{amenity}</li>)}</ul><p className="muted">Deposit from {naira(room.deposit)}. {room.roomNumbers.length} room{room.roomNumbers.length === 1 ? '' : 's'} available in this type.</p><Link className="button button-gold" href={`/book?roomTypeSlug=${encodeURIComponent(room.slug)}&hotel=${encodeURIComponent(room.hotel)}`}>Book this room</Link></section></div></main>;
}