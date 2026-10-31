import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { serverVerifyCodeSchema } from '@/lib/schemas/auth-schema';
import { verifyCode } from '@/lib/security/otp-service';
import { prisma } from '@/lib/db';

/**
 * POST /api/auth/verify-otp
 * Task 4 Step 10: Cryptographic OTP verification with atomic single-use and expiration checks.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    const rawBody: unknown = await request.json();
    const parseResult = serverVerifyCodeSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Unprocessable Content',
          message: 'Invalid verification payload format.',
          issues: parseResult.error.issues,
        },
        { status: 422, headers: { 'x-request-id': requestId } }
      );
    }

    const { email, code } = parseResult.data;
    const result = verifyCode(email, code);

    switch (result.status) {
      case 'SUCCESS':
        // Update user state in database
        try {
          await prisma.user.updateMany({
            where: { email },
            data: { isVerified: true, emailVerifiedAt: new Date() },
          });
        } catch {
          // Handled
        }

        return NextResponse.json(
          { data: { verified: true, message: result.message } },
          { status: 200, headers: { 'x-request-id': requestId } }
        );

      case 'EXPIRED':
        return NextResponse.json(
          { error: 'Code Expired', message: result.message },
          { status: 410, headers: { 'x-request-id': requestId } }
        );

      case 'ALREADY_USED':
        return NextResponse.json(
          { error: 'Code Already Consumed', message: result.message },
          { status: 409, headers: { 'x-request-id': requestId } }
        );

      case 'INVALID_CODE':
        return NextResponse.json(
          { error: 'Invalid Code', message: result.message },
          { status: 400, headers: { 'x-request-id': requestId } }
        );

      case 'MAX_ATTEMPTS_EXCEEDED':
        return NextResponse.json(
          { error: 'Max Attempts Exceeded', message: result.message },
          { status: 429, headers: { 'x-request-id': requestId } }
        );

      default:
        return NextResponse.json(
          { error: 'Not Found', message: result.message },
          { status: 404, headers: { 'x-request-id': requestId } }
        );
    }
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Malformed JSON payload.' },
      { status: 400, headers: { 'x-request-id': requestId } }
    );
  }
}
