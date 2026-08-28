'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export default function CuratedSlideshow({ images }: { images: { src: string; alt: string }[] }) {
  const [active, setActive] = useState(0);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setActive(current => (current + 1) % images.length), 4500);
    return () => window.clearInterval(timer);
  }, [images.length]);

  return   <div className="special-showcase" aria-label="Curated EPhoenix highlights" onTouchStart={event => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={event => { if (touchStart.current === null) return; const distance = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) > 40) setActive(current => (current + (distance < 0 ? 1 : -1) + images.length) % images.length); touchStart.current = null; }}>
    <div className="special-showcase-frame">
      {images.map((image, index) => <Image key={image.src} src={image.src} fill sizes="(max-width: 760px) 100vw, 1180px" alt={image.alt} className={index === active ? 'special-showcase-image is-active' : 'special-showcase-image'} priority={index === 0} />)}
      <div className="special-showcase-caption">{images[active].alt}</div>
    </div>
    <div className="slideshow-controls">
      <button type="button" className="special-showcase-arrow" onClick={() => setActive(current => (current - 1 + images.length) % images.length)} aria-label="Previous highlight">‹</button>
      <div className="special-showcase-dots">{images.map((image, index) => <button type="button" key={image.src} className={index === active ? 'special-showcase-dot is-active' : 'special-showcase-dot'} onClick={() => setActive(index)} aria-label={`Show highlight ${index + 1}`} aria-current={index === active ? 'true' : undefined} />)}</div>
      <button type="button" className="special-showcase-arrow" onClick={() => setActive(current => (current + 1) % images.length)} aria-label="Next highlight">›</button>
    </div>
  </div>;
}
