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
  return <html lang="en"><body id="top"><Providers><NavigationProgress /><header className="site-header"><Link href="/" className="brand"><Image src="/ephoenix-new-logo.png" width={48} height={48} alt="EPhoenix crest" /><span><b>EPhoenix</b><small>Hotels & Tourism</small></span></Link><MobileMenu /></header>{children}<Link className="floating-book" href="/#availability-title">Book Now</Link><footer><div className="footer-grid"><div className="footer-brand"><div className="footer-brand-text"><strong>EPhoenix Hotels & Tourism</strong><p>Uniquely, awesome, hospitality</p></div><div className="footer-socials" aria-label="Social media"><h3>Follow us</h3><div className="social-icons"><a className="social-icon" href="https://www.facebook.com/ever.phoenix.2025" target="_blank" rel="noreferrer" aria-label="Facebook"><img src="https://cdn.simpleicons.org/facebook/502078" alt="Facebook" /></a><a className="social-icon" href="https://www.instagram.com/ephoenixhotel.ng" target="_blank" rel="noreferrer" aria-label="Instagram"><img src="https://cdn.simpleicons.org/instagram/502078" alt="Instagram" /></a><a className="social-icon" href="https://www.tiktok.com/@ephoenixhotel.ng" target="_blank" rel="noreferrer" aria-label="TikTok"><img src="https://cdn.simpleicons.org/tiktok/502078" alt="TikTok" /></a><a className="social-icon" href="https://wa.me/2347065023672" target="_blank" rel="noreferrer" aria-label="WhatsApp"><img src="https://cdn.simpleicons.org/whatsapp/502078" alt="WhatsApp" /></a></div></div><p>Three GRA addresses. One warm welcome, wherever your stay takes you.</p><Link className="footer-cta" href="/#availability-title">Plan your stay <span>?</span></Link></div><div><h3>Quick links</h3><Link href="/rooms">Rooms & suites</Link><Link href="/gallery">Gallery</Link><Link href="/locations">Our locations</Link><Link href="/cancel">Cancel booking</Link><Link href="/login">Guest login</Link><Link href="/register">Create an account</Link></div><div><h3>Visit EPhoenix</h3>{branches.map(([name, address, phone]) => <div className="footer-contact" key={name}><strong>{name}</strong><span>{address}</span><a href={`tel:${phone}`}>{phone}</a><a className="whatsapp-contact" href="https://wa.me/2347065023672" target="_blank" rel="noreferrer">WhatsApp us</a></div>)}</div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} EPhoenix Hotels & Tourism</span><Link href="#top">Back to top ?</Link></div></footer></Providers></body></html>;
}


