import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { rateLimit } from '../../../../lib/security';
import { normalisePhone, buildDuplicatePhoneWhere } from '../../../../lib/directory';
import { resolveBranchId } from '../../../../lib/branches';
import { Department } from '@prisma/client';

function normaliseRoleText(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes('porter')) return 'FRONT_OFFICE';
  if (lower.includes('gatekeeper')) return 'SECURITY';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`staff-register:${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}`, 5, 15 * 60_000);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 });

    const body = await request.json();
    const fullName = String(body?.fullName ?? '').trim();
    const phone = String(body?.phone ?? '').trim();
    const email = String(body?.email ?? '').trim() || null;
    const branch = String(body?.branch ?? '').trim();
    const department = String(body?.department ?? '').trim().toUpperCase();
    const originalRole = String(body?.originalRole ?? '').trim();
    const profilePhotoUrl = String(body?.profilePhotoUrl ?? '').trim() || null;
    const whatsappConsent = Boolean(body?.whatsappConsent);
    const honeypot = String(body?.website ?? '').trim();
    const formTimestamp = Number(body?.formTimestamp || 0);

    if (!fullName || fullName.length < 2 || fullName.length > 100) {
      return NextResponse.json({ error: 'Full name must be 2-100 characters.' }, { status: 400 });
    }

    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: 'A valid phone number is required.' }, { status: 400 });
    }

    if (honeypot) {
      return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 });
    }

    if (!formTimestamp || Date.now() - formTimestamp < 3000) {
      return NextResponse.json({ error: 'Form submitted too quickly. Please try again.' }, { status: 400 });
    }

    const validBranches = ['Main Branch', 'Annex 1', 'Annex 2'];
    if (!validBranches.includes(branch)) {
      return NextResponse.json({ error: 'Invalid branch selected.' }, { status: 400 });
    }

    const hotelId = await resolveBranchId(branch);

    if (!Object.values(Department).includes(department as Department)) {
      return NextResponse.json({ error: 'Invalid department.' }, { status: 400 });
    }

    const autoDepartment = normaliseRoleText(originalRole);
    const finalDepartment = autoDepartment || department;

    if (!originalRole || originalRole.length < 2) {
      return NextResponse.json({ error: 'Please enter your role or job title.' }, { status: 400 });
    }

    const normalisedPhone = normalisePhone(phone);
    const duplicateCheck = await prisma.staffRegistration.findFirst({
      where: buildDuplicatePhoneWhere(normalisedPhone),
    });

    const registration = await prisma.staffRegistration.create({
      data: {
        hotelId,
        fullName,
        phone: normalisedPhone,
        email,
        profilePhotoUrl,
        originalRole,
        department: finalDepartment as Department,
        whatsappConsent,
        duplicatePhoneFlag: !!duplicateCheck,
      },
      include: {
        hotel: { select: { id: true, name: true, slug: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: null,
        action: 'STAFF_REGISTRATION_CREATED',
        entity: 'StaffRegistration',
        entityId: registration.id,
        details: JSON.stringify({ fullName, hotelId, duplicatePhoneFlag: !!duplicateCheck }),
      },
    });

    return NextResponse.json({ ok: true, registration }, { status: 201 });
  } catch (error) {
    console.error('Staff registration failed', error);
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });
  }
}
