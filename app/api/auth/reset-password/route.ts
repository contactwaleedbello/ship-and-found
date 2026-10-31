import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { resetUserPassword } from '@/lib/services/auth-service';

/**
 * POST /api/auth/reset-password
 * Source: `.agents/rules/api-contracts.md` (#1.6) & `.agents/rules/security-baseline.md` (24-hour security lock).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    const body: unknown = await request.json();
    const result = await resetUserPassword(body, requestId);

    const response = NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );

    // Invalidate active session cookies upon password reset per PRD 9.3
    response.cookies.delete('dg_session');
    response.cookies.delete('dg_csrf');

    return response;
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/auth/reset-password');
  }
}
