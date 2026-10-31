import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { recordSettlementPayment } from '@/lib/services/worker-service';

/**
 * POST /api/worker/record-settlement
 * Records settlement payment on a defaulted flexi-pay contract (FR-08).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '197.210.64.1';
  const workerUserId = 'user-worker-chinedu';

  try {
    const body: unknown = await request.json();
    const result = await recordSettlementPayment(body, workerUserId, clientIp);

    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/worker/record-settlement');
  }
}
