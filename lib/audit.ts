import { prisma } from './prisma';

export async function writeAudit(actorId: string | null, action: string, entity: string, entityId: string, details: Record<string, unknown>) {
  await prisma.auditLog.create({ data: { actorId, action, entity, entityId, details: JSON.stringify(details) } });
}
