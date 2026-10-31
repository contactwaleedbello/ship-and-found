import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import argon2 from 'argon2';

import { serverLoginSchema } from '@/lib/schemas/auth-schema';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { prisma } from '@/lib/db';

/**
 * POST /api/auth/login
 * Task 4: Server validation, email lowercase normalization, password trim, Argon2id verification.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  // 1. Rate limiting on login (10 attempts / 60 seconds)
  const rateLimitResult = checkRateLimit(`login:${clientIp}`, { maxRequests: 10, windowSeconds: 60 });
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Too many failed login attempts. Please wait before retrying.',
        resetSeconds: rateLimitResult.resetSeconds,
      },
      {
        status: 429,
        headers: {
          'x-request-id': requestId,
          'Retry-After': rateLimitResult.resetSeconds.toString(),
        },
      }
    );
  }

  try {
    const rawBody: unknown = await request.json();
    const parseResult = serverLoginSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Unprocessable Content',
          message: 'Invalid credentials format.',
          issues: parseResult.error.issues,
        },
        { status: 422, headers: { 'x-request-id': requestId } }
      );
    }

    const { email, password } = parseResult.data;

    // 2. Query user by normalized email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Unified error message to prevent account enumeration
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Incorrect email or password.' },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }

    // 3. Verify Argon2id password hash
    let isValid = false;
    try {
      isValid = await argon2.verify(user.passwordHash, password);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Incorrect email or password.' },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }

    return NextResponse.json(
      {
        data: {
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          message: 'Authentication successful.',
        },
      },
      { status: 200, headers: { 'x-request-id': requestId } }
    );
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Malformed JSON payload.' },
      { status: 400, headers: { 'x-request-id': requestId } }
    );
  }
}
