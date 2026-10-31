import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { requestPasswordResetOtp } from '@/lib/services/auth-service';

/**
 * POST /api/auth/forgot-password
 * Source: `.agents/rules/api-contracts.md` (#1.5) & `.agents/rules/security-baseline.md`.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    const body: unknown = await request.json();
    const result = await requestPasswordResetOtp(body, requestId);

    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/auth/forgot-password');
  }
}
