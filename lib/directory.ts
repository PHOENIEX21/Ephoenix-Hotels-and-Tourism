import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';
import { StaffRegistration, Department, StaffStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { resolveBranchId } from './branches';

export async function requireDirectoryManager(expectedBranchId?: string) {
  const session = await getServerSession(authOptions);
  const sessionRole = (session?.user as { role?: string } | undefined)?.role;
  const sessionId = (session?.user as { id?: string } | undefined)?.id;

  if (!sessionId || sessionRole !== 'ADMIN') {
    throw new Error('Manager authentication required.');
  }

  const manager = await prisma.user.findUnique({
    where: { id: sessionId },
    select: { id: true, name: true, role: true, hotelId: true, isGlobalManager: true, canManageStaff: true },
  });

  if (!manager || manager.role !== 'ADMIN') {
    throw new Error('Manager account not found.');
  }

  if (manager.role === 'ADMIN') {
    return { ...manager, isGlobalManager: true };
  }

  const isGlobal = manager.isGlobalManager === true;
  const hasBranchPermission = manager.canManageStaff === true && manager.hotelId !== null;

  if (!isGlobal && !hasBranchPermission) {
    throw new Error('You do not have staff directory management permission.');
  }

  if (expectedBranchId && !isGlobal && manager.hotelId !== expectedBranchId) {
    throw new Error('You do not have access to this branch.');
  }

  return { ...manager, isGlobalManager: isGlobal };
}

export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return '234' + digits.slice(1);
  return '234' + digits;
}

export function buildDuplicatePhoneWhere(phone: string) {
  const normalised = normalisePhone(phone);
  return {
    phone: { not: null },
    staffStatus: { not: StaffStatus.INACTIVE },
    OR: [
      { phone: { contains: normalised } },
      { phone: { contains: normalised.slice(3) } },
    ],
  };
}

