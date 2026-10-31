import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { authenticateUser } from '@/lib/services/auth-service';

/**
 * POST /api/auth/login
 * Source: `.agents/rules/api-contracts.md` (#1.3) & `.agents/rules/security-baseline.md`.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    const body: unknown = await request.json();
    const result = await authenticateUser(body, requestId);

    const response = NextResponse.json(
      {
        data: {
          userId: result.userId,
          role: result.role,
          lockedUntil: result.lockedUntil,
        },
      },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );

    response.cookies.set('dg_session', result.sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    response.cookies.set('dg_csrf', result.csrfToken, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/auth/login');
  }
}
