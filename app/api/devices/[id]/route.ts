import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { UX_STRINGS } from '@/lib/constants';
import { AppError, handleApiError } from '@/lib/errors';
import { getDeviceById } from '@/lib/services/catalog-service';

/**
 * GET /api/devices/:id
 * Source: `.agents/rules/api-contracts.md` (#2.2) & `.agents/rules/functional-requirements.md` (FR-01, FR-12).
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    const device = getDeviceById(context.params.id);
    if (!device) {
      throw new AppError('NOT_FOUND', 404, UX_STRINGS.NOT_FOUND);
    }

    return NextResponse.json(
      { data: device },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'GET /api/devices/[id]');
  }
}
