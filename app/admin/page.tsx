import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../lib/auth';
import { getTimeGreeting } from '../../lib/greeting';
import { prisma } from '../../lib/prisma';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== 'ADMIN') redirect('/staff/login');
  const name = session.user.name?.trim() || 'Admin';
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [arrivals, departures, revenue, staffCount] = await Promise.all([
    prisma.booking.count({ where: { checkIn: { gte: todayStart, lt: tomorrow }, status: { in: ['PENDING', 'CONFIRMED'] } } }),
    prisma.booking.count({ where: { checkOut: { gte: todayStart, lt: tomorrow }, status: { in: ['CONFIRMED', 'COMPLETED'] } } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: todayStart, lt: tomorrow }, status: 'SUCCESSFUL' }, _sum: { amountKobo: true } }),
    prisma.user.count({ where: { role: 'STAFF' } }),
  ]);
  const todayRevenue = revenue._sum.amountKobo ?? 0;
  const formatMoney = (amountKobo: number) => `₦${(amountKobo / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  const sections = [
      { number: '01', label: 'Overview', href: '/admin', description: 'Today at a glance' },
      { number: '02', label: 'Reservations', href: '/staff', description: 'Arrivals, stays and departures' },
      { number: '03', label: 'Rooms & availability', href: '/staff', description: 'Inventory, rates and room status' },
      { number: '04', label: 'Payments', href: '/staff/reports', description: 'Revenue, refunds and settlements' },
      { number: '05', label: 'Reports', href: '/staff/reports', description: 'Performance across branches' },
      { number: '06', label: 'Staff & roles', href: '/admin/users', description: 'People, access and branches' },
      { number: '07', label: 'Reviews', href: '/staff/reviews', description: 'Guest feedback and moderation' },
      { number: '08', label: 'Audit log', href: '/admin/audit', description: 'A record of important changes' },
      { number: '09', label: 'Settings', href: '/admin/users', description: 'Account and operating defaults' },
  ];

  return <main className="admin-workspace">
      <aside className="admin-sidebar" aria-label="Admin sections">
        <div className="admin-sidebar-brand"><span className="admin-sidebar-mark">E</span><div><strong>EPhoenix</strong><small>Control centre</small></div></div>
        <nav className="admin-section-nav">
          {sections.map(section => <a key={section.number} className={section.label === 'Overview' ? 'is-active' : ''} href={section.href}><span>{section.number}</span><strong>{section.label}</strong></a>)}
        </nav>
        <a className="admin-sidebar-exit" href="/staff/login">Switch account</a>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar"><div><div className="auth-kicker">{getTimeGreeting()}, {name}</div><h1>Overview</h1><p>One calm view of the work that matters today.</p></div><a className="button button-gold" href="/staff">Open operations</a></header>
        <section className="admin-today-strip"><div><span className="admin-today-label">Today</span><strong>{new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></div><span className="admin-live"><i /> All branches online</span></section>
        <section className="admin-metrics" aria-label="Today summary">
          <a href="/staff"><span>Arrivals</span><strong>{arrivals}</strong><small>Check-ins scheduled today</small></a>
          <a href="/staff"><span>Departures</span><strong>{departures}</strong><small>Check-outs scheduled today</small></a>
          <a href="/staff/reports"><span>Revenue</span><strong>{formatMoney(todayRevenue)}</strong><small>Successful payments today</small></a>
          <a href="/admin/users"><span>Team access</span><strong>{staffCount}</strong><small>Active staff accounts</small></a>
        </section>
        <section className="admin-priority"><div><div className="eyebrow">Start here</div><h2>Run the day with confidence</h2><p>Reservations and room availability live in Operations. Everything else has a dedicated place in the workspace.</p></div><a className="button button-outline" href="/staff">Go to reservations</a></section>
        <section className="admin-section-grid">
          <div className="admin-section-grid-heading"><div><div className="eyebrow">Workspace</div><h2>Every area, one click away</h2></div><a href="/admin/audit">View latest activity <span aria-hidden="true">→</span></a></div>
          {sections.slice(1).map(section => <a className="admin-area-card" key={section.number} href={section.href}><span className="admin-area-number">{section.number}</span><div><h3>{section.label}</h3><p>{section.description}</p></div><span className="admin-area-arrow" aria-hidden="true">↗</span></a>)}
        </section>
      </section>
    </main>;
}
