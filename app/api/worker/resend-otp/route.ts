import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { resendOtpInPerson } from '@/lib/services/worker-service';

/**
 * POST /api/worker/resend-otp
 * Triggers in-person customer OTP dispatch for customers experiencing SMS delays (PRD 7.8).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '197.210.64.1';
  const workerUserId = 'user-worker-chinedu';

  try {
    const body: { applicationId?: string } = await request.json();
    if (!body.applicationId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Application ID is required.', requestId } },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const result = await resendOtpInPerson(body.applicationId, workerUserId, clientIp);

    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: { 'x-request-id': requestId },
      }
    );
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/worker/resend-otp');
  }
}
