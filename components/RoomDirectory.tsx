'use client';

import Link from 'next/link';
import { useState } from 'react';
import RoomCardImage from './RoomCardImage';
import { Hotel, RoomType, naira } from '../lib/data';

export default function RoomDirectory({ hotels, rooms }: { hotels: Hotel[]; rooms: RoomType[] }) {
  const [branch, setBranch] = useState(hotels[0]?.slug || '');
  const visibleRooms = rooms.filter(room => room.hotel === branch);
  return <div className="room-directory">
    <div className="branch-selector" role="tablist" aria-label="Select a branch">
      {hotels.map(hotel => <button type="button" role="tab" aria-selected={branch === hotel.slug} className={`branch-tab${branch === hotel.slug ? ' is-active' : ''}`} onClick={() => setBranch(hotel.slug)} key={hotel.slug}>{hotel.shortName}<span>{hotel.rooms} rooms</span></button>)}
    </div>
    <div className="room-feed">{visibleRooms.map(room => <Link className="card room-card-link" href={`/rooms/${encodeURIComponent(room.hotel)}/${encodeURIComponent(room.slug)}`} key={room.hotel + room.name}>{room.images?.length ? <RoomCardImage images={room.images} alt={room.name} /> : <div className="room-photo" />}<div className="room-body"><div className="label">{hotels.find(hotel => hotel.slug === room.hotel)?.shortName}</div><h3>{room.name}</h3><div className="price">{naira(room.price)} <small>/ night</small></div><p className="muted">{room.roomNumbers.length} room{room.roomNumbers.length === 1 ? '' : 's'} available in this type · Deposit {naira(room.deposit)}</p><span className="button button-outline room-preview-button">View room</span></div></Link>)}</div>
  </div>;
}
