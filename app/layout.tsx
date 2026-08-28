import './globals.css';
import Image from 'next/image';
import Link from 'next/link';
import { Providers } from './providers';
import { AuthControls } from '../components/AuthControls';
import NavigationProgress from '../components/NavigationProgress';
import MobileMenu from '../components/MobileMenu';

export const metadata = { title: 'EPhoenix Hotels & Tourism', description: 'Three GRA addresses. One standard of stay.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body id="top">
        <Providers>
          <NavigationProgress />
          <header className="site-header">
            <Link href="/" className="brand">
              <Image src="/ephoenix-new-logo.png" width={48} height={48} alt="EPhoenix crest" />
              <span><b>EPhoenix</b><small>Hotels & Tourism</small></span>
            </Link>
            <Link className="button button-gold nav-book-now" href="/#availability-title">Book Now</Link>
            <MobileMenu>
              <nav className="nav-drawer-menu">
                <Link href="/rooms">Rooms</Link>
                <Link href="/gallery">Gallery</Link>
                <Link href="/locations">Locations</Link>
                <Link href="/review">Review your stay</Link>
                <Link href="/cancel">Cancel booking</Link>
                <Link href="/cart">Cart</Link>
                <AuthControls />
                <Link className="button button-gold" href="/#availability-title">Book Now</Link>
              </nav>
            </MobileMenu>
            <nav className="site-nav">
              <div className="nav-primary">
                <Link href="/rooms">Rooms</Link>
                <Link href="/gallery">Gallery</Link>
                <Link href="/locations">Locations</Link>
              </div>
              <div className="nav-secondary">
                <Link href="/review">Review your stay</Link>
                <Link href="/cancel">Cancel booking</Link>
                <Link href="/cart">Cart</Link>
                <AuthControls />
              </div>
            </nav>
          </header>
          {children}
          <Link className="floating-book" href="/#availability-title">Book Now</Link>
          <footer><div><span className="footer-mark">E</span><strong>EPhoenix Hotels & Tourism</strong></div><p>Main · Annex I · Annex II, GRA Ilorin</p><p>07077014444 · 08178887145 · 08035799641</p></footer>
        </Providers>
      </body>
    </html>
  );
}
