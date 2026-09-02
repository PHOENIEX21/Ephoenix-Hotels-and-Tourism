import { NextRequest, NextResponse } from 'next/server';
import {
  getStaffDirectory,
  approveStaffRegistration,
  approveAllPendingStaffRegistrations,
  suspendStaffRegistration,
  deactivateStaffRegistration,
  updateStaffRegistration,
  sendWhatsAppInvitation,
  sendWhatsAppGroupLink,
  exportStaffCsv,
} from '../../../../lib/directory';
import { Department } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const branch = url.searchParams.get('branch') || undefined;
    const department = url.searchParams.get('department') || undefined;
    const confirmedRole = url.searchParams.get('confirmedRole') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const exportCsv = url.searchParams.get('export') === 'true';

    if (exportCsv) {
      const response = await exportStaffCsv(branch);
      return response;
    }

    const result = await getStaffDirectory({ branch, department, confirmedRole, status, search });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Directory fetch failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load directory.' }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Registration id is required.' }, { status: 400 });

    const body = await request.json();
    const data: { confirmedRole?: string; confirmedDepartment?: Department; fullName?: string; phone?: string; email?: string; originalRole?: string; department?: Department; whatsappConsent?: boolean } = {};

    if (body.confirmedRole !== undefined) data.confirmedRole = String(body.confirmedRole).trim();
    if (body.confirmedDepartment !== undefined) data.confirmedDepartment = body.confirmedDepartment as Department;
    if (body.fullName !== undefined) data.fullName = String(body.fullName).trim();
    if (body.phone !== undefined) data.phone = String(body.phone).trim() || undefined;
    if (body.email !== undefined) data.email = String(body.email).trim() || undefined;
    if (body.originalRole !== undefined) data.originalRole = String(body.originalRole).trim();
    if (body.department !== undefined) data.department = body.department as Department;
    if (body.whatsappConsent !== undefined) data.whatsappConsent = Boolean(body.whatsappConsent);

    const updated = await updateStaffRegistration(id, data);
    return NextResponse.json({ ok: true, registration: updated });
  } catch (error) {
    console.error('Directory update failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update registration.' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const id = url.searchParams.get('id');

    let result;
    if (action === 'approve') {
      if (!id) return NextResponse.json({ error: 'Registration id is required.' }, { status: 400 });
      result = await approveStaffRegistration(id);
    } else if (action === 'approve-all') {
      result = await approveAllPendingStaffRegistrations();
    } else if (action === 'group-link') {
      const body = await request.json().catch(() => ({}));
      const groupLink = typeof body?.groupLink === 'string' ? body.groupLink.trim() : '';
      if (!groupLink) {
        return NextResponse.json({ error: 'Group link is required.' }, { status: 400 });
      }
      result = await sendWhatsAppGroupLink(groupLink);
    } else if (action === 'suspend') {
      if (!id) return NextResponse.json({ error: 'Registration id is required.' }, { status: 400 });
      result = await suspendStaffRegistration(id);
    } else if (action === 'deactivate') {
      if (!id) return NextResponse.json({ error: 'Registration id is required.' }, { status: 400 });
      result = await deactivateStaffRegistration(id);
    } else if (action === 'whatsapp') {
      if (!id) return NextResponse.json({ error: 'Registration id is required.' }, { status: 400 });
      result = await sendWhatsAppInvitation(id);
    } else {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, registration: result });
  } catch (error) {
    console.error('Directory action failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Action failed.' }, { status: 400 });
  }
}
