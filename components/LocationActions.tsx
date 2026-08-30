export default function LocationActions({ address, phone }: { address: string; phone: string }) {
  return <div className="location-actions">
    <a className="button button-outline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">Get directions</a>
    <a className="location-phone" href={`tel:${phone.split(' / ')[0]}`}>Call branch</a>
  </div>;
}
