import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { deviceFilterSchema, listDevices } from '@/lib/services/catalog-service';

/**
 * GET /api/devices
 * Source: `.agents/rules/api-contracts.md` (#2.1) & `.agents/rules/functional-requirements.md` (FR-01).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = deviceFilterSchema.parse({
      brand: searchParams.get('brand') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      performance_tier: searchParams.get('performance_tier') ?? undefined,
      battery_life: searchParams.get('battery_life') ?? undefined,
    });

    const data = listDevices(filters);

    return NextResponse.json(
      {
        data,
        meta: {
          total: data.length,
          nextCursor: null,
        },
      },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'GET /api/devices');
  }
}
