'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function CuratedSlideshow({ images, hero = false }: { images: { src: string; alt: string }[]; hero?: boolean }) {
  const [active, setActive] = useState(0);
  const touchStart = useRef<number | null>(null);
  const showPrevious = () => setActive(current => (current - 1 + images.length) % images.length);
  const showNext = () => setActive(current => (current + 1) % images.length);

  useEffect(() => {
    const timer = window.setInterval(() => setActive(current => (current + 1) % images.length), hero ? 5000 : 4500);
    return () => window.clearInterval(timer);
  }, [hero, images.length]);

  return <div className={hero ? 'slideshow hero-fixed-slideshow' : 'slideshow'} aria-label="Curated EPhoenix highlights" onTouchStart={event => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={event => { if (touchStart.current === null) return; const distance = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) > 40) setActive(current => (current + (distance < 0 ? 1 : -1) + images.length) % images.length); touchStart.current = null; }}>
    <div className={hero ? 'slideshow-frame hero-fixed-frame' : 'slideshow-frame'}>
      {hero ? images.map((image, index) => <Image key={image.src} src={image.src} fill sizes="100vw" alt={image.alt} className={index === active ? 'slideshow-image is-active' : 'slideshow-image'} priority={index === 0} />) : images.map((image, index) => <Image key={image.src} src={image.src} fill sizes="(max-width: 760px) 100vw, 1180px" alt={image.alt} className={index === active ? 'slideshow-image is-active' : 'slideshow-image'} priority={index === 0} />)}
      {hero ? <div className="hero-slideshow-shade" /> : null}
    </div>
    {hero ? <div className="hero-slideshow-copy"><h1>STAY<br />SOMEWHERE<br /><em>WORTH REMEMBERING.</em></h1><p>Thoughtful rooms, warm service, and three distinctive GRA addresses in Ilorin.</p><Link className="button button-gold" href="/#availability-title">Find your stay</Link></div> : null}
    {!hero ? <div className="slideshow-controls" aria-label="Slideshow controls">
      <button type="button" className="slideshow-arrow slideshow-prev" onClick={showPrevious} aria-label="Previous image">‹</button>
      <div className="slideshow-dots" role="tablist" aria-label="Choose slideshow image">
        {images.map((image, index) => <button key={image.src} type="button" className={index === active ? 'slideshow-dot is-active' : 'slideshow-dot'} onClick={() => setActive(index)} aria-label={`Show image ${index + 1}`} aria-selected={index === active} role="tab" />)}
      </div>
      <button type="button" className="slideshow-arrow slideshow-next" onClick={showNext} aria-label="Next image">›</button>
    </div> : null}
  </div>;
}
