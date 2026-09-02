'use client';

import { FormEvent, useEffect, useMemo, useCallback, useState } from 'react';
import { Department, StaffStatus, StaffRegistration } from '@prisma/client';

type Registration = StaffRegistration & {
  hotel: { id: string; name: string; slug: string } | null;
  confirmedBy: { id: string; name: string } | null;
  user: { id: string; email: string; name: string } | null;
};

type Manager = {
  id: string;
  name: string;
  role: string;
  hotelId: string | null;
  isGlobalManager: boolean;
};

const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: 'FRONT_OFFICE', label: 'Front Office/Reception' },
  { value: 'HOUSEKEEPING', label: 'Housekeeping' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'KITCHEN', label: 'Kitchen' },
  { value: 'POOL_BAR', label: 'Pool Bar' },
  { value: 'ACCOUNTS', label: 'Accounts/Finance' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'MANAGEMENT', label: 'Management' },
  { value: 'OTHER', label: 'Other' },
];

const STATUSES: { value: StaffStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending approval' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const BRANCHES = ['all', 'Main Branch', 'Annex 1', 'Annex 2'] as const;

function formatDepartment(value: Department): string {
  return DEPARTMENTS.find((d) => d.value === value)?.label || value;
}

export default function StaffDirectoryManager() {
  const [manager, setManager] = useState<Manager | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ confirmedRole: '', confirmedDepartment: '', fullName: '', phone: '', originalRole: '', department: '', whatsappConsent: false });
  const [filters, setFilters] = useState({ branch: 'all', department: '', confirmedRole: '', status: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.branch && filters.branch !== 'all') params.set('branch', filters.branch);
      if (filters.department) params.set('department', filters.department);
      if (filters.confirmedRole) params.set('confirmedRole', filters.confirmedRole);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);

      const response = await fetch(`/api/staff/directory?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Unable to load directory.');
        setLoading(false);
        return;
      }
      setManager(payload.manager);
      setRegistrations(payload.registrations || []);
    } catch {
      setError('Unable to load directory.');
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setFilters((prev) => ({ ...prev, search: String(formData.get('search') || '') }));
  }

  function handleFilterChange(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(id: string, action: 'approve' | 'suspend' | 'deactivate' | 'whatsapp') {
    setActionLoading(id + action);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/staff/directory?id=${encodeURIComponent(id)}&action=${action}`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Action failed.');
        setActionLoading(null);
        return;
      }
      setMessage('Done.');
      await load();
    } catch {
      setError('Action failed.');
    }
    setActionLoading(null);
  }

  function startEdit(reg: Registration) {
    setEditingId(reg.id);
    setEditForm({
      confirmedRole: reg.confirmedRole || '',
      confirmedDepartment: reg.confirmedDepartment || '',
      fullName: reg.fullName,
      phone: reg.phone || '',
      originalRole: reg.originalRole,
      department: reg.department,
      whatsappConsent: reg.whatsappConsent,
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    setActionLoading('edit-' + editingId);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/staff/directory?id=${encodeURIComponent(editingId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Update failed.');
        setActionLoading(null);
        return;
      }
      setMessage('Record updated.');
      setEditingId(null);
      await load();
    } catch {
      setError('Update failed.');
    }
    setActionLoading(null);
  }

  const grouped = useMemo(() => {
    const groups: Record<string, Record<string, Registration[]>> = {};
    for (const reg of registrations) {
      const branch = reg.hotel?.name || 'Unknown';
      const role = reg.confirmedRole || 'Uncategorised';
      if (!groups[branch]) groups[branch] = {};
      if (!groups[branch][role]) groups[branch][role] = [];
      groups[branch][role].push(reg);
    }
    return groups;
  }, [registrations]);

  const counts = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const reg of registrations) {
      stats[reg.staffStatus] = (stats[reg.staffStatus] || 0) + 1;
    }
    return stats;
  }, [registrations]);

  return (
    <main className="staff-directory-page">
      <header className="staff-directory-header">
        <div>
          <h1>Staff directory</h1>
          <p>Total: {registrations.length} {manager?.isGlobalManager ? '· All branches' : '· Branch view'}</p>
        </div>
        <div className="staff-directory-actions">
          <a className="button button-outline" href={`/staff/directory/print?branch=${filters.branch || 'all'}`} target="_blank" rel="noreferrer">Print</a>
          <button className="button button-outline" onClick={() => window.open(`/api/staff/directory?export=true&branch=${filters.branch || 'all'}`, '_blank')}>Export CSV</button>
        </div>
      </header>

      {error ? <p className="dashboard-alert" role="alert">{error}</p> : null}
      {message ? <p className="dashboard-success" role="status">{message}</p> : null}

      <section className="staff-directory-stats">
        {STATUSES.map((s) => (
          <div key={s.value} className="stat-pill">
            <strong>{counts[s.value] || 0}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </section>

      <section className="staff-directory-toolbar">
        <form className="staff-directory-search" onSubmit={handleSearch}>
          <input name="search" placeholder="Search name or phone..." defaultValue={filters.search} />
          <button type="submit" className="button button-gold">Search</button>
        </form>
        <button className="button button-outline" onClick={() => setShowFilters((v) => !v)}>
          {showFilters ? 'Hide filters' : 'Filters'}
        </button>
      </section>

      {showFilters && (
        <section className="staff-directory-filters">
          <label>
            Branch
            <select value={filters.branch} onChange={(e) => handleFilterChange('branch', e.target.value)}>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b === 'all' ? 'All branches' : b}</option>
              ))}
            </select>
          </label>
          <label>
            Department
            <select value={filters.department} onChange={(e) => handleFilterChange('department', e.target.value)}>
              <option value="">All departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </section>
      )}

      {loading ? (
        <p>Loading directory...</p>
      ) : registrations.length === 0 ? (
        <p className="staff-directory-empty">No records found.</p>
      ) : (
        <div className="staff-directory-groups">
          {Object.entries(grouped).map(([branch, roles]) => (
            <section key={branch} className="staff-directory-branch">
              <h2>{branch}</h2>
              {Object.entries(roles).map(([role, items]) => (
                <div key={role} className="staff-directory-role-group">
                  <h3>{role} <span className="count">({items.length})</span></h3>
                  <div className="staff-cards">
                    {items.map((reg) => (
                      <div key={reg.id} className={`staff-card staff-card--${reg.staffStatus.toLowerCase()}`}>
                        {editingId === reg.id ? (
                          <div className="staff-card-edit">
                            <label>
                              Confirmed role
                              <input value={editForm.confirmedRole} onChange={(e) => setEditForm((p) => ({ ...p, confirmedRole: e.target.value }))} />
                            </label>
                            <label>
                              Confirmed department
                              <select value={editForm.confirmedDepartment} onChange={(e) => setEditForm((p) => ({ ...p, confirmedDepartment: e.target.value }))}>
                                <option value="">Select...</option>
                                {DEPARTMENTS.map((d) => (
                                  <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Full name
                              <input value={editForm.fullName} onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))} />
                            </label>
                            <label>
                              Phone
                              <input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} />
                            </label>
                            <label>
                              WhatsApp consent
                              <input type="checkbox" checked={editForm.whatsappConsent} onChange={(e) => setEditForm((p) => ({ ...p, whatsappConsent: e.target.checked }))} />
                            </label>
                            <div className="staff-card-actions">
                              <button className="button button-gold" onClick={saveEdit} disabled={actionLoading === 'edit-' + reg.id}>Save</button>
                              <button className="button button-outline" onClick={() => setEditingId(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="staff-card-header">
                              <strong>{reg.fullName}</strong>
                              <span className={`badge badge--${reg.staffStatus.toLowerCase()}`}>{reg.staffStatus}</span>
                            </div>
                            <p className="staff-card-meta">Original: {reg.originalRole}</p>
                            {reg.confirmedRole && <p className="staff-card-meta">Confirmed: {reg.confirmedRole}</p>}
                            <p className="staff-card-meta">Department: {formatDepartment(reg.department)}</p>
                            {reg.phone && <p className="staff-card-meta">Phone: {reg.phone}</p>}
                            {reg.email && <p className="staff-card-meta">Email: {reg.email}</p>}
                            {reg.duplicatePhoneFlag && <p className="staff-card-warning">Duplicate phone flag</p>}
                            <p className="staff-card-meta">WhatsApp: {reg.whatsappConsent ? 'Consented' : 'Not consented'}</p>
                            {reg.whatsappInvitationStatus !== 'PENDING' && (
                              <p className="staff-card-meta">Invitation: {reg.whatsappInvitationStatus}{reg.invitedAt ? ` on ${new Date(reg.invitedAt).toLocaleDateString()}` : ''}</p>
                            )}
                            <div className="staff-card-actions">
                              <button className="button button-outline" onClick={() => startEdit(reg)}>Edit</button>
                              {reg.staffStatus === 'PENDING' && (
                                <button className="button button-gold" onClick={() => handleAction(reg.id, 'approve')} disabled={actionLoading === reg.id + 'approve'}>Approve</button>
                              )}
                              {reg.staffStatus === 'ACTIVE' && (
                                <>
                                  <button className="button button-outline" onClick={() => handleAction(reg.id, 'suspend')} disabled={actionLoading === reg.id + 'suspend'}>Suspend</button>
                                  {reg.whatsappConsent && reg.phone && (
                                    <button className="button button-outline" onClick={() => handleAction(reg.id, 'whatsapp')} disabled={actionLoading === reg.id + 'whatsapp'}>WhatsApp invite</button>
                                  )}
                                </>
                              )}
                              {(reg.staffStatus === 'ACTIVE' || reg.staffStatus === 'SUSPENDED') && (
                                <button className="button button-outline" onClick={() => handleAction(reg.id, 'deactivate')} disabled={actionLoading === reg.id + 'deactivate'}>Deactivate</button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