export async function getStaffDirectory(params: {
  branch?: string;
  department?: string;
  confirmedRole?: string;
  status?: string;
  search?: string;
}) {
  const manager = await requireDirectoryManager(params.branch === 'all' || !params.branch ? undefined : params.branch);

  const where: Prisma.StaffRegistrationWhereInput = {};

  if (!manager.isGlobalManager && manager.hotelId) {
    where.hotelId = manager.hotelId;
  } else if (params.branch && params.branch !== 'all') {
    const branchId = await resolveBranchId(params.branch);
    where.hotelId = branchId;
  }

  if (params.status && ['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(params.status.toUpperCase())) {
    where.staffStatus = params.status.toUpperCase() as StaffRegistration['staffStatus'];
  }

  if (params.department && Object.values(Department).includes(params.department.toUpperCase() as Department)) {
    where.department = params.department.toUpperCase() as Department;
  }

  if (params.confirmedRole) {
    where.confirmedRole = { contains: params.confirmedRole, mode: 'insensitive' };
  }

  if (params.search) {
    const term = params.search.trim();
    where.OR = [
      { fullName: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
      { originalRole: { contains: term, mode: 'insensitive' } },
    ];
  }

  const registrations = await prisma.staffRegistration.findMany({
    where,
    include: {
      hotel: { select: { id: true, name: true, slug: true } },
      confirmedBy: { select: { id: true, name: true, email: true } },
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });

  return { manager, registrations };
}

export async function approveStaffRegistration(id: string) {
  const manager = await requireDirectoryManager();
  const registration = await prisma.staffRegistration.findUnique({
    where: { id },
    include: { hotel: true, user: true },
  });

  if (!registration) throw new Error('Registration not found.');
  if (registration.staffStatus === 'ACTIVE') throw new Error('Already approved.');

  const updated = await prisma.staffRegistration.update({
    where: { id },
    data: {
      staffStatus: 'ACTIVE',
      confirmedAt: new Date(),
      confirmedById: manager.id,
    },
    include: {
      hotel: { select: { id: true, name: true, slug: true } },
      confirmedBy: { select: { id: true, name: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: manager.id,
      action: 'STAFF_REGISTRATION_APPROVED',
      entity: 'StaffRegistration',
      entityId: id,
      details: JSON.stringify({ fullName: registration.fullName, hotelId: registration.hotelId }),
    },
  });

  return updated;
}

export async function approveAllPendingStaffRegistrations() {
  const manager = await requireDirectoryManager();

  const pending = await prisma.staffRegistration.findMany({
    where: { staffStatus: 'PENDING' },
    select: { id: true, fullName: true, hotelId: true },
  });

  if (pending.length === 0) {
    return { updated: [] as { id: string; fullName: string }[], count: 0 };
  }

  const updated = await prisma.staffRegistration.updateMany({
    where: { staffStatus: 'PENDING' },
    data: {
      staffStatus: 'ACTIVE',
      confirmedAt: new Date(),
      confirmedById: manager.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: manager.id,
      action: 'STAFF_REGISTRATION_APPROVED_ALL',
      entity: 'StaffRegistration',
      entityId: 'all',
      details: JSON.stringify({ count: updated.count }),
    },
  });

  return {
    updated: pending.map((p) => ({ id: p.id, fullName: p.fullName })),
    count: updated.count,
  };
}

export async function suspendStaffRegistration(id: string) {
  const manager = await requireDirectoryManager();
  const registration = await prisma.staffRegistration.findUnique({ where: { id } });
  if (!registration) throw new Error('Registration not found.');
  if (registration.staffStatus === 'SUSPENDED') throw new Error('Already suspended.');

  const updated = await prisma.staffRegistration.update({
    where: { id },
    data: {
      staffStatus: 'SUSPENDED',
      confirmedAt: new Date(),
      confirmedById: manager.id,
    },
    include: {
      hotel: { select: { id: true, name: true, slug: true } },
      confirmedBy: { select: { id: true, name: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: manager.id,
      action: 'STAFF_REGISTRATION_SUSPENDED',
      entity: 'StaffRegistration',
      entityId: id,
      details: JSON.stringify({ fullName: registration.fullName }),
    },
  });

  return updated;
}

export async function deactivateStaffRegistration(id: string) {
  const manager = await requireDirectoryManager();
  const registration = await prisma.staffRegistration.findUnique({ where: { id } });
  if (!registration) throw new Error('Registration not found.');
  if (registration.staffStatus === 'INACTIVE') throw new Error('Already inactive.');

  const updated = await prisma.staffRegistration.update({
    where: { id },
    data: {
      staffStatus: 'INACTIVE',
      confirmedAt: new Date(),
      confirmedById: manager.id,
    },
    include: {
      hotel: { select: { id: true, name: true, slug: true } },
      confirmedBy: { select: { id: true, name: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: manager.id,
      action: 'STAFF_REGISTRATION_DEACTIVATED',
      entity: 'StaffRegistration',
      entityId: id,
      details: JSON.stringify({ fullName: registration.fullName }),
    },
  });

  return updated;
}

export async function updateStaffRegistration(id: string, data: {
  confirmedRole?: string;
  confirmedDepartment?: Department;
  fullName?: string;
  phone?: string;
  email?: string;
  originalRole?: string;
  department?: Department;
  whatsappConsent?: boolean;
}) {
  const manager = await requireDirectoryManager();
  const registration = await prisma.staffRegistration.findUnique({ where: { id } });
  if (!registration) throw new Error('Registration not found.');

  const updated = await prisma.staffRegistration.update({
    where: { id },
    data: {
      ...data,
      confirmedAt: new Date(),
      confirmedById: manager.id,
    },
    include: {
      hotel: { select: { id: true, name: true, slug: true } },
      confirmedBy: { select: { id: true, name: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: manager.id,
      action: 'STAFF_REGISTRATION_UPDATED',
      entity: 'StaffRegistration',
      entityId: id,
      details: JSON.stringify({ fields: Object.keys(data) }),
    },
  });

  return updated;
}

export async function sendWhatsAppInvitation(id: string) {
  const manager = await requireDirectoryManager();
  const registration = await prisma.staffRegistration.findUnique({
    where: { id },
    include: { hotel: true },
  });

  if (!registration) throw new Error('Registration not found.');
  if (registration.staffStatus !== 'ACTIVE') throw new Error('Only active staff can receive invitations.');
  if (!registration.whatsappConsent) throw new Error('Staff member has not given WhatsApp consent.');
  if (!registration.phone) throw new Error('No phone number on file.');

  const updated = await prisma.staffRegistration.update({
    where: { id },
    data: {
      whatsappInvitationStatus: 'SENT',
      invitedAt: new Date(),
    },
    include: {
      hotel: { select: { id: true, name: true, slug: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: manager.id,
      action: 'WHATSAPP_INVITATION_SENT',
      entity: 'StaffRegistration',
      entityId: id,
      details: JSON.stringify({ fullName: registration.fullName, phone: registration.phone }),
    },
  });

  return updated;
}

export async function sendWhatsAppGroupLink(groupLink: string) {
  const manager = await requireDirectoryManager();

  const registrations = await prisma.staffRegistration.findMany({
    where: {
      staffStatus: 'ACTIVE',
      whatsappConsent: true,
      phone: { not: null },
    },
    select: { id: true, fullName: true, phone: true },
  });

  if (registrations.length === 0) {
    throw new Error('No active consented staff with phone numbers found.');
  }

  const message = `EPhoenix Hotels & Tourism staff WhatsApp group: ${groupLink}`;
  const opened = registrations.map((r) => {
    const url = new URL('https://wa.me/' + r.phone!.replace(/\D/g, ''));
    url.searchParams.set('text', message);
    return { id: r.id, fullName: r.fullName, url: url.toString() };
  });

  await prisma.auditLog.create({
    data: {
      actorId: manager.id,
      action: 'WHATSAPP_GROUP_LINK_PREPARED',
      entity: 'StaffRegistration',
      entityId: 'group-link',
      details: JSON.stringify({ count: opened.length, groupLink }),
    },
  });

  return { count: opened.length, opened };
}

export async function exportStaffCsv(branch?: string) {
  const { registrations } = await getStaffDirectory({ branch });

  const headers = [
    'Name',
    'Phone',
    'Email',
    'Branch',
    'Department',
    'Original Role',
    'Confirmed Role',
    'Status',
    'WhatsApp Consent',
    'Submitted At',
  ];

  const rows = registrations.map((r) => [
    r.fullName,
    r.phone || '',
    r.email || '',
    r.hotel?.name || '',
    r.department,
    r.originalRole,
    r.confirmedRole || '',
    r.staffStatus,
    r.whatsappConsent ? 'Yes' : 'No',
    r.submittedAt.toISOString(),
  ]);

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="staff-directory-${branch || 'all'}-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
