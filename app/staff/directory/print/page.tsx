import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../../lib/auth';

export default async function StaffDirectoryPrintPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== 'ADMIN') redirect('/staff/login');

  const branchParam = 'all';
  const url = new URL('http://localhost');
  url.pathname = '/api/staff/directory';
  url.searchParams.set('branch', branchParam);
  url.searchParams.set('export', 'true');

  return (
    <html lang="en">
      <head>
        <title>Staff Directory - Print</title>
        <style dangerouslySetInnerHTML={{ __html: `
          @page { size: A4; margin: 18mm; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #222; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 16px; margin-top: 22px; border-bottom: 2px solid #111; padding-bottom: 4px; }
          h3 { font-size: 14px; margin-top: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #aaa; padding: 6px 8px; text-align: left; vertical-align: top; }
          th { background: #f3f3f3; font-size: 11px; text-transform: uppercase; }
          .meta { color: #555; margin-bottom: 18px; }
          .footer { margin-top: 30px; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 8px; }
        ` }} />
      </head>
      <body>
        <h1>EPhoenix Staff Directory</h1>
        <div className="meta">
          <p>Generated: {new Date().toLocaleString()}</p>
          <p>Branch: All branches</p>
        </div>
        <div id="content">Loading...</div>
        <script dangerouslySetInnerHTML={{ __html: `
          async function load() {
            const url = new URL('/api/staff/directory', window.location.origin);
            url.searchParams.set('branch', 'all');
            const res = await fetch(url.toString());
            const data = await res.json();
            const container = document.getElementById('content');
            const grouped = {};
            for (const reg of data.registrations) {
              const branch = reg.hotel?.name || 'Unknown';
              const role = reg.confirmedRole || 'Uncategorised';
              if (!grouped[branch]) grouped[branch] = {};
              if (!grouped[branch][role]) grouped[branch][role] = [];
              grouped[branch][role].push(reg);
            }
            let html = '';
            for (const [branch, roles] of Object.entries(grouped)) {
              html += '<h2>' + branch + '</h2>';
              for (const [role, items] of Object.entries(roles)) {
                html += '<h3>' + role + ' (' + items.length + ')</h3>';
                html += '<table><thead><tr><th>Name</th><th>Original Role</th><th>Confirmed Role</th><th>Department</th><th>Phone</th><th>Email</th><th>Status</th><th>WhatsApp</th><th>Submitted</th></tr></thead><tbody>';
                for (const r of items) {
                  html += '<tr>' +
                    '<td>' + r.fullName + '</td>' +
                    '<td>' + r.originalRole + '</td>' +
                    '<td>' + (r.confirmedRole || '') + '</td>' +
                    '<td>' + r.department + '</td>' +
                    '<td>' + (r.phone || '') + '</td>' +
                    '<td>' + (r.email || '') + '</td>' +
                    '<td>' + r.staffStatus + '</td>' +
                    '<td>' + (r.whatsappConsent ? 'Yes' : 'No') + '</td>' +
                    '<td>' + new Date(r.submittedAt).toLocaleDateString() + '</td>' +
                  '</tr>';
                }
                html += '</tbody></table>';
              }
            }
            html += '<div class=\"footer\">Total records: ' + data.registrations.length + '</div>';
            container.innerHTML = html;
            setTimeout(() => window.print(), 500);
          }
          load();
        ` }} />
      </body>
    </html>
  );
}
