import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { logWhatsAppReminder } from '@/lib/services/worker-service';

/**
 * POST /api/worker/log-reminder
 * Logs manual WhatsApp reminder dispatch to WhatsAppReminderLog and AuditLog (FR-07).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '197.210.64.1';
  const workerUserId = 'user-worker-chinedu';

  try {
    const body: unknown = await request.json();
    const result = await logWhatsAppReminder(body, workerUserId, clientIp);

    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/worker/log-reminder');
  }
}
