import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { submitInventoryUpdate } from '@/lib/services/worker-service';

/**
 * POST /api/worker/inventory-update
 * Submits store worker stock update proposal for Owner approval (FR-13).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '197.210.64.1';
  const workerUserId = 'user-worker-chinedu';

  try {
    const body: unknown = await request.json();
    const result = await submitInventoryUpdate(body, workerUserId, clientIp);

    return NextResponse.json(
      { data: result },
      {
        status: 201,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/worker/inventory-update');
  }
}
