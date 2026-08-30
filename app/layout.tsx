import './globals.css';
import Image from 'next/image';
import Link from 'next/link';
import { Providers } from './providers';
import NavigationProgress from '../components/NavigationProgress';
import MobileMenu from '../components/MobileMenu';

export const metadata = {
  title: 'EPhoenix Hotels & Tourism',
  description: 'Three GRA addresses. One standard of stay.',
};

const branches = [
  ['Main', '45 Aderemi Adeleye Street, GRA, Ilorin', '07077014444'],
  ['Annex I', '6 Umar Audi Road, Tanke Junction, GRA, Ilorin', '08062267110'],
  ['Annex II', '13 Reservation Road, Flower Garden, GRA, Ilorin', '09084878587'],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body id="top"><Providers><NavigationProgress /><header className="site-header"><Link href="/" className="brand"><Image src="/ephoenix-new-logo.png" width={48} height={48} alt="EPhoenix crest" /><span><b>EPhoenix</b><small>Hotels & Tourism</small></span></Link><MobileMenu /></header>{children}<Link className="floating-book" href="/#availability-title">Book Now</Link><footer><div><span className="footer-mark">E</span><strong>EPhoenix Hotels & Tourism</strong></div><p>Main · Annex I · Annex II, GRA Ilorin</p><p>07077014444 · 08178887145 · 08035799641</p></footer></Providers></body></html>;
}



