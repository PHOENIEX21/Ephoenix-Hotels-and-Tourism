import { prisma } from './prisma';

export const BRANCH_NAMES = ['Main Branch', 'Annex 1', 'Annex 2'] as const;
export type BranchName = (typeof BRANCH_NAMES)[number];

const BRANCH_NAME_MAP: Record<BranchName, string> = {
  'Main Branch': 'E-Phoenix Hotels and Tourism (Main)',
  'Annex 1': 'E-Phoenix Hotels and Tourism (Annex 1)',
  'Annex 2': 'E-Phoenix Hotel (Annex II)',
};

export function isBranchName(value: unknown): value is BranchName {
  return typeof value === 'string' && BRANCH_NAMES.includes(value as BranchName);
}

export async function resolveBranchId(branchName: string): Promise<string> {
  const actualName = BRANCH_NAME_MAP[branchName as BranchName] || branchName;
  const hotel = await prisma.hotel.findFirst({
    where: { name: actualName },
    select: { id: true },
  });
  if (!hotel) throw new Error('Invalid branch.');
  return hotel.id;
}

export async function getBranchNameById(hotelId: string): Promise<string> {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { name: true },
  });
  if (!hotel) throw new Error('Invalid branch id.');
  return hotel.name;
}
