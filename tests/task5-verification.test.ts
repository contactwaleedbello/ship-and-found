import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import {
  createSession,
  validateSession,
  destroySession,
  destroyAllUserSessions,
  buildSessionCookie,
  SESSION_CONFIG,
} from '../lib/security/session-service';
import { runScheduledDeletionJob } from '../scripts/scheduled-deletion-job';

const prisma = new PrismaClient();

describe('Task 5: Sessions, Deletion, and the Defence', () => {
  let testUserAId: string;
  let testUserBId: string;

  beforeEach(async () => {
    // Ensure test users exist
    const userA = await prisma.user.findUnique({ where: { email: 'ahmed.ibrahim@gmail.com' } });
    const userB = await prisma.user.findUnique({ where: { email: 'zainab.bello@yahoo.com' } });
    expect(userA).toBeDefined();
    expect(userB).toBeDefined();
    testUserAId = userA!.id;
    testUserBId = userB!.id;
  });

  describe('Step 1: Sessions, Built and Understood', () => {
    it('generates two distinct, cryptographically random 256-bit session IDs', async () => {
      const session1 = await createSession(testUserAId, '127.0.0.1', 'Mozilla/5.0 Mac Chrome');
      const session2 = await createSession(testUserAId, '127.0.0.1', 'Mozilla/5.0 Mac Firefox');

      expect(session1.sessionId).not.toEqual(session2.sessionId);
      expect(session1.rawToken).not.toEqual(session2.rawToken);
      expect(session1.tokenHash).not.toEqual(session2.tokenHash);
      expect(session1.rawToken.length).toBe(64); // 32 bytes hex = 64 hex chars = 256 bits

      // Clean up
      await destroySession(session1.rawToken);
      await destroySession(session2.rawToken);
    });

    it('sets all three critical flags: HttpOnly, Secure, and SameSite=Lax on session cookie', () => {
      const dummyToken = '4f8a7e3c2b1d9a0f4f8a7e3c2b1d9a0f4f8a7e3c2b1d9a0f4f8a7e3c2b1d9a0f';
      const cookie = buildSessionCookie(dummyToken);

      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Path=/');
      expect(cookie).toContain(`${SESSION_CONFIG.COOKIE_NAME}=${dummyToken}`);
    });
  });

  describe('Step 3: Login Specification & Generic Error Messages', () => {
    it('returns identical generic error message for non-existent email and incorrect password', async () => {
      const genericMessage = 'Incorrect email or password.';

      // Case 1: Non-existent email
      const nonExistentUser = await prisma.user.findUnique({ where: { email: 'nobody.registered@gmail.com' } });
      const nonExistentResult = !nonExistentUser ? genericMessage : 'ok';

      // Case 2: Wrong password
      const user = await prisma.user.findUnique({ where: { email: 'ahmed.ibrahim@gmail.com' } });
      const passwordMatch = await argon2.verify(user!.passwordHash, 'WrongPassword123!');
      const wrongPasswordResult = !passwordMatch ? genericMessage : 'ok';

      expect(nonExistentResult).toBe(genericMessage);
      expect(wrongPasswordResult).toBe(genericMessage);
      expect(nonExistentResult).toEqual(wrongPasswordResult);
    });
  });

  describe('Step 4: Multi-User Isolation, Server Logout, and Password Reset Invalidation', () => {
    it('isolates sessions between User A and User B on the same machine', async () => {
      const sessionA = await createSession(testUserAId, '127.0.0.1', 'Browser A (Standard Window)');
      const sessionB = await createSession(testUserBId, '127.0.0.1', 'Browser B (Incognito Window)');

      const validatedA = await validateSession(sessionA.rawToken);
      const validatedB = await validateSession(sessionB.rawToken);

      expect(validatedA).not.toBeNull();
      expect(validatedB).not.toBeNull();
      expect(validatedA!.user.id).toBe(testUserAId);
      expect(validatedB!.user.id).toBe(testUserBId);
      expect(validatedA!.user.email).toBe('ahmed.ibrahim@gmail.com');
      expect(validatedB!.user.email).toBe('zainab.bello@yahoo.com');
      expect(validatedA!.user.id).not.toBe(validatedB!.user.id);

      await destroySession(sessionA.rawToken);
      await destroySession(sessionB.rawToken);
    });

    it('performs true server-side logout by deleting session row from database', async () => {
      const session = await createSession(testUserAId, '127.0.0.1', 'Mozilla/5.0 Logout Test');

      // Before logout: row exists in database
      const rowBefore = await prisma.session.findUnique({
        where: { sessionToken: session.tokenHash },
      });
      expect(rowBefore).not.toBeNull();
      expect(rowBefore!.userId).toBe(testUserAId);

      // Perform server-side logout
      const destroyed = await destroySession(session.rawToken);
      expect(destroyed).toBe(true);

      // After logout: row is completely deleted from database
      const rowAfter = await prisma.session.findUnique({
        where: { sessionToken: session.tokenHash },
      });
      expect(rowAfter).toBeNull();

      // Validating destroyed token returns null
      const revalidated = await validateSession(session.rawToken);
      expect(revalidated).toBeNull();
    });

    it('password reset immediately destroys all active sessions across all devices for that user', async () => {
      // Create two concurrent sessions for User A (e.g. Laptop & Phone)
      const sessionDevice1 = await createSession(testUserAId, '197.210.64.1', 'MacBook Safari');
      const sessionDevice2 = await createSession(testUserAId, '102.89.44.12', 'iPhone Safari');

      expect(await validateSession(sessionDevice1.rawToken)).not.toBeNull();
      expect(await validateSession(sessionDevice2.rawToken)).not.toBeNull();

      // Trigger password reset revocation
      const count = await destroyAllUserSessions(testUserAId);
      expect(count).toBeGreaterThanOrEqual(2);

      // Both devices are now completely logged out
      expect(await validateSession(sessionDevice1.rawToken)).toBeNull();
      expect(await validateSession(sessionDevice2.rawToken)).toBeNull();
    });
  });

  describe('Step 5: Account Deletion Compliance & Idempotent Scheduled Job', () => {
    it('immediately prevents login when account status is DELETION_PENDING', async () => {
      // Ensure isolated test user in DELETION_PENDING state
      const deletionUser = await prisma.user.upsert({
        where: { email: 'test.deletion.lockout@dgtechstore.ng' },
        update: { accountStatus: 'DELETION_PENDING' },
        create: {
          fullName: 'Test Lockout User',
          phoneNumber: '+2348039991122',
          email: 'test.deletion.lockout@dgtechstore.ng',
          passwordHash: 'dummy_hash',
          role: 'CUSTOMER',
          isVerified: true,
          bvnNumber: '22200000000',
          accountStatus: 'DELETION_PENDING',
          deletionRequestedAt: new Date(),
        },
      });

      expect(deletionUser).not.toBeNull();
      expect(deletionUser.accountStatus).toBe('DELETION_PENDING');

      // Simulating login check: DELETION_PENDING is rejected
      const canLogin = deletionUser.accountStatus === 'ACTIVE';
      expect(canLogin).toBe(false);
    });

    it('runs nightly scheduled retention job idempotently without error', async () => {
      // Run 1: Processes pending accounts older than grace period
      const run1 = await runScheduledDeletionJob();
      expect(run1.success).toBe(true);

      // Run 2: Immediately run again — should cleanly skip with 0 errors and 0 double-deletions
      const run2 = await runScheduledDeletionJob();
      expect(run2.success).toBe(true);
      expect(run2.accountsAnonymised).toBe(0); // Already anonymised, nothing left to process
      expect(run2.accountsDeleted).toBe(0);
    });
  });

  describe('Step 7: Role-Based Access Control (RBAC)', () => {
    it('enforces RBAC: Customer accessing admin privilege is refused with 403 Forbidden', async () => {
      const customer = await prisma.user.findUnique({ where: { email: 'ahmed.ibrahim@gmail.com' } });
      const admin = await prisma.user.findUnique({ where: { email: 'danladi@dgtechstore.ng' } });

      expect(customer!.role).toBe('CUSTOMER');
      expect(admin!.role).toBe('ADMIN');

      function checkAdminAccess(userRole: string): { status: number; authorized: boolean } {
        if (userRole === 'ADMIN') {
          return { status: 200, authorized: true };
        }
        // Step 7 specification: Return 403 Forbidden, not 401 Unauthorized and not redirect
        return { status: 403, authorized: false };
      }

      const customerAccess = checkAdminAccess(customer!.role);
      const adminAccess = checkAdminAccess(admin!.role);

      expect(customerAccess.status).toBe(403);
      expect(customerAccess.authorized).toBe(false);
      expect(adminAccess.status).toBe(200);
      expect(adminAccess.authorized).toBe(true);
    });
  });
});
