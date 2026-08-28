import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../lib/auth';
import { getTimeGreeting } from '../../lib/greeting';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== 'ADMIN') redirect('/staff/login');
  const name = session.user.name?.trim() || 'Admin';
  return (
    <main className="dashboard-page admin-dashboard"><div className="dashboard-heading"><div className="auth-kicker">{getTimeGreeting()}, {name}</div><h1>Admin dashboard</h1><p>One clear place to run every EPhoenix branch.</p></div><section className="dashboard-guide" aria-label="Admin workflow"><div><span>1</span><strong>Set up access</strong><p>Add staff and assign their branch.</p></div><div><span>2</span><strong>Run today</strong><p>Review arrivals, departures, and rooms.</p></div><div><span>3</span><strong>Improve service</strong><p>Check reports, offers, and reviews.</p></div></section><div className="dashboard-section-heading"><div><div className="eyebrow">Control centre</div><h2>Choose what you need to do</h2></div><a className="button button-gold" href="/staff">Open operations</a></div><div className="dashboard-grid"><a className="dashboard-card dashboard-card-primary" href="/staff"><span>01 · DAILY WORK</span><h2>Operations dashboard</h2><p>See today&apos;s arrivals, departures, reservations, and branch room availability.</p><strong>Open operations <span aria-hidden="true">→</span></strong></a><a className="dashboard-card" href="/admin/users"><span>02 · TEAM ACCESS</span><h2>Staff and branches</h2><p>Create staff accounts and choose the branch each person can operate.</p><strong>Manage staff <span aria-hidden="true">→</span></strong></a><a className="dashboard-card" href="/staff/reports"><span>03 · PERFORMANCE</span><h2>Reports</h2><p>Review occupancy, revenue, refunds, and booking status.</p><strong>View reports <span aria-hidden="true">→</span></strong></a><a className="dashboard-card" href="/staff/offers"><span>04 · SALES</span><h2>Offers</h2><p>Keep promotions and room offers accurate for guests.</p><strong>Manage offers <span aria-hidden="true">→</span></strong></a><a className="dashboard-card" href="/staff/reviews"><span>05 · GUEST CARE</span><h2>Guest reviews</h2><p>Moderate feedback and publish the reviews you want guests to see.</p><strong>Review feedback <span aria-hidden="true">→</span></strong></a></div></main>
  );
}
