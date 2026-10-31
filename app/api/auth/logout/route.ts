import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * POST /api/auth/logout
 * Source: `.agents/rules/api-contracts.md` (#1.4) & `.agents/rules/security-baseline.md`.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    logger.info('USER_LOGOUT', {
      requestId,
      route: 'POST /api/auth/logout',
    });

    const response = NextResponse.json(
      { data: { loggedOut: true } },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );

    response.cookies.delete('dg_session');
    response.cookies.delete('dg_csrf');

    return response;
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/auth/logout');
  }
}
