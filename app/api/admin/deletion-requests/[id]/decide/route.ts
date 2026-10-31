import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { decideDeletionRequest } from '@/lib/services/admin-service';

/**
 * POST /api/admin/deletion-requests/[id]/decide
 * Records Owner decision on customer NDPA Section 37 data deletion request (FR-10).
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
    const payload = typeof body === 'object' && body !== null ? { ...body, requestId: params.id } : { requestId: params.id };
    const result = await decideDeletionRequest(payload, adminUserId, clientIp);

    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, `POST /api/admin/deletion-requests/${params.id}/decide`);
  }
}
