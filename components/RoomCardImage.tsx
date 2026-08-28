'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export default function RoomCardImage({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % images.length), 5000);
    return () => window.clearInterval(timer);
  }, [images.length]);
  return <div className="room-photo" onTouchStart={event => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={event => { if (touchStart.current === null) return; const distance = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) > 40) setIndex(current => (current + (distance < 0 ? 1 : -1) + images.length) % images.length); touchStart.current = null; }}><Image src={images[index]} fill sizes="(max-width: 760px) 100vw, 25vw" alt={alt} /><span className="room-photo-count">{index + 1} / {images.length}</span>{images.length > 1 ? <><button type="button" className="room-photo-arrow room-photo-prev" onClick={event => { event.stopPropagation(); setIndex(current => (current - 1 + images.length) % images.length); }} aria-label={`Previous ${alt} photo`}>‹</button><button type="button" className="room-photo-arrow room-photo-next" onClick={event => { event.stopPropagation(); setIndex(current => (current + 1) % images.length); }} aria-label={`Next ${alt} photo`}>›</button></> : null}</div>;
}
