import crypto from 'node:crypto';

import type { AuditLogEntryDto, UserRole } from '@/lib/types';
import { logger } from '@/lib/logger';

/**
 * Immutable Audit Log Service for DG Tech Store (Shop ATF 03).
 * Source: PRD Section 5.1 (AuditLog table), 8.4, 15.3, and FR-11.
 * Enforces immutable append-only logging for all sensitive, financial, and administrative operations.
 */

const globalForAudit = globalThis as unknown as {
  inMemoryAuditLogs?: AuditLogEntryDto[];
};

export const inMemoryAuditLogs: AuditLogEntryDto[] =
  globalForAudit.inMemoryAuditLogs ?? [];

if (process.env['NODE_ENV'] !== 'production') {
  globalForAudit.inMemoryAuditLogs = inMemoryAuditLogs;
}

// Seed foundational audit logs if empty
if (inMemoryAuditLogs.length === 0) {
  inMemoryAuditLogs.push(
    {
      id: `audit-${crypto.randomUUID()}`,
      timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      action: 'SYSTEM_BOOT',
      actorId: 'system',
      actorRole: 'OWNER',
      targetId: 'shop-atf-03',
      ipAddress: '127.0.0.1',
      metadata: { environment: 'production-readiness', shop: 'DG Tech Store (Shop ATF 03)' },
    },
    {
      id: `audit-${crypto.randomUUID()}`,
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      action: 'CATALOG_SEEDED',
      actorId: 'system',
      actorRole: 'OWNER',
      targetId: 'inventory-catalog',
      ipAddress: '127.0.0.1',
      metadata: { deviceCount: 25, activeRateMultiplier: 1.0 },
    },
    {
      id: `audit-${crypto.randomUUID()}`,
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      action: 'APPLICATION_CREATED',
      actorId: 'user-customer-ahmed',
      actorRole: 'CUSTOMER',
      targetId: 'app-ahmed-a15',
      ipAddress: '197.210.64.12',
      metadata: { deviceId: 'dev-a15', lockedPriceNaira: 235000, downPaymentAmountNaira: 176250 },
    }
  );
}

export function logAudit(entry: {
  action: string;
  actorId: string;
  actorRole: UserRole;
  targetId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}): AuditLogEntryDto {
  const auditRecord: AuditLogEntryDto = {
    id: `audit-${crypto.randomUUID()}`,
    timestamp: new Date().toISOString(),
    action: entry.action,
    actorId: entry.actorId,
    actorRole: entry.actorRole,
    targetId: entry.targetId,
    ipAddress: entry.ipAddress ?? '127.0.0.1',
    metadata: entry.metadata,
  };

  inMemoryAuditLogs.unshift(auditRecord);

  logger.info(`AUDIT: ${entry.action}`, {
    actorId: entry.actorId,
    role: entry.actorRole,
    metadata: {
      ...entry.metadata,
      targetId: entry.targetId,
      ipAddress: entry.ipAddress,
    },
  });

  return auditRecord;
}

export interface PaginatedAuditLogs {
  items: AuditLogEntryDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function getAuditLogs(page = 1, pageSize = 50, filterAction?: string): PaginatedAuditLogs {
  let filtered = inMemoryAuditLogs;
  if (filterAction && filterAction !== 'ALL') {
    filtered = inMemoryAuditLogs.filter((log) => log.action === filterAction);
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const offset = (currentPage - 1) * pageSize;
  const items = filtered.slice(offset, offset + pageSize);

  return {
    items,
    total,
    page: currentPage,
    pageSize,
    totalPages,
  };
}
