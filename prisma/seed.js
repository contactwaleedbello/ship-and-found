const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Task 5 Database (DG Tech Store Shop ATF 03 — Sessions & Compliance)...');

  const defaultPasswordHash = await argon2.hash('Password123!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // 1. Admin Persona: Mallam Danladi Garba
  const admin = await prisma.user.upsert({
    where: { email: 'danladi@dgtechstore.ng' },
    update: {
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      isVerified: true,
      passwordHash: defaultPasswordHash,
    },
    create: {
      fullName: 'Mallam Danladi Garba',
      phoneNumber: '+2348039990001',
      email: 'danladi@dgtechstore.ng',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      isVerified: true,
      emailVerifiedAt: new Date(),
      bvnNumber: '22233344401',
      creditScore: 850,
      accountStatus: 'ACTIVE',
    },
  });

  // 2. Customer Persona 1: Ahmed Ibrahim (User A for multi-user test)
  const customerA = await prisma.user.upsert({
    where: { email: 'ahmed.ibrahim@gmail.com' },
    update: {
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isVerified: true,
      passwordHash: defaultPasswordHash,
    },
    create: {
      fullName: 'Ahmed Ibrahim',
      phoneNumber: '+2348031234567',
      email: 'ahmed.ibrahim@gmail.com',
      passwordHash: defaultPasswordHash,
      role: 'CUSTOMER',
      isVerified: true,
      emailVerifiedAt: new Date(),
      bvnNumber: '22233344402',
      creditScore: 720,
      accountStatus: 'ACTIVE',
    },
  });

  // 3. Customer Persona 2: Zainab Bello (User B for multi-user test)
  const customerB = await prisma.user.upsert({
    where: { email: 'zainab.bello@yahoo.com' },
    update: {
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isVerified: true,
      passwordHash: defaultPasswordHash,
    },
    create: {
      fullName: 'Zainab Bello',
      phoneNumber: '+2348039876543',
      email: 'zainab.bello@yahoo.com',
      passwordHash: defaultPasswordHash,
      role: 'CUSTOMER',
      isVerified: true,
      emailVerifiedAt: new Date(),
      bvnNumber: '22233344403',
      creditScore: 745,
      accountStatus: 'ACTIVE',
    },
  });

  // 4. Unverified Customer Persona: Chidi Okafor (Tests Hard Gating)
  await prisma.user.upsert({
    where: { email: 'chidi.okafor@outlook.com' },
    update: {
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isVerified: false,
      passwordHash: defaultPasswordHash,
    },
    create: {
      fullName: 'Chidi Okafor',
      phoneNumber: '+2348021112233',
      email: 'chidi.okafor@outlook.com',
      passwordHash: defaultPasswordHash,
      role: 'CUSTOMER',
      isVerified: false,
      bvnNumber: '22233344404',
      creditScore: 680,
      accountStatus: 'ACTIVE',
    },
  });

  // 5. Deletion Pending Customer: Fatima Aliyu (Tests NDPA vs FIRS retention)
  const fatima = await prisma.user.upsert({
    where: { email: 'fatima.aliyu@gmail.com' },
    update: {
      role: 'CUSTOMER',
      accountStatus: 'DELETION_PENDING',
      deletionRequestedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago (> 7-day grace period)
      isVerified: true,
      passwordHash: defaultPasswordHash,
    },
    create: {
      fullName: 'Fatima Aliyu',
      phoneNumber: '+2348094445566',
      email: 'fatima.aliyu@gmail.com',
      passwordHash: defaultPasswordHash,
      role: 'CUSTOMER',
      isVerified: true,
      emailVerifiedAt: new Date(),
      bvnNumber: '22233344405',
      creditScore: 710,
      accountStatus: 'DELETION_PENDING',
      deletionRequestedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    },
  });

  // 6. Seed Financial Records for Fatima (proves FIRS 6-year retention conflict)
  const attempt = await prisma.paymentAttempt.upsert({
    where: { attemptReference: 'ATT-2026-FATIMA-001' },
    update: {},
    create: {
      attemptReference: 'ATT-2026-FATIMA-001',
      userId: fatima.id,
      deviceId: 'IPHONE-15-PRO-MAX-512GB',
      intendedAmountNaira: 250000,
      channel: 'PAYSTACK_DIRECT_DEBIT',
      status: 'SUCCESS',
      ipAddress: '197.210.64.12',
    },
  });

  await prisma.payment.upsert({
    where: { paymentReference: 'PAY-2026-FATIMA-001' },
    update: {},
    create: {
      paymentReference: 'PAY-2026-FATIMA-001',
      paymentAttemptId: attempt.id,
      userId: fatima.id,
      deviceId: 'IPHONE-15-PRO-MAX-512GB',
      amountNaira: 250000,
      paymentType: 'HIRE_PURCHASE_DEPOSIT',
      gatewayReference: 'PSTK_REF_99887766',
      receiptNumber: 'RCP-DG-2026-0941',
      settledAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Seeded users successfully:');
  console.log(`- Admin: ${admin.fullName} (${admin.email}) [${admin.role}]`);
  console.log(`- Customer A: ${customerA.fullName} (${customerA.email}) [${customerA.role}]`);
  console.log(`- Customer B: ${customerB.fullName} (${customerB.email}) [${customerB.role}]`);
  console.log(`- Deletion Test: ${fatima.fullName} (${fatima.email}) [${fatima.accountStatus}]`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
