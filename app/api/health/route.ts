import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

import { isDatabaseConfigured } from '@/lib/env';
import { handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { HealthResponseDto } from '@/lib/types';

/**
 * GET /api/health
 * Source: `.agents/rules/monitoring.md`, `.agents/rules/observability-baseline.md`,
 * `.agents/skills/build-api-endpoint/SKILL.md`, and `docs/false-success.md` (FS-05).
 */
export async function GET(request: Request): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  try {
    const dbConfigured = isDatabaseConfigured();

    const body: HealthResponseDto = {
      status: dbConfigured ? 'ok' : 'degraded',
      shop: 'Shop ATF 03',
      timestamp: new Date().toISOString(),
      requestId,
      checks: {
        app: 'ok',
        database: dbConfigured ? 'ok' : 'unconfigured',
        expiryCronHeartbeat: 'unconfigured',
        defaultCronHeartbeat: 'unconfigured',
      },
    };

    logger.info('Health check completed', {
      requestId,
      route: '/api/health',
      method: 'GET',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      metadata: {
        status: body.status,
        database: body.checks.database,
      },
    });

    return NextResponse.json(body, {
      status: 200,
      headers: {
        'x-request-id': requestId,
        'cache-control': 'no-store',
      },
    });
  } catch (error: unknown) {
    return handleApiError(error, requestId, '/api/health');
  }
}

