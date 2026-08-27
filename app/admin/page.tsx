import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../lib/auth';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== 'ADMIN') redirect('/staff/login');
  return (
    <main style={{ maxWidth: 800, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>Admin dashboard</h1>
      <p>Admin tools (offers, reports, review moderation) are available from the staff console.</p>
      <p><a href="/staff/offers">Offers</a> &middot; <a href="/staff/reports">Reports</a> &middot; <a href="/staff/reviews">Reviews</a></p>
    </main>
  );
}
