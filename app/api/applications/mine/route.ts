import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { getCustomerApplications } from '@/lib/services/application-service';

/**
 * GET /api/applications/mine
 * Source: `.agents/rules/api-contracts.md` (#3.2) & `.agents/rules/screen-inventory.md` Row #10 (My Applications).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;
  const customerId = 'user-customer-ahmed';

  try {
    const applications = await getCustomerApplications(customerId);

    return NextResponse.json(
      {
        data: applications,
        meta: {
          total: applications.length,
        },
      },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'GET /api/applications/mine');
  }
}

