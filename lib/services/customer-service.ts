import crypto from 'node:crypto';

import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getCustomerApplications } from '@/lib/services/application-service';

/**
 * Customer Profile and NDPA Compliance Service.
 * Source: PRD Section 5.3, 7.10, 8.3, and `.agents/rules/ndpa-compliance.md`, `.agents/rules/functional-requirements.md` (FR-10).
 */

export interface DeletionRequestDto {
  requestId: string;
  customerId: string;
  requestDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
}

const globalForDeletion = globalThis as unknown as {
  inMemoryDeletionRequests?: Map<string, DeletionRequestDto>;
};

export const deletionRequests: Map<string, DeletionRequestDto> =
  globalForDeletion.inMemoryDeletionRequests ?? new Map<string, DeletionRequestDto>();

if (process.env['NODE_ENV'] !== 'production') {
  globalForDeletion.inMemoryDeletionRequests = deletionRequests;
}

// Pre-seed a pending deletion request for testing admin workflows
if (deletionRequests.size === 0) {
  deletionRequests.set('del-demo-01', {
    requestId: 'del-demo-01',
    customerId: 'user-customer-zainab',
    requestDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: 'PENDING',
    reason: 'Account closed, no outstanding contracts. Requesting full data erasure under NDPA Section 37.',
  });
}

export function getAllDeletionRequests(): DeletionRequestDto[] {
  return Array.from(deletionRequests.values()).sort(
    (a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
  );
}

export async function submitDataDeletionRequest(
  customerId: string,
  clientIp: string,
  requestId: string
): Promise<DeletionRequestDto> {
  // PRD FR-10 & ndpa-compliance.md: Check if customer has active or defaulted contracts
  const applications = await getCustomerApplications(customerId);
  const hasActiveOrDefaultedContract = applications.some(
    (app) => app.status === 'Active Flexi-Pay Contract' || app.status === 'Defaulted'
  );

  if (hasActiveOrDefaultedContract) {
    throw new AppError(
      'FORBIDDEN',
      400,
      'Data deletion cannot be processed while you have an active or defaulted contract (retention required under NDPA Section 37).'
    );
  }

  const deletionId = `del_${crypto.randomUUID()}`;
  const record: DeletionRequestDto = {
    requestId: deletionId,
    customerId,
    requestDate: new Date().toISOString(),
    status: 'PENDING',
  };

  deletionRequests.set(deletionId, record);

  logger.info('NDPA_DATA_DELETION_REQUEST_SUBMITTED', {
    requestId,
    actorId: customerId,
    role: 'CUSTOMER',
    route: 'POST /api/customer/deletion-request',
    metadata: {
      deletionRequestId: deletionId,
      clientIp,
    },
  });

  return record;
}

export async function getDeletionRequestForCustomer(
  customerId: string
): Promise<DeletionRequestDto | null> {
  for (const req of deletionRequests.values()) {
    if (req.customerId === customerId) {
      return req;
    }
  }
  return null;
}

