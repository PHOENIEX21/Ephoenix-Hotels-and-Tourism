'use client';

import { useEffect, useRef, useState } from 'react';

const DEPARTMENTS: Record<string, string> = {
  FRONT_OFFICE: 'Front Office/Reception',
  HOUSEKEEPING: 'Housekeeping',
  RESTAURANT: 'Restaurant',
  KITCHEN: 'Kitchen',
  POOL_BAR: 'Pool Bar',
  ACCOUNTS: 'Accounts/Finance',
  SECURITY: 'Security',
  MAINTENANCE: 'Maintenance',
  MANAGEMENT: 'Management',
  OTHER: 'Other',
};

type Registration = {
  id: string;
  fullName: string;
  originalRole: string;
  confirmedRole: string | null;
  department: string;
  phone: string | null;
  email: string | null;
  staffStatus: string;
  whatsappConsent: boolean;
  submittedAt: string;
  hotel: { name: string } | null;
};

export default function StaffDirectoryPrintPage() {
  const [data, setData] = useState<{ registrations: Registration[] } | null>(null);
  const [error, setError] = useState('');
  const printedRef = useRef(false);

  useEffect(() => {
    async function load() {
      try {
      const url = new URL('/api/staff/directory', window.location.origin);
      url.searchParams.set('branch', 'all');
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
        setData(json);
      } catch {
        setError('Unable to load staff directory.');
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (data && !printedRef.current) {
      printedRef.current = true;
      setTimeout(() => window.print(), 500);
    }
  }, [data]);

  if (error) {
    return <p className="staff-directory-print-error">{error}</p>;
  }

  if (!data) {
    return <p className="staff-directory-loading">Loading...</p>;
  }

  const grouped: Record<string, Record<string, Registration[]>> = {};
  for (const reg of data.registrations) {
    const branch = reg.hotel?.name || 'Unknown';
    const role = reg.confirmedRole || 'Uncategorised';
    if (!grouped[branch]) grouped[branch] = {};
    if (!grouped[branch][role]) grouped[branch][role] = [];
    grouped[branch][role].push(reg);
  }

  return (
    <main className="staff-directory-print">
      <h1>EPhoenix Staff Directory</h1>
      <div className="staff-directory-print-meta">
        <p>Generated: {new Date().toLocaleString()}</p>
        <p>Branch: All branches</p>
      </div>
      {Object.entries(grouped).map(([branch, roles]) => (
        <section key={branch} className="staff-directory-print-branch">
          <h2>{branch}</h2>
          {Object.entries(roles).map(([role, items]) => (
            <div key={role} className="staff-directory-print-role">
              <h3>{role} ({items.length})</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Original Role</th>
                    <th>Confirmed Role</th>
                    <th>Department</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>WhatsApp</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id}>
                      <td>{r.fullName}</td>
                      <td>{r.originalRole}</td>
                      <td>{r.confirmedRole || ''}</td>
                      <td>{DEPARTMENTS[r.department] || r.department}</td>
                      <td>{r.phone || ''}</td>
                      <td>{r.email || ''}</td>
                      <td>{r.staffStatus}</td>
                      <td>{r.whatsappConsent ? 'Yes' : 'No'}</td>
                      <td>{new Date(r.submittedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      ))}
      <div className="staff-directory-print-footer">Total records: {data.registrations.length}</div>
    </main>
  );
}
