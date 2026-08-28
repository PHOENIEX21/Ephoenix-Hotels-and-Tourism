'use client';

import Link from 'next/link';
import { useState } from 'react';
import RoomCardImage from './RoomCardImage';
import { Hotel, RoomType, naira } from '../lib/data';

export default function RoomDirectory({ hotels, rooms }: { hotels: Hotel[]; rooms: RoomType[] }) {
  const [branch, setBranch] = useState(hotels[0]?.slug || '');
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const visibleRooms = rooms.filter(room => room.hotel === branch);
  return <div className="room-directory">
    <div className="branch-selector" role="tablist" aria-label="Select a branch">
      {hotels.map(hotel => <button type="button" role="tab" aria-selected={branch === hotel.slug} className={`branch-tab${branch === hotel.slug ? ' is-active' : ''}`} onClick={() => setBranch(hotel.slug)} key={hotel.slug}>{hotel.shortName}<span>{hotel.rooms} rooms</span></button>)}
    </div>
    <div className="room-feed">{visibleRooms.map(room => <article className="room-selection-card" onClick={() => setSelectedRoom(room)} key={room.hotel + room.name}>{room.images?.length ? <RoomCardImage images={room.images} alt={room.name} /> : <div className="room-selection-media" />}<div className="room-selection-body"><div className="room-select-label">{hotels.find(hotel => hotel.slug === room.hotel)?.shortName}</div><h3>{room.name}</h3><div className="room-select-price">{naira(room.price)} <small>/ night</small></div><p className="muted">{room.roomNumbers.length} room{room.roomNumbers.length === 1 ? '' : 's'} available in this type · Deposit {naira(room.deposit)}</p><button type="button" className="availability-action availability-action-primary room-select-cta">View room</button></div></article>)}</div>
    {selectedRoom ? <div className="room-modal-backdrop" role="presentation" onClick={() => setSelectedRoom(null)}><section className="room-modal" role="dialog" aria-modal="true" aria-label={`${selectedRoom.name} preview`} onClick={event => event.stopPropagation()}><button type="button" className="room-modal-close" onClick={() => setSelectedRoom(null)} aria-label="Close room preview">×</button>{selectedRoom.images?.length ? <RoomCardImage images={selectedRoom.images} alt={selectedRoom.name} /> : <div className="room-selection-media" />}<div className="room-selection-body"><div className="room-select-label">{hotels.find(hotel => hotel.slug === selectedRoom.hotel)?.shortName}</div><h2>{selectedRoom.name}</h2><p className="muted">Swipe or use the arrows to browse this room&apos;s photos. Images advance automatically.</p><Link className="availability-action availability-action-primary" href={`/book?roomTypeSlug=${encodeURIComponent(selectedRoom.slug)}&hotel=${encodeURIComponent(selectedRoom.hotel)}`}>Book Now</Link></div></section></div> : null}
  </div>;
}
