import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { getApplicationById } from '@/lib/services/application-service';

/**
 * GET /api/applications/:id
 * Source: `.agents/rules/api-contracts.md` (#3.3) & `.agents/rules/screen-inventory.md` Row #9.
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;
  const customerId = 'user-customer-ahmed';

  try {
    const application = await getApplicationById(context.params.id, customerId);

    return NextResponse.json(
      { data: application },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'GET /api/applications/[id]');
  }
}

