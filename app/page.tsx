import Image from 'next/image';
import Link from 'next/link';
import { hotels, rooms, naira, cloudinary, curatedImages } from '../lib/data';
import AvailabilitySearch from './availability-search';
import ActiveOffers from '../components/ActiveOffers';
import CuratedSlideshow from '../components/CuratedSlideshow';
import GuestFaq from '../components/GuestFaq';
export const dynamic = 'force-dynamic';

// Hero section - Annex II special images
const heroImageNames = ['use1.jpg', 'use1ng.jpg', 'use2.png', 'use2dds.jpg', 'use3.jpg', 'z (2).jpg', 'z (4).jpg', 'z (14).jpg', 'z (15).jpg', 'z (16).jpg', 'z (23).jpg', 'z (35).jpg', 'z (44).jpg', 'z (45).jpg', 'z (48).jpg', 'z (49).jpg', 'z (59).jpg', 'z (60).jpg', 'z (61).jpg', 'z (73).jpg', 'z (74).jpg'];
const heroImages = heroImageNames.map((name, index) => ({
  src: `${cloudinary(`ephoenix/annex-ii/special/${name.replace(/\.[^.]+$/, '').replace(/^z \((\d+)\)$/, 'z-$1')}`)}.jpg`,
  alt: index < 3 ? ['Annex II luxury highlight 1', 'Annex II luxury highlight 2', 'Annex II luxury highlight 3'][index] : `Annex II luxury photo ${index + 1}`,
}));

// Special showcase - Restaurant images
const restaurantNames = ['use1vg.jpeg', 'use2h.jpg', 'use3hy.jpeg', 'use4f.jpg', 'use58.jpeg', 'use6b.jpg', 'use7oj.jpeg', 'ef.jpeg', 'gl.jpeg', 'rg.jpeg', 'vi.jpeg', 'WhatsApp Image 2026-03-28 at 7.42.01 PM.jpeg', 'WhatsApp Image 2026-03-28 at 7.42.04 PM.jpeg', 'WhatsApp Image 2026-03-28 at 7.45.35 PM.jpeg', 'WhatsApp Image 2026-03-28 at 7.58.12 PM.jpeg', 'WhatsApp Image 2026-03-28 at 7.59.02 PM.jpeg', 'WhatsApp Image 2026-03-28 at 8.02.31 PM.jpeg', 'WhatsApp Image 2026-03-28 at 8.02.37 PM.jpeg', 'WhatsApp Image 2026-03-28 at 8.02.57 PM.jpeg'];
const special = curatedImages('ephoenix/restaurant', restaurantNames).map((src, index) => ({
  src,
  alt: index < 3 ? ['SEGILOLA RESTAURANT highlight 1', 'SEGILOLA RESTAURANT highlight 2', 'SEGILOLA RESTAURANT highlight 3'][index] : `SEGILOLA RESTAURANT photo ${index + 1}`,
}));

export default function Home() { return <>
  <main>
    <section className="hero-showcase"><CuratedSlideshow images={heroImages} hero /></section>
    <section className="hero-search"><AvailabilitySearch /></section>
    <section className="section special-showcase-section">
      <div className="section-head"><div className="eyebrow">SEGILOLA RESTAURANT AND AFRICANO EVENT</div><h2>Curated stays</h2></div>
      <CuratedSlideshow images={special} />
    </section>
    <GuestFaq />
    <ActiveOffers />
    <section className="section guest-promise-section"><div className="section-head"><div className="eyebrow">The EPhoenix promise</div><h2>Why guests choose us</h2><p className="section-intro">Thoughtful essentials, warm service, and the confidence to settle in.</p></div><div className="guest-promise-grid"><article className="guest-promise-card"><div className="promise-icon" aria-hidden="true">⚡</div><h3>24/7 power supply</h3><p>Uninterrupted power throughout your stay.</p></article><article className="guest-promise-card"><div className="promise-icon" aria-hidden="true">☕</div><h3>Complimentary breakfast</h3><p>Start your day with a delicious breakfast.</p></article><article className="guest-promise-card"><div className="promise-icon" aria-hidden="true">🏆</div><h3>Since 1981</h3><p>Over four decades of hospitality excellence.</p></article><article className="guest-promise-card"><div className="promise-icon" aria-hidden="true">◉</div><h3>Three GRA locations</h3><p>Choose the branch that works best for your stay.</p></article></div></section>
    <section className="section"><div className="section-head"><div className="eyebrow">Our properties</div><h2>Three branches, minutes apart</h2></div><div className="grid-3">{hotels.map(h=><Link className="card room-card-link" href={`/rooms?hotel=${encodeURIComponent(h.slug)}`} key={h.slug}><div className="photo"><Image src={h.image} fill sizes="(max-width: 760px) 100vw, 33vw" alt={h.shortName + ' exterior'} /><span className="photo-label">{h.shortName} - GRA</span></div><div className="card-body"><h3>{h.name.replace('E-Phoenix Hotels and Tourism ','').replace('E-Phoenix Hotel ','')}</h3><p className="muted">{h.description}</p><div className="meta"><span>{h.rooms} rooms</span><span>From {naira(Math.min(...rooms.filter(r=>r.hotel===h.slug).map(r=>r.price)))}</span></div></div></Link>)}</div></section>
    <section className="section band"><div className="section-head"><div className="eyebrow">Browse by room</div><h2>All branches, one listing</h2></div><div className="grid-4">{rooms.slice(0,8).map(r=><Link className="card room-card-link" href={`/rooms/${encodeURIComponent(r.hotel)}/${encodeURIComponent(r.slug)}`} key={r.hotel+r.name}><div className="room-photo">{r.image ? <Image src={r.image} fill sizes="(max-width: 760px) 100vw, 25vw" alt={r.name} /> : null}</div><div className="room-body"><div className="label">{hotels.find(h=>h.slug===r.hotel)?.shortName}</div><h3>{r.name}</h3><div className="price">{naira(r.price)} <small>/ night</small></div></div></Link>)}</div><div className="actions" style={{marginTop:32}}><Link href="/rooms" className="button button-outline">View all room types</Link></div></section>
  </main>
</>;
}