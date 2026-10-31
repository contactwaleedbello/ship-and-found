import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { registerCustomer } from '@/lib/services/auth-service';

/**
 * POST /api/auth/register
 * Source: `.agents/rules/api-contracts.md` (#1.1) & `.agents/rules/security-baseline.md`.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    const body: unknown = await request.json();
    const result = await registerCustomer(body, requestId);

    return NextResponse.json(
      { data: result },
      {
        status: 201,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/auth/register');
  }
}
