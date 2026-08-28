'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function NavigationProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  useEffect(() => setLoading(false), [pathname]);
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      if (link?.href.startsWith(window.location.origin) && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        setLoading(true);
        window.setTimeout(() => setLoading(false), 800);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  return loading ? <div className="navigation-loader" role="status" aria-label="Loading page"><span className="loader-arc loader-purple" /><span className="loader-arc loader-gold" /></div> : null;
}
