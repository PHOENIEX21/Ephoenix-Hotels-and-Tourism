import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../lib/auth';
import StaffDirectoryManager from '../../staff/directory/directory-manager';

export default async function AdminStaffDirectoryPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== 'ADMIN') redirect('/staff/login');
  return <StaffDirectoryManager />;
}
