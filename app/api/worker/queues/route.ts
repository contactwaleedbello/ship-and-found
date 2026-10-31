import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { getWorkerQueues } from '@/lib/services/worker-service';

/**
 * GET /api/worker/queues
 * Returns aggregated operational queues for the store worker dashboard (FR-05, FR-07, FR-13).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    const data = getWorkerQueues();
    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'GET /api/worker/queues');
  }
}
