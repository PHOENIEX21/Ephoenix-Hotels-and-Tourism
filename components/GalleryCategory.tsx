'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

export default function GalleryCategory({ branch, category, images }: { branch: string; category: string; images: string[] }) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const src = images[index];
  return <div className="gallery-category"><h3>{category}</h3><div className="gallery-carousel"><div className="gallery-tile" onTouchStart={event => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={event => { if (touchStart.current === null) return; const distance = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) > 40) setIndex(current => (current + (distance < 0 ? 1 : -1) + images.length) % images.length); touchStart.current = null; }}><a href={src} target="_blank" rel="noreferrer" aria-label={`Open ${branch} ${category} photo`}><Image src={src} fill sizes="(max-width: 760px) 100vw, 33vw" alt={`${branch} ${category} photo ${index + 1}`} /></a><span className="photo-label">{index === 0 ? 'Primary · use1' : `use${index + 1}`}</span>{images.length > 1 ? <><button type="button" className="gallery-arrow gallery-prev" onClick={() => setIndex(current => (current - 1 + images.length) % images.length)} aria-label={`Previous ${category} photo`}>‹</button><button type="button" className="gallery-arrow gallery-next" onClick={() => setIndex(current => (current + 1) % images.length)} aria-label={`Next ${category} photo`}>›</button></> : null}</div><div className="gallery-count">{index + 1} / {images.length} photos</div></div></div>;
}
