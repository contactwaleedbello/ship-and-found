import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { sendAgreementAcceptanceOtp } from '@/lib/services/auth-service';

/**
 * POST /api/auth/accept-agreement-otp
 * Source: `.agents/rules/api-contracts.md` (#1.7) & `.agents/rules/functional-requirements.md` (FR-06).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    const body: unknown = await request.json();
    const result = await sendAgreementAcceptanceOtp(body, requestId);

    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/auth/accept-agreement-otp');
  }
}
