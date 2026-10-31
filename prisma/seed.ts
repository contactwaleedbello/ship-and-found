import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Task 4 Database (DG Tech Store Shop ATF 03)...');

  const defaultPasswordHash = await argon2.hash('BanexSecure#2026', {
    type: argon2.argon2id,
  });

  // Seed Personas
  const owner = await prisma.user.upsert({
    where: { email: 'owner@dgtechstore.ng' },
    update: {},
    create: {
      fullName: 'Chief Danladi Garba',
      phoneNumber: '+2348039990001',
      email: 'owner@dgtechstore.ng',
      passwordHash: defaultPasswordHash,
      role: 'OWNER',
      isVerified: true,
      bvnNumber: 'BVN-22200001',
    },
  });

  const worker = await prisma.user.upsert({
    where: { email: 'worker@dgtechstore.ng' },
    update: {},
    create: {
      fullName: 'Ibrahim Musa',
      phoneNumber: '+2348039990002',
      email: 'worker@dgtechstore.ng',
      passwordHash: defaultPasswordHash,
      role: 'STORE_WORKER',
      isVerified: true,
      bvnNumber: 'BVN-22200002',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer.ahmed@gmail.com' },
    update: {},
    create: {
      fullName: 'Ahmed Abdullahi',
      phoneNumber: '+2348031234567',
      email: 'customer.ahmed@gmail.com',
      passwordHash: defaultPasswordHash,
      role: 'CUSTOMER',
      isVerified: true,
      bvnNumber: 'BVN-22200003',
    },
  });

  // Seed Knowledge Chunk for RAG Retrieval
  await prisma.knowledgeChunk.create({
    data: {
      documentTitle: 'Banex Plaza Flexi-Pay Hire-Purchase Terms 2026',
      sourceUrl: '/docs/terms-note.md',
      chunkIndex: 0,
      content: 'Under the DG Tech Store Flexi-Pay part-payment agreement, customers make a mandatory minimum 60% down-payment at Shop ATF 03 Banex Plaza, with the balance distributed over a maximum of 90 days. Ownership transfers upon final settlement confirmation.',
      tokenCount: 42,
      embeddingJson: null,
    },
  });

  console.log(`Seeded Users: Owner (${owner.id}), Worker (${worker.id}), Customer (${customer.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
