import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import CancellationLookup from './cancellation-lookup';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');
  const email = session.user.email;
  const bookings = await prisma.booking.findMany({ where: { guestEmail: email.toLowerCase() }, orderBy: { createdAt: 'desc' }, include: { refund: true } });
  return <main style={{ maxWidth: 900, margin: '4rem auto', padding: '0 1rem' }}><h1>Guest dashboard</h1>{bookings.length ? bookings.map(booking => <section key={booking.id} style={{ border: '1px solid #ddd', padding: 16, marginTop: 16 }}><h2>{booking.reference}</h2><p>{booking.status} · Check-in {booking.checkIn.toLocaleDateString()}</p><CancellationLookup reference={booking.reference} email={email} disabled={booking.status !== 'CONFIRMED'} /></section>) : <p>No bookings found.</p>}</main>;
}