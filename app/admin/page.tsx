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
    <main className="dashboard-page"><div className="dashboard-heading"><div className="auth-kicker">{getTimeGreeting()}, {name}</div><h1>Admin dashboard</h1><p>Keep the guest experience polished across every branch from one secure workspace.</p></div><div className="dashboard-grid"><a className="dashboard-card" href="/staff"><span>01</span><h2>Staff console</h2><p>View today&apos;s bookings and branch activity.</p></a><a className="dashboard-card" href="/staff/offers"><span>02</span><h2>Offers</h2><p>Manage promotions shown to guests.</p></a><a className="dashboard-card" href="/staff/reports"><span>03</span><h2>Reports</h2><p>Review operational performance.</p></a><a className="dashboard-card" href="/staff/reviews"><span>04</span><h2>Guest reviews</h2><p>Moderate and publish guest feedback.</p></a></div></main>
  );
}
