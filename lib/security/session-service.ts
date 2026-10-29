import crypto from 'node:crypto';
import { prisma } from '@/lib/db';

/**
 * Hardened Session Management Service
 * Source: docs/sessions.md & Task 5 Step 1
 * 
 * Invariants:
 * 1. Cryptographically random 256-bit token generated via crypto.randomBytes(32).
 * 2. Raw token sent to client cookie; SHA-256 hash stored in database.
 * 3. Fresh token issued on every single login (no session reuse).
 * 4. Cookie flags: HttpOnly, Secure, SameSite=Lax, Path=/, Max-Age=7d.
 */

export const SESSION_CONFIG = {
  COOKIE_NAME: 'dg_session',
  LIFETIME_SECONDS: 7 * 24 * 60 * 60, // 7 days rolling
  TOKEN_BYTES: 32, // 256 bits
};

export interface SessionData {
  sessionId: string;
  userId: string;
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
  cookieHeader: string;
}

export function hashSessionToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function generateSessionToken(): string {
  // Platform cryptographic PRNG
  return crypto.randomBytes(SESSION_CONFIG.TOKEN_BYTES).toString('hex');
}

export function buildSessionCookie(rawToken: string): string {
  // All three flags explicitly enforced: HttpOnly, Secure, SameSite=Lax
  return `${SESSION_CONFIG.COOKIE_NAME}=${rawToken}; Path=/; Max-Age=${SESSION_CONFIG.LIFETIME_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

export function buildClearedSessionCookie(): string {
  return `${SESSION_CONFIG.COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export async function createSession(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<SessionData> {
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_CONFIG.LIFETIME_SECONDS * 1000);

  // Store hashed session token in database
  const sessionRecord = await prisma.session.create({
    data: {
      sessionToken: tokenHash,
      userId,
      ipAddress,
      userAgent: userAgent || 'Unknown Browser',
      expiresAt,
    },
  });

  const cookieHeader = buildSessionCookie(rawToken);

  return {
    sessionId: sessionRecord.id,
    userId,
    rawToken,
    tokenHash,
    expiresAt,
    cookieHeader,
  };
}

export async function validateSession(rawToken: string) {
  if (!rawToken || rawToken.length < 32) return null;

  const tokenHash = hashSessionToken(rawToken);

  const session = await prisma.session.findUnique({
    where: { sessionToken: tokenHash },
    include: { user: true },
  });

  if (!session) return null;

  // Check manual revocation or expiry
  if (session.revokedAt !== null || session.expiresAt.getTime() < Date.now()) {
    return null;
  }

  // Check if account is locked or pending deletion
  if (session.user.accountStatus !== 'ACTIVE') {
    return null;
  }

  return session;
}

export async function destroySession(rawToken: string): Promise<boolean> {
  if (!rawToken) return false;
  const tokenHash = hashSessionToken(rawToken);

  try {
    await prisma.session.delete({
      where: { sessionToken: tokenHash },
    });
    return true;
  } catch {
    return false;
  }
}

export async function destroyAllUserSessions(userId: string): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { userId },
  });
  return result.count;
}
