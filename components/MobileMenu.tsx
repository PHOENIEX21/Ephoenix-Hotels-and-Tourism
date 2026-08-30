'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthControls } from './AuthControls';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  return <>
    <div className="header-brand-text">
      <strong>EPhoenix Hotels & Tourism</strong>
      <p>Uniquely, awesome, hospitality</p>
    </div>
    <div className="header-socials" aria-label="Social media">
      <a href="https://www.facebook.com/ever.phoenix.2025" target="_blank" rel="noreferrer" aria-label="Facebook"><img src="https://cdn.simpleicons.org/facebook/1877F2" alt="Facebook" /></a>
      <a href="https://www.instagram.com/ephoenixhotel.ng" target="_blank" rel="noreferrer" aria-label="Instagram"><img src="https://cdn.simpleicons.org/instagram/E4405F" alt="Instagram" /></a>
      <a href="https://www.tiktok.com/@ephoenixhotel.ng" target="_blank" rel="noreferrer" aria-label="TikTok"><img src="https://cdn.simpleicons.org/tiktok/111111" alt="TikTok" /></a>
      <a href="https://wa.me/2347065023672" target="_blank" rel="noreferrer" aria-label="WhatsApp"><img src="https://cdn.simpleicons.org/whatsapp/25D366" alt="WhatsApp" /></a>
    </div>
    <button type="button" className="menu-toggle" onClick={() => setOpen(current => !current)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open}>
      <span /><span /><span />
    </button>
    <div className={open ? 'mobile-menu is-open' : 'mobile-menu'}>
      <Link href="/rooms" onClick={() => setOpen(false)}>Rooms</Link>
      <Link href="/gallery" onClick={() => setOpen(false)}>Gallery</Link>
      <Link href="/locations" onClick={() => setOpen(false)}>Locations</Link>
      <Link href="/review" onClick={() => setOpen(false)}>Review</Link>
      <Link href="/cancel" onClick={() => setOpen(false)}>Cancel</Link>
      <Link href="/cart" onClick={() => setOpen(false)}>Cart</Link>
      <AuthControls />
    </div>
  </>;
}
