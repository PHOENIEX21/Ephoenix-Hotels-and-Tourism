import Image from 'next/image';
import Link from 'next/link';
import { hotels, rooms, naira, cloudinary } from '../lib/data';
import AvailabilitySearch from './availability-search';
import ActiveOffers from '../components/ActiveOffers';
export const dynamic = 'force-dynamic';

const special = [
  { src: cloudinary('ephoenix/annex-ii/special/use1'), alt: 'Annex II - street exterior' },
  { src: cloudinary('ephoenix/annex-ii/special/use2'), alt: 'Annex II - pool' },
  { src: cloudinary('ephoenix/annex-ii/special/use3'), alt: 'Annex II - teal-velvet lobby' },
];

export default function Home() { return <>
  <main>
    <section className="hero" style={{ backgroundImage: `linear-gradient(to top, rgba(34,23,51,0.78) 0%, rgba(34,23,51,0) 33%), url(${cloudinary('ephoenix/annex-ii/special/use1')})` }}>
      <div className="hero-inner">
        <h1>Three addresses in GRA. One EPhoenix standard.</h1>
        <p>Search, compare, and book across all our branches — pick the room that&apos;s right for you.</p>
        <AvailabilitySearch />
      </div>
    </section>
    <section className="section special-showcase-section">
      <div className="section-head"><div className="eyebrow">Annex II - special</div><h2>Curated stays</h2></div>
      <div className="special-showcase">
        {special.map((s) => (
          <figure className="special-figure" key={s.src}>
            <img src={s.src} alt={s.alt} className="special-img" />
          </figure>
        ))}
      </div>
    </section>
    <ActiveOffers />
    <section className="section"><div className="section-head"><div className="eyebrow">Our properties</div><h2>Three branches, minutes apart</h2></div><div className="grid-3">{hotels.map(h=><article className="card" key={h.slug}><div className="photo"><Image src={h.image} fill sizes="(max-width: 760px) 100vw, 33vw" alt={h.shortName + ' exterior'} /><span className="photo-label">{h.shortName} - GRA</span></div><div className="card-body"><h3>{h.name.replace('E-Phoenix Hotels and Tourism ','').replace('E-Phoenix Hotel ','')}</h3><p className="muted">{h.description}</p><div className="meta"><span>{h.rooms} rooms</span><span>From {naira(Math.min(...rooms.filter(r=>r.hotel===h.slug).map(r=>r.price)))}</span></div></div></article>)}</div></section>
    <section className="section band"><div className="section-head"><div className="eyebrow">Browse by room</div><h2>All branches, one listing</h2></div><div className="grid-4">{rooms.slice(0,8).map(r=><article className="card" key={r.hotel+r.name}><div className="room-photo"></div><div className="room-body"><div className="label">{hotels.find(h=>h.slug===r.hotel)?.shortName}</div><h3>{r.name}</h3><div className="price">{naira(r.price)} <small>/ night</small></div></div></article>)}</div><div className="actions" style={{marginTop:32}}><Link href="/rooms" className="button button-outline">View all room types</Link></div></section>
  </main>
</>;
}