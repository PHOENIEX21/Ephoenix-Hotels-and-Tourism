import Image from 'next/image';
import Link from 'next/link';
import { hotels, rooms, naira, cloudinary, curatedImages } from '../lib/data';
import AvailabilitySearch from './availability-search';
import ActiveOffers from '../components/ActiveOffers';
import CuratedSlideshow from '../components/CuratedSlideshow';
export const dynamic = 'force-dynamic';

const specialNames = ['use1', 'use2', 'use3', 'z-2', 'z-4', 'z-14', 'z-15', 'z-16', 'z-23', 'z-35', 'z-44', 'z-45', 'z-48', 'z-49', 'z-59', 'z-60', 'z-61', 'z-73', 'z-74'];
const special = curatedImages('ephoenix/annex-ii/special', specialNames).map((src, index) => ({
  src,
  alt: index < 3 ? ['Annex II - special highlight 1', 'Annex II - special highlight 2', 'Annex II - special highlight 3'][index] : `Annex II - special photo ${index + 1}`,
}));

export default function Home() { return <>
  <main>
    <section className="hero" style={{ backgroundImage: `linear-gradient(to top, rgba(34,23,51,0.86) 0%, rgba(34,23,51,0.58) 55%, rgba(34,23,51,0.28) 100%), url(${cloudinary('ephoenix/annex-ii/special/use1')})` }}>
      <div className="hero-inner">
        <h1>Three addresses in GRA. One EPhoenix standard.</h1>
        <p>Search, compare, and book across all our branches — pick the room that&apos;s right for you.</p>
        <AvailabilitySearch />
      </div>
    </section>
    <section className="section special-showcase-section">
      <div className="section-head"><div className="eyebrow">Annex II - special</div><h2>Curated stays</h2></div>
      <CuratedSlideshow images={special} />
    </section>
    <ActiveOffers />
    <section className="section"><div className="section-head"><div className="eyebrow">Our properties</div><h2>Three branches, minutes apart</h2></div><div className="grid-3">{hotels.map(h=><Link className="card room-card-link" href={`/rooms?hotel=${encodeURIComponent(h.slug)}`} key={h.slug}><div className="photo"><Image src={h.image} fill sizes="(max-width: 760px) 100vw, 33vw" alt={h.shortName + ' exterior'} /><span className="photo-label">{h.shortName} - GRA</span></div><div className="card-body"><h3>{h.name.replace('E-Phoenix Hotels and Tourism ','').replace('E-Phoenix Hotel ','')}</h3><p className="muted">{h.description}</p><div className="meta"><span>{h.rooms} rooms</span><span>From {naira(Math.min(...rooms.filter(r=>r.hotel===h.slug).map(r=>r.price)))}</span></div></div></Link>)}</div></section>
    <section className="section band"><div className="section-head"><div className="eyebrow">Browse by room</div><h2>All branches, one listing</h2></div><div className="grid-4">{rooms.slice(0,8).map(r=><Link className="card room-card-link" href={`/book?roomTypeSlug=${encodeURIComponent(r.slug)}&hotel=${encodeURIComponent(r.hotel)}`} key={r.hotel+r.name}><div className="room-photo">{r.image ? <Image src={r.image} fill sizes="(max-width: 760px) 100vw, 25vw" alt={r.name} /> : null}</div><div className="room-body"><div className="label">{hotels.find(h=>h.slug===r.hotel)?.shortName}</div><h3>{r.name}</h3><div className="price">{naira(r.price)} <small>/ night</small></div></div></Link>)}</div><div className="actions" style={{marginTop:32}}><Link href="/rooms" className="button button-outline">View all room types</Link></div></section>
  </main>
</>;
}