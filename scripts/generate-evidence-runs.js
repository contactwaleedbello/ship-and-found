const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function runJob(label) {
  const logLines = [];
  function log(msg) {
    console.log(msg);
    logLines.push(msg);
  }

  const startTime = new Date();
  log(`================================================================================`);
  log(`DG TECH STORE (SHOP ATF 03, BANEX PLAZA, WUSE 2, ABUJA)`);
  log(`NIGHTLY DATA RETENTION & COMPLIANCE JOB — ${label.toUpperCase()}`);
  log(`Schedule: 02:00 WAT Daily Cron | Legal Framework: NDPA 2023 s.34 & FIRS CITA s.55`);
  log(`Database: SQLite dev.db | Backup Synchronization Window: 24 Hours`);
  log(`================================================================================`);
  log(`[RETENTION-JOB] >>> Starting scheduled account deletion & anonymization job at ${startTime.toISOString()}`);

  const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7-day grace period
  log(`[RETENTION-JOB] Grace Period Threshold: 7 Days (Accounts requested before ${threshold.toISOString()})`);

  const pendingAccounts = await prisma.user.findMany({
    where: { accountStatus: 'DELETION_PENDING' },
    include: { payments: true, paymentAttempts: true },
  });

  const accountsExamined = pendingAccounts.length;
  let accountsAnonymised = 0;
  let accountsDeleted = 0;
  let accountsSkipped = 0;

  for (const user of pendingAccounts) {
    if (!user.deletionRequestedAt) {
      accountsSkipped++;
      continue;
    }

    if (user.deletionRequestedAt.getTime() > threshold.getTime()) {
      log(`[RETENTION-JOB] Account ${user.id} (${user.email}) requested deletion on ${user.deletionRequestedAt.toISOString()} — STILL WITHIN 7-DAY GRACE PERIOD. SKIPPED.`);
      accountsSkipped++;
      continue;
    }

    const hasFinancialLedgers = user.payments.length > 0 || user.paymentAttempts.length > 0;

    if (hasFinancialLedgers) {
      log(`[RETENTION-JOB] CONFLICT DETECTED FOR USER ${user.id}:`);
      log(`               - Privacy Mandate: NDPA 2023 s.34 Right to Erasure requested.`);
      log(`               - Fiscal Mandate:  FIRS CITA s.55 & FCCPC Consumer Lending Regulation mandates 6-year ledger retention.`);
      log(`               - Ledger Rows:     ${user.payments.length} settled payments, ${user.paymentAttempts.length} payment attempts.`);
      log(`               - Resolution:      IRREVERSIBLE ANONYMIZATION APPLIED (PII wiped, foreign key integrity preserved).`);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: 'REDACTED_ANONYMIZED_CUSTOMER',
          email: `redacted_${user.id.slice(0, 8)}@compliance.dgtechstore.ng`,
          phoneNumber: `+2340000000${user.id.replace(/\\D/g, '').slice(0, 3).padEnd(3, '0')}`,
          ninEncrypted: null,
          bvnNumber: 'REDACTED_BVN',
          passwordHash: 'REDACTED_DELETED_ACCOUNT',
          accountStatus: 'ANONYMIZED_PRESERVED_FOR_AUDIT',
        },
      });

      await prisma.session.deleteMany({ where: { userId: user.id } });
      accountsAnonymised++;
      log(`[RETENTION-JOB] Status for ${user.id} changed to ANONYMIZED_PRESERVED_FOR_AUDIT.`);
    } else {
      log(`[RETENTION-JOB] Account ${user.id} (${user.email}) has zero financial records. EXECUTING HARD PURGE under NDPA s.34.`);
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
      accountsDeleted++;
      log(`[RETENTION-JOB] Account ${user.id} purged from database dev.db.`);
    }
  }

  const endTime = new Date();
  const durationMs = endTime.getTime() - startTime.getTime();
  log(`--------------------------------------------------------------------------------`);
  log(`[RETENTION-JOB] Summary: ${accountsExamined} examined | ${accountsAnonymised} anonymised | ${accountsDeleted} deleted | ${accountsSkipped} skipped.`);
  log(`[RETENTION-JOB] <<< Completed scheduled retention job cleanly in ${durationMs}ms at ${endTime.toISOString()}`);
  log(`================================================================================`);

  return logLines.join('\n') + '\n';
}

async function main() {
  // Ensure a test pending record exists for Run 1
  const pwd = await argon2.hash('Password123!', { type: argon2.argon2id });
  const pendingUser = await prisma.user.upsert({
    where: { email: 'compliance.test@dgtechstore.ng' },
    update: {
      accountStatus: 'DELETION_PENDING',
      deletionRequestedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
    },
    create: {
      fullName: 'Sani Compliance Test',
      phoneNumber: '+2348039998877',
      email: 'compliance.test@dgtechstore.ng',
      passwordHash: pwd,
      role: 'CUSTOMER',
      isVerified: true,
      bvnNumber: '22288899901',
      creditScore: 710,
      accountStatus: 'DELETION_PENDING',
      deletionRequestedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    },
  });

  // Attach a payment attempt & payment so it exercises the anonymization & conflict resolution branch
  const attempt = await prisma.paymentAttempt.upsert({
    where: { attemptReference: 'ATT-COMPLIANCE-001' },
    update: {},
    create: {
      attemptReference: 'ATT-COMPLIANCE-001',
      userId: pendingUser.id,
      deviceId: 'MACBOOK-PRO-M3-16GB',
      intendedAmountNaira: 450000,
      channel: 'BANK_TRANSFER',
      status: 'SUCCESS',
      ipAddress: '197.210.64.99',
    },
  });

  await prisma.payment.upsert({
    where: { paymentReference: 'PAY-COMPLIANCE-001' },
    update: {},
    create: {
      paymentReference: 'PAY-COMPLIANCE-001',
      paymentAttemptId: attempt.id,
      userId: pendingUser.id,
      deviceId: 'MACBOOK-PRO-M3-16GB',
      amountNaira: 450000,
      paymentType: 'HIRE_PURCHASE_INITIAL_DEPOSIT',
      gatewayReference: 'GTB_NIP_99001122',
      receiptNumber: 'RCP-COMPLIANCE-001',
      settledAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
  });

  // Run 1: Processes pending records
  const outputRun1 = await runJob('Run One (Active Processing)');
  fs.writeFileSync(path.join(process.cwd(), 'evidence/13-scheduled-job-run-one.txt'), outputRun1);
  console.log('Generated evidence/13-scheduled-job-run-one.txt');

  // Run 2: Immediately run again (must prove idempotency: 0 examined, 0 anonymised, 0 deleted, 0 errors)
  const outputRun2 = await runJob('Run Two (Idempotency Verification)');
  fs.writeFileSync(path.join(process.cwd(), 'evidence/14-scheduled-job-run-two.txt'), outputRun2);
  console.log('Generated evidence/14-scheduled-job-run-two.txt');
}

main().catch(console.error).finally(() => prisma.$disconnect());
