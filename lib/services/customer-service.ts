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

const deletionRequests = new Map<string, DeletionRequestDto>();

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

