import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { getAuditLogs } from '@/lib/services/audit-service';

/**
 * GET /api/admin/audit-logs
 * Returns immutable paginated audit log entries (50 rows per page per FR-11).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') ?? '1', 10) || 1;
  const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10) || 50;
  const action = searchParams.get('action') ?? undefined;

  try {
    const data = getAuditLogs(page, pageSize, action);

    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'GET /api/admin/audit-logs');
  }
}
