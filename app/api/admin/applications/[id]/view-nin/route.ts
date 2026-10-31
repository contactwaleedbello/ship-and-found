import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { viewDecryptedNin } from '@/lib/services/admin-service';

/**
 * POST /api/admin/applications/[id]/view-nin
 * Decrypts customer NIN for Owner/Co-owner inspection and logs NIN_ACCESS to AuditLog (PRD 8.4, FR-04).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '197.210.64.2';
  const adminUserId = 'user-owner-dg';

  try {
    const plainNin = viewDecryptedNin(params.id, adminUserId, clientIp);

    return NextResponse.json(
      { data: { decryptedNin: plainNin } },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, `POST /api/admin/applications/${params.id}/view-nin`);
  }
}
