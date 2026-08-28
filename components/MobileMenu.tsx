'use client';

import { useEffect, useState } from 'react';

export default function MobileMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="nav-mobile-toggle"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="nav-mobile-toggle-bar" />
        <span className="nav-mobile-toggle-bar" />
        <span className="nav-mobile-toggle-bar" />
      </button>
      <div className={`nav-mobile-drawer${open ? ' nav-mobile-drawer--open' : ''}`} aria-hidden={!open}>
        <div className="nav-mobile-drawer-sheet">{children}</div>
      </div>
    </>
  );
}
