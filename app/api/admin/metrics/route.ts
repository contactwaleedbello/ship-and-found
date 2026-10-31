import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { getSuccessMetrics } from '@/lib/services/admin-service';

/**
 * GET /api/admin/metrics
 * Returns the 5 core business success metrics (PRD 1.8 & 15.1).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    const data = getSuccessMetrics();

    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'GET /api/admin/metrics');
  }
}
