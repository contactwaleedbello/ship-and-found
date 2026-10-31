import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * DG Tech Store (Shop ATF 03) — Compliant Nightly Retention & Deletion Job
 * Scheduled execution: 02:00 WAT every morning.
 * Compliance: NDPA 2023 s.34 (Erasure) & FIRS CITA s.55 / FCCPC Lending Regulations (6-Year Ledger Preservation).
 */
export async function runScheduledDeletionJob(cutoffDate?: Date) {
  const startTime = new Date();
  console.log(`[RETENTION-JOB] >>> Starting scheduled account deletion & anonymization job at ${startTime.toISOString()}`);

  // Default grace period: 7 days ago
  const threshold = cutoffDate ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let accountsExamined = 0;
  let accountsAnonymised = 0;
  let accountsDeleted = 0;
  let accountsSkipped = 0;

  try {
    // 1. Fetch accounts in DELETION_PENDING or flagged for cleanup
    const pendingAccounts = await prisma.user.findMany({
      where: {
        accountStatus: 'DELETION_PENDING',
      },
      include: {
        payments: true,
        paymentAttempts: true,
      },
    });

    accountsExamined = pendingAccounts.length;

    for (const user of pendingAccounts) {
      if (!user.deletionRequestedAt) {
        accountsSkipped++;
        continue;
      }

      // Check if 7-day grace period has elapsed
      if (user.deletionRequestedAt.getTime() > threshold.getTime()) {
        // Within 7-day grace period, skip for now
        accountsSkipped++;
        continue;
      }

      const hasFinancialLedgers = user.payments.length > 0 || user.paymentAttempts.length > 0;

      if (hasFinancialLedgers) {
        // Legal Conflict Resolution: FIRS / FCCPC requires 6-year retention of ledgers.
        // Hard deletion of foreign key would violate CITA s.55 or fail onDelete: Restrict.
        // We redact all personally identifiable information (PII) under NDPA s.34 while keeping anonymized row.
        await prisma.user.update({
          where: { id: user.id },
          data: {
            fullName: 'REDACTED_ANONYMIZED_CUSTOMER',
            email: `redacted_${user.id.slice(0, 8)}@compliance.dgtechstore.ng`,
            phoneNumber: `+2340000000${user.id.replace(/\D/g, '').slice(0, 3).padEnd(3, '0')}`,
            ninEncrypted: null,
            bvnNumber: 'REDACTED_BVN',
            passwordHash: 'REDACTED_DELETED_ACCOUNT',
            accountStatus: 'ANONYMIZED_PRESERVED_FOR_AUDIT',
          },
        });

        // Also clean up any lingering sessions
        await prisma.session.deleteMany({
          where: { userId: user.id },
        });

        accountsAnonymised++;
      } else {
        // Account has zero financial transactions — safe for complete erasure under NDPA s.34
        await prisma.session.deleteMany({
          where: { userId: user.id },
        });

        await prisma.user.delete({
          where: { id: user.id },
        });

        accountsDeleted++;
      }
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    console.log(
      `[RETENTION-JOB] Summary: ${accountsExamined} examined | ${accountsAnonymised} anonymised | ${accountsDeleted} deleted | ${accountsSkipped} skipped (within grace period).`
    );
    console.log(`[RETENTION-JOB] <<< Completed scheduled retention job cleanly in ${durationMs}ms at ${endTime.toISOString()}`);

    return {
      success: true,
      accountsExamined,
      accountsAnonymised,
      accountsDeleted,
      accountsSkipped,
    };
  } catch (error) {
    console.error(`[RETENTION-JOB] Fatal error during retention job:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Allow direct CLI invocation
if (require.main === module) {
  // If invoked with --force-immediate, process all DELETION_PENDING regardless of 7-day timer
  const forceImmediate = process.argv.includes('--force-immediate');
  const cutoff = forceImmediate ? new Date(Date.now() + 1000 * 60) : undefined;

  runScheduledDeletionJob(cutoff)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
