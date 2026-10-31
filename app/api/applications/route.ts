import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { submitApplication } from '@/lib/services/application-service';

/**
 * POST /api/applications
 * Source: `.agents/rules/api-contracts.md` (#3.1) & `.agents/rules/functional-requirements.md` (FR-03).
 */
export async function POST(request: NextRequest): Promise<NextRequest | NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  // Default to customer persona if session token not yet wired
  const customerId = 'user-customer-ahmed';

  try {
    const body: unknown = await request.json();
    const result = await submitApplication(body, customerId, clientIp, requestId);

    return NextResponse.json(
      { data: result },
      {
        status: 201,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/applications');
  }
}
