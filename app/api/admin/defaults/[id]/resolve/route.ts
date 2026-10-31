import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { resolveDefaultedContract } from '@/lib/services/admin-service';

/**
 * POST /api/admin/defaults/[id]/resolve
 * Resolves a defaulted contract once full recovery settlement has reached ₦0 balance (FR-09).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '197.210.64.2';
  const adminUserId = 'user-owner-dg';

  try {
    const body: unknown = await request.json();
    const payload = typeof body === 'object' && body !== null ? { ...body, agreementId: params.id } : { agreementId: params.id };
    const result = await resolveDefaultedContract(payload, adminUserId, clientIp);

    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, `POST /api/admin/defaults/${params.id}/resolve`);
  }
}
