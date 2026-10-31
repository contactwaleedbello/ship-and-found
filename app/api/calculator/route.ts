import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { calculatePartPayment } from '@/lib/services/catalog-service';

/**
 * POST /api/calculator
 * Source: `.agents/rules/api-contracts.md` (#2.3) & `.agents/rules/functional-requirements.md` (FR-02).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    const body: unknown = await request.json();
    const result = calculatePartPayment(body as { deviceId: string; downPaymentPercent: number });

    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/calculator');
  }
}
