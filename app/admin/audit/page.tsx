import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ action?: string; from?: string; to?: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== 'ADMIN') redirect('/staff/login');
  const params = await searchParams;
  const where = { ...(params.action ? { action: params.action } : {}), ...(params.from || params.to ? { createdAt: { ...(params.from ? { gte: new Date(`${params.from}T00:00:00.000Z`) } : {}), ...(params.to ? { lte: new Date(`${params.to}T23:59:59.999Z`) } : {}) } } : {}) };
  const [entries, actions] = await Promise.all([
    prisma.auditLog.findMany({ where, include: { actor: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 250 }),
    prisma.auditLog.findMany({ distinct: ['action'], select: { action: true }, orderBy: { action: 'asc' } }),
  ]);
  return <main className="admin-audit-page"><div className="staff-admin-header"><div><div className="eyebrow">Admin only</div><h1>Audit log</h1><p>Review important booking, payment, staff, offer, and review activity.</p></div><a className="button button-outline" href="/admin">Back to admin</a></div><form className="audit-filters"><label>Action<select name="action" defaultValue={params.action || ''}><option value="">All actions</option>{actions.map(item => <option key={item.action} value={item.action}>{item.action}</option>)}</select></label><label>From<input type="date" name="from" defaultValue={params.from || ''} /></label><label>To<input type="date" name="to" defaultValue={params.to || ''} /></label><button className="button button-gold" type="submit">Filter</button></form><div className="table-scroll audit-table-wrap"><table><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Record</th><th>Old / new values and details</th></tr></thead><tbody>{entries.map(entry => { let details = entry.details; try { details = JSON.stringify(JSON.parse(entry.details), null, 2); } catch {} return <tr key={entry.id}><td>{entry.createdAt.toLocaleString('en-NG')}</td><td>{entry.actor?.name || entry.actor?.email || 'System / guest'}</td><td><span className="status-pill">{entry.action}</span></td><td>{entry.entity}<br /><span>{entry.entityId}</span></td><td><pre>{details}</pre></td></tr>; })}{!entries.length ? <tr><td colSpan={5}>No audit entries match these filters.</td></tr> : null}</tbody></table></div></main>;
}