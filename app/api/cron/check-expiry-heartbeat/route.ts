import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { checkExpiryHeartbeat } from '@/lib/services/cron-service';

/**
 * GET /api/cron/check-expiry-heartbeat
 * Source: `.agents/rules/api-contracts.md` (#12.3) & `.agents/rules/cron.md`.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    const result = await checkExpiryHeartbeat(requestId);

    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'GET /api/cron/check-expiry-heartbeat');
  }
}

