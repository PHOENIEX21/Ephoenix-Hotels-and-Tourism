import { prisma } from '../lib/prisma';
import { Department } from '@prisma/client';

async function backfill() {
  console.log('Starting staff registration backfill...');

  const existingStaff = await prisma.user.findMany({
    where: {
      role: { in: ['STAFF', 'ADMIN'] },
      hotelId: { not: null },
    },
    select: { id: true, name: true, email: true, hotelId: true, role: true },
  });

  console.log(`Found ${existingStaff.length} existing staff/admin users with valid hotelId`);

  let backfilled = 0;
  let skipped = 0;

  for (const staff of existingStaff) {
    const existing = await prisma.staffRegistration.findFirst({
      where: { userId: staff.id },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.staffRegistration.create({
      data: {
        hotelId: staff.hotelId!,
        fullName: staff.name,
        email: staff.email,
        originalRole: 'Existing staff',
        department: Department.OTHER,
        confirmedRole: 'Staff',
        staffStatus: 'ACTIVE',
        whatsappConsent: false,
        whatsappInvitationStatus: 'PENDING',
        userId: staff.id,
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    backfilled++;
  }

  console.log(`Backfill complete. Created: ${backfilled}, Skipped: ${skipped}, Total processed: ${existingStaff.length}`);
}

backfill()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
