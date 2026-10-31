import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { expireOverdueApplications } from '@/lib/services/cron-service';

/**
 * GET /api/cron/expire-applications
 * Source: `.agents/rules/api-contracts.md` (#12.1) & `.agents/rules/cron.md`.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    const result = await expireOverdueApplications(requestId);

    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'GET /api/cron/expire-applications');
  }
}

