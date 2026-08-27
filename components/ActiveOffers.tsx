import { prisma } from '../lib/prisma';

export default async function ActiveOffers() {
  const offers = await prisma.offer.findMany({ where: { active: true, startsAt: { lte: new Date() }, endsAt: { gte: new Date() } }, include: { hotel: true, roomType: true }, orderBy: { createdAt: 'desc' }, take: 6 });
  if (!offers.length) return null;
  return <section className="section band"><div className="section-head"><div className="eyebrow">Current offers</div><h2>Stay for less</h2></div><div className="grid-3">{offers.map(offer => <article className="card card-body" key={offer.id}><h3>{offer.name}</h3><p>{offer.description || (offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}% off eligible stays` : `₦${(offer.discountValue / 100).toLocaleString('en-NG')} off eligible stays`)}</p><p className="muted">{offer.roomType?.name || offer.hotel?.name || 'All branches'}</p></article>)}</div></section>;
}
