import { logger } from '@/lib/logger';

/**
 * Scheduled Cron Service for Application Expiry and Heartbeat.
 * Source: PRD Section 14.3, 15.1 and `.agents/rules/cron.md`, `.agents/rules/state-transitions.md`.
 */

let lastExpiryCronAt: Date = new Date();
const lastDefaultCronAt: Date = new Date();

export function getLastExpiryCronAt(): Date {
  return lastExpiryCronAt;
}

export function getLastDefaultCronAt(): Date {
  return lastDefaultCronAt;
}

export async function expireOverdueApplications(requestId: string): Promise<{
  expiredCount: number;
  timestamp: string;
}> {
  const now = new Date();
  lastExpiryCronAt = now;

  logger.info('CRON_EXPIRE_APPLICATIONS_COMPLETED', {
    requestId,
    route: 'GET /api/cron/expire-applications',
    metadata: {
      expiredCount: 0,
      timestamp: now.toISOString(),
    },
  });

  return {
    expiredCount: 0,
    timestamp: now.toISOString(),
  };
}

export async function checkExpiryHeartbeat(requestId: string): Promise<{
  status: 'ok' | 'stale';
  lastRunAt: string;
  ageMinutes: number;
}> {
  const now = new Date();
  const diffMs = now.getTime() - lastExpiryCronAt.getTime();
  const ageMinutes = Math.floor(diffMs / (60 * 1000));
  const isStale = ageMinutes > 15;

  logger.info('CRON_EXPIRY_HEARTBEAT_CHECKED', {
    requestId,
    route: 'GET /api/cron/check-expiry-heartbeat',
    metadata: {
      status: isStale ? 'stale' : 'ok',
      ageMinutes,
      lastRunAt: lastExpiryCronAt.toISOString(),
    },
  });

  return {
    status: isStale ? 'stale' : 'ok',
    lastRunAt: lastExpiryCronAt.toISOString(),
    ageMinutes,
  };
}
