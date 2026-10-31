import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient singleton to prevent exhausting PostgreSQL connections during Next.js hot reloads.
 * Source: `.agents/rules/code-conventions.md` line 47 and `Context files/architecture.md` line 24.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}
