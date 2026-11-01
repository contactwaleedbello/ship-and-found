import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { validateSession, SESSION_CONFIG } from '@/lib/security/session-service';

/**
 * GET /api/auth/session
 * Returns authenticated session identity or 401 Unauthorized.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;
  const rawToken = request.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value;

  if (!rawToken) {
    return NextResponse.json(
      { authenticated: false, error: 'Unauthorized', message: 'No session token provided.' },
      {
        status: 401,
        headers: {
          'x-request-id': requestId,
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      }
    );
  }

  const session = await validateSession(rawToken);

  if (!session) {
    return NextResponse.json(
      { authenticated: false, error: 'Unauthorized', message: 'Session is invalid, expired, or revoked.' },
      {
        status: 401,
        headers: {
          'x-request-id': requestId,
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      sessionId: session.id,
      user: {
        id: session.user.id,
        fullName: session.user.fullName,
        email: session.user.email,
        phoneNumber: session.user.phoneNumber,
        role: session.user.role,
        creditScore: session.user.creditScore,
        accountStatus: session.user.accountStatus,
        bvnMasked: session.user.bvnNumber
          ? `${session.user.bvnNumber.slice(0, 3)}*****${session.user.bvnNumber.slice(-3)}`
          : null,
      },
      expiresAt: session.expiresAt.toISOString(),
    },
    {
      status: 200,
      headers: {
        'x-request-id': requestId,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      },
    }
  );
}
