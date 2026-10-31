import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { acceptAgreementWithOtp } from '@/lib/services/application-service';

/**
 * POST /api/applications/:id/accept-agreement
 * Source: `.agents/rules/api-contracts.md` (#3.4) & `.agents/rules/functional-requirements.md` (FR-06).
 */
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;
  const customerId = 'user-customer-ahmed';

  try {
    const body: unknown = await request.json();
    const payload = typeof body === 'object' && body !== null ? body : {};
    const result = await acceptAgreementWithOtp(
      { ...payload, applicationId: context.params.id },
      customerId,
      requestId
    );

    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/applications/[id]/accept-agreement');
  }
}
