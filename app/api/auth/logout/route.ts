import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { destroySession, buildClearedSessionCookie, SESSION_CONFIG } from '@/lib/security/session-service';

/**
 * POST /api/auth/logout
 * Task 5 Step 4: Server-side session deletion and cookie invalidation.
 * Idempotent: If session does not exist or was already deleted, returns success and clears cookie.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    // 1. Extract raw session token from cookie or Authorization header
    const rawToken = request.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value;

    let dbSessionDestroyed = false;
    if (rawToken) {
      dbSessionDestroyed = await destroySession(rawToken);
    }

    logger.info('USER_LOGOUT_PROCESSED', {
      requestId,
      route: 'POST /api/auth/logout',
      metadata: {
        hadCookie: Boolean(rawToken),
        dbSessionDestroyed,
      },
    });

    const response = NextResponse.json(
      {
        data: {
          loggedOut: true,
          dbSessionDestroyed,
          message: 'Session terminated on server and client.',
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

    // 2. Clear cookie with hardened flags
    response.headers.set('Set-Cookie', buildClearedSessionCookie());

    return response;
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/auth/logout');
  }
}
