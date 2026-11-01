import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import argon2 from 'argon2';
import { z } from 'zod';

import { handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';
import { destroyAllUserSessions, buildClearedSessionCookie } from '@/lib/security/session-service';

const resetInputSchema = z.object({
  email: z.string().trim().toLowerCase().email().optional(),
  phoneNumber: z.string().trim().optional(),
  newPassword: z.string().trim().min(8, 'Password must be at least 8 characters long.'),
});

/**
 * POST /api/auth/reset-password
 * Task 5 Step 4: Password reset kills all active sessions across all devices.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? `req_${crypto.randomUUID()}`;

  try {
    const rawBody: unknown = await request.json();
    const input = resetInputSchema.parse(rawBody);

    if (!input.email && !input.phoneNumber) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Either email or phoneNumber is required.' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    // Locate user in database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(input.email ? [{ email: input.email }] : []),
          ...(input.phoneNumber ? [{ phoneNumber: input.phoneNumber }] : []),
        ],
      },
    });

    let sessionsDestroyed = 0;
    if (user) {
      // 1. Slow Argon2id password hashing standard
      const newPasswordHash = await argon2.hash(input.newPassword, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });

      // 2. Update database record
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      });

      // 3. Immediately kill all active sessions across all devices
      sessionsDestroyed = await destroyAllUserSessions(user.id);

      logger.info('PASSWORD_RESET_ALL_SESSIONS_REVOKED', {
        requestId,
        actorId: user.id,
        metadata: {
          sessionsDestroyed,
        },
      });
    }

    const response = NextResponse.json(
      {
        data: {
          passwordUpdated: true,
          sessionsDestroyed,
          message: 'Password reset successful. All active sessions have been terminated.',
        },
      },
      {
        status: 200,
        headers: {
          'x-request-id': requestId,
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      }
    );

    // Clear local session cookie
    response.headers.set('Set-Cookie', buildClearedSessionCookie());
    return response;
  } catch (error: unknown) {
    return handleApiError(error, requestId, 'POST /api/auth/reset-password');
  }
}
