import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { updateExchangeRateMultiplier } from '@/lib/services/admin-service';

/**
 * POST /api/admin/exchange-rate
 * Updates global exchange rate multiplier and recalculates dynamic catalog prices (FR-13).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '197.210.64.2';
  const adminUserId = 'user-owner-dg';

  try {
    const body: unknown = await request.json();
    const result = await updateExchangeRateMultiplier(body, adminUserId, clientIp);

    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/admin/exchange-rate');
  }
}
