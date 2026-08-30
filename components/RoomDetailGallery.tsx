'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function RoomDetailGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  if (!images.length) return <div className="room-detail-gallery-empty">Room photos coming soon</div>;
  return <div className="room-detail-gallery"><Image src={images[index]} alt={`${name} photo ${index + 1}`} fill sizes="(max-width: 760px) 100vw, 65vw" priority className="room-detail-image" />{images.length > 1 ? <><button type="button" className="room-detail-arrow room-detail-prev" onClick={() => setIndex(current => (current - 1 + images.length) % images.length)} aria-label="Previous room photo">‹</button><button type="button" className="room-detail-arrow room-detail-next" onClick={() => setIndex(current => (current + 1) % images.length)} aria-label="Next room photo">›</button><span className="room-detail-gallery-note">Photo {index + 1} of {images.length}</span></> : null}</div>;
}