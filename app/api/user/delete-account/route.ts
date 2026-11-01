import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';
import {
  validateSession,
  destroyAllUserSessions,
  buildClearedSessionCookie,
  SESSION_CONFIG,
} from '@/lib/security/session-service';

/**
 * POST /api/user/delete-account
 * Task 5 Step 5: Compliant Account Deletion Request (NDPA 2023 s.34 & GDPR Art. 17).
 * Sets accountStatus to DELETION_PENDING, revokes all sessions, and clears cookie.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    const rawToken = request.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value;

    if (!rawToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required to initiate account deletion.' },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }

    const session = await validateSession(rawToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Session is invalid or expired.' },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }

    const userId = session.userId;

    // 1. Mark account status as DELETION_PENDING with timestamp
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: 'DELETION_PENDING',
        deletionRequestedAt: new Date(),
      },
    });

    // 2. Immediately revoke all active sessions across all devices
    const revokedSessions = await destroyAllUserSessions(userId);

    logger.warn('ACCOUNT_DELETION_INITIATED', {
      requestId,
      actorId: userId,
      metadata: {
        email: updatedUser.email,
        accountStatus: updatedUser.accountStatus,
        revokedSessions,
      },
    });

    const response = NextResponse.json(
      {
        data: {
          accountStatus: 'DELETION_PENDING',
          deletionRequestedAt: updatedUser.deletionRequestedAt?.toISOString(),
          gracePeriodDays: 7,
          message:
            'Your account has been scheduled for deletion. All active sessions have been terminated. You have a 7-day grace period to contact support if you wish to cancel this request.',
        },
      },
      {
        status: 200,
        headers: {
          'x-request-id': requestId,
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      }
    );

    // 3. Clear session cookie
    response.headers.set('Set-Cookie', buildClearedSessionCookie());
    return response;
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/user/delete-account');
  }
}
