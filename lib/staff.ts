import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';

export async function requireStaff() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string; role?: string } | undefined)?.id;
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!userId || (role !== 'STAFF' && role !== 'ADMIN')) throw new Error('Staff or admin authentication is required.');
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, hotelId: true } });
  if (!user || (user.role !== 'STAFF' && user.role !== 'ADMIN') || (user.role === 'STAFF' && !user.hotelId)) throw new Error('Staff account is not correctly configured.');
  return user;
}