import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../lib/auth';
import StaffDashboard from './staff-dashboard';

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || (role !== 'STAFF' && role !== 'ADMIN')) redirect('/staff/login');
  return <StaffDashboard />;
}