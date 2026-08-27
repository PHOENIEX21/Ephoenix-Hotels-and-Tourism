import './globals.css';
import Image from 'next/image';
import Link from 'next/link';
import { Providers } from './providers';
import { AuthControls } from '../components/AuthControls';

export const metadata = { title: 'EPhoenix Hotels & Tourism', description: 'Three GRA addresses. One standard of stay.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Providers><header className="site-header"><Link href="/" className="brand"><Image src="/ephoenix-new-logo.png" width={48} height={48} alt="EPhoenix crest" /><span><b>EPhoenix</b><small>Hotels & Tourism</small></span></Link><nav><Link href="/rooms">Rooms</Link><Link href="/gallery">Gallery</Link><Link href="/locations">Locations</Link><Link href="/review">Review your stay</Link><Link href="/cancel">Cancel booking</Link><AuthControls /><a className="button button-gold" href="tel:07077014444">Call to enquire</a></nav></header>{children}<footer><div><span className="footer-mark">E</span><strong>EPhoenix Hotels & Tourism</strong></div><p>Main · Annex I · Annex II, GRA Ilorin</p><p>07077014444 · 08178887145 · 08035799641</p></footer></Providers></body></html>;
}
