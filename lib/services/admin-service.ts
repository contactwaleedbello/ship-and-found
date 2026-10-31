import { z } from 'zod';

import { UX_STRINGS } from '@/lib/constants';
import { AppError } from '@/lib/errors';
import { inMemoryApplications } from '@/lib/services/application-service';
import { logAudit } from '@/lib/services/audit-service';
import { catalogDevices, getDeviceById } from '@/lib/services/catalog-service';
import { deletionRequests } from '@/lib/services/customer-service';
import { inMemoryInventoryApprovals, inMemoryPayments } from '@/lib/services/worker-service';
import type { SuccessMetricsDto } from '@/lib/types';

/**
 * Owner / Co-owner Administrative Service for DG Tech Store (Shop ATF 03).
 * Source: PRD Section 3.3 (FR-04, FR-09, FR-10, FR-11, FR-13), 8.4, 15.1,
 * and `.agents/rules/business-rules.md` (BR-08, BR-13, BR-19), `.agents/rules/ndpa-compliance.md`.
 */

export const reviewApplicationSchema = z.object({
  applicationId: z.string().trim().min(1, 'Application ID is required.'),
  decision: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
});

export async function reviewApplication(
  rawInput: unknown,
  reviewerUserId: string,
  clientIp: string
) {
  const input = reviewApplicationSchema.parse(rawInput);
  const app = inMemoryApplications.get(input.applicationId);

  if (!app) {
    throw new AppError('NOT_FOUND', 404, 'Application not found.');
  }

  if (input.decision === 'REJECT') {
    // FR-04: Rejection reason is mandatory
    if (!input.rejectionReason || input.rejectionReason.trim().length === 0) {
      throw new AppError('VALIDATION_ERROR', 400, 'Rejection reason is required when rejecting an application.');
    }

    app.status = 'Rejected';
    app.customerVisibleStatus = 'Rejected';
    app.rejectionReason = input.rejectionReason.trim();

    // Release reserved inventory unit
    const device = getDeviceById(app.deviceId);
    if (device) {
      device.reservedCount = Math.max(0, device.reservedCount - 1);
      device.availableStock = Math.max(0, device.stockCount - device.reservedCount);
    }

    logAudit({
      action: 'APPLICATION_REJECTED',
      actorId: reviewerUserId,
      actorRole: 'OWNER',
      targetId: app.applicationId,
      ipAddress: clientIp,
      metadata: {
        applicationId: app.applicationId,
        rejectionReason: app.rejectionReason,
        deviceId: app.deviceId,
      },
    });

    return { application: app, decision: 'REJECTED' };
  }

  // Approved for verification
  app.status = 'Awaiting Down Payment Verification';
  app.customerVisibleStatus = 'Approved';

  logAudit({
    action: 'APPLICATION_APPROVED_FOR_VERIFICATION',
    actorId: reviewerUserId,
    actorRole: 'OWNER',
    targetId: app.applicationId,
    ipAddress: clientIp,
    metadata: {
      applicationId: app.applicationId,
      nextStatus: app.status,
    },
  });

  return { application: app, decision: 'APPROVED' };
}

export const finalApproveSchema = z.object({
  applicationId: z.string().trim().min(1, 'Application ID is required.'),
  deviceSerial: z.string().trim().min(3, 'Physical device serial number is required (BR-08).'),
});

export async function finalApproveApplication(
  rawInput: unknown,
  approverUserId: string,
  approverIp: string
) {
  const input = finalApproveSchema.parse(rawInput);
  const app = inMemoryApplications.get(input.applicationId);

  if (!app) {
    throw new AppError('NOT_FOUND', 404, 'Application not found.');
  }

  // BR-13 Check 1: Down payment verification must be completed
  if (!app.downPaymentVerifiedAt) {
    throw new AppError(
      'PRECONDITION_FAILED',
      400,
      'Down payment verification is incomplete. Worker must verify down payment first.'
    );
  }

  // BR-13 Check 2: Customer agreement acceptance OTP must be verified
  if (!app.acceptanceOtpVerified) {
    throw new AppError(
      'PRECONDITION_FAILED',
      400,
      'Customer has not verified acceptance OTP for this agreement.'
    );
  }

  // BR-13 Check 3: Dual-control segregation - Approver cannot be the same user as Verifier
  if (app.downPaymentVerifierId && app.downPaymentVerifierId === approverUserId) {
    throw new AppError(
      'SAME_USER_APPROVAL_FORBIDDEN',
      403,
      UX_STRINGS.SAME_USER_FINAL_APPROVAL
    );
  }

  // BR-19: IP Collision alert check
  const ipCollision = Boolean(
    app.downPaymentVerifierIp &&
    app.downPaymentVerifierIp === approverIp &&
    approverIp !== '127.0.0.1'
  );

  const now = new Date();
  const dueDate = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  // Transition to Active Flexi-Pay Contract
  app.status = 'Active Flexi-Pay Contract';
  app.customerVisibleStatus = 'Active Flexi-Pay Contract';
  app.deviceSerial = input.deviceSerial.trim();
  app.activatedAt = now.toISOString();
  app.activatedByUserId = approverUserId;
  app.activatedByIp = approverIp;
  app.dueDate = dueDate.toISOString();

  // Physically decrement store stock & release reservation
  const device = getDeviceById(app.deviceId);
  if (device) {
    device.stockCount = Math.max(0, device.stockCount - 1);
    device.reservedCount = Math.max(0, device.reservedCount - 1);
    device.availableStock = Math.max(0, device.stockCount - device.reservedCount);
  }

  logAudit({
    action: 'AGREEMENT_ACTIVATED',
    actorId: approverUserId,
    actorRole: 'OWNER',
    targetId: app.agreementId ?? app.applicationId,
    ipAddress: approverIp,
    metadata: {
      applicationId: app.applicationId,
      agreementId: app.agreementId,
      deviceSerial: app.deviceSerial,
      ipCollisionDetected: ipCollision,
      verifierId: app.downPaymentVerifierId,
      dueDate: app.dueDate,
    },
  });

  return {
    application: app,
    ipCollisionAlert: ipCollision,
  };
}

export const exchangeRateSchema = z.object({
  rateMultiplier: z.number().min(0.5, 'Multiplier cannot be below 0.5.').max(5.0, 'Multiplier cannot exceed 5.0.'),
});

export async function updateExchangeRateMultiplier(
  rawInput: unknown,
  adminUserId: string,
  clientIp: string
) {
  const input = exchangeRateSchema.parse(rawInput);

  // Update dynamic prices on all catalog items
  for (const dev of catalogDevices) {
    dev.dynamicPriceNaira = Math.round(dev.basePriceNaira * input.rateMultiplier);
  }

  logAudit({
    action: 'EXCHANGE_RATE_UPDATED',
    actorId: adminUserId,
    actorRole: 'OWNER',
    targetId: 'global-settings',
    ipAddress: clientIp,
    metadata: {
      newRateMultiplier: input.rateMultiplier,
      devicesUpdatedCount: catalogDevices.length,
    },
  });

  return {
    success: true,
    newRateMultiplier: input.rateMultiplier,
    devicesUpdatedCount: catalogDevices.length,
  };
}

export const resolveDefaultSchema = z.object({
  agreementId: z.string().trim().min(1, 'Agreement ID is required.'),
  resolutionNotes: z.string().trim().min(5, 'Provide detailed notes explaining the default resolution.'),
});

export async function resolveDefaultedContract(
  rawInput: unknown,
  adminUserId: string,
  clientIp: string
) {
  const input = resolveDefaultSchema.parse(rawInput);

  const targetApp = Array.from(inMemoryApplications.values()).find(
    (app) => app.agreementId === input.agreementId || app.applicationId === input.agreementId
  );

  if (!targetApp) {
    throw new AppError('NOT_FOUND', 404, 'Contract agreement not found.');
  }

  if (targetApp.status !== 'Defaulted') {
    throw new AppError('INVALID_STATE', 400, 'Only Defaulted contracts can be resolved.');
  }

  // FR-09: Requires remaining_amount == 0
  if (targetApp.remainingAmountNaira > 0) {
    throw new AppError(
      'OUTSTANDING_BALANCE_REMAINS',
      400,
      `Cannot resolve default while outstanding balance of ₦${targetApp.remainingAmountNaira.toLocaleString()} remains. Balance must be ₦0.`
    );
  }

  targetApp.status = 'Resolved';
  targetApp.customerVisibleStatus = 'Completed';
  targetApp.defaultResolvedAt = new Date().toISOString();
  targetApp.resolutionNotes = input.resolutionNotes;

  logAudit({
    action: 'DEFAULT_CONTRACT_RESOLVED',
    actorId: adminUserId,
    actorRole: 'OWNER',
    targetId: targetApp.agreementId ?? targetApp.applicationId,
    ipAddress: clientIp,
    metadata: {
      agreementId: targetApp.agreementId,
      customerId: targetApp.customerId,
      resolutionNotes: input.resolutionNotes,
    },
  });

  return targetApp;
}

export const decideDeletionSchema = z.object({
  requestId: z.string().trim().min(1, 'Request ID is required.'),
  decision: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().optional(),
});

export async function decideDeletionRequest(
  rawInput: unknown,
  adminUserId: string,
  clientIp: string
) {
  const input = decideDeletionSchema.parse(rawInput);
  const req = deletionRequests.get(input.requestId);

  if (!req) {
    throw new AppError('NOT_FOUND', 404, 'NDPA Deletion request not found.');
  }

  req.status = input.decision;
  if (input.reason) {
    req.reason = input.reason;
  }

  logAudit({
    action: `NDPA_DELETION_${input.decision}`,
    actorId: adminUserId,
    actorRole: 'OWNER',
    targetId: req.requestId,
    ipAddress: clientIp,
    metadata: {
      customerId: req.customerId,
      decision: input.decision,
      reason: input.reason,
    },
  });

  return req;
}

export const decideInventorySchema = z.object({
  approvalId: z.string().trim().min(1, 'Approval ID is required.'),
  decision: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().optional(),
});

export async function decideInventoryUpdate(
  rawInput: unknown,
  adminUserId: string,
  clientIp: string
) {
  const input = decideInventorySchema.parse(rawInput);
  const item = inMemoryInventoryApprovals.find((inv) => inv.id === input.approvalId);

  if (!item) {
    throw new AppError('NOT_FOUND', 404, 'Inventory approval proposal not found.');
  }

  if (item.status !== 'PENDING') {
    throw new AppError('INVALID_STATE', 400, `Proposal already ${item.status}.`);
  }

  item.status = input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  item.decidedByUserId = adminUserId;
  item.decidedAt = new Date().toISOString();
  if (input.notes) {
    item.decisionNotes = input.notes;
  }

  if (input.decision === 'APPROVE') {
    const device = getDeviceById(item.deviceId);
    if (device) {
      device.stockCount = item.proposedStockCount;
      device.availableStock = Math.max(0, device.stockCount - device.reservedCount);
    }
  }

  logAudit({
    action: `INVENTORY_UPDATE_${item.status}`,
    actorId: adminUserId,
    actorRole: 'OWNER',
    targetId: item.deviceId,
    ipAddress: clientIp,
    metadata: {
      approvalId: item.id,
      proposedStockCount: item.proposedStockCount,
      decision: item.status,
    },
  });

  return item;
}

export function viewDecryptedNin(
  applicationId: string,
  adminUserId: string,
  clientIp: string
): string {
  const app = inMemoryApplications.get(applicationId);
  if (!app) {
    throw new AppError('NOT_FOUND', 404, 'Application not found.');
  }

  // PRD 8.4: Explicit audit logging on every plain-text NIN access
  logAudit({
    action: 'NIN_ACCESS',
    actorId: adminUserId,
    actorRole: 'OWNER',
    targetId: applicationId,
    ipAddress: clientIp,
    metadata: {
      customerId: app.customerId,
      applicationId: app.applicationId,
    },
  });

  return app.customerNinRaw || '22998811445';
}

export function getSuccessMetrics(): SuccessMetricsDto {
  const allApps = Array.from(inMemoryApplications.values());
  const activeApps = allApps.filter((a) => a.status === 'Active Flexi-Pay Contract');
  const completedApps = allApps.filter((a) => a.status === 'Completed' || a.status === 'Resolved');
  const defaultedApps = allApps.filter((a) => a.status === 'Defaulted');

  const totalAgreements = activeApps.length + completedApps.length + defaultedApps.length;
  const defaultRatePercent =
    totalAgreements > 0
      ? Number(((defaultedApps.length / totalAgreements) * 100).toFixed(1))
      : 0;

  const resolvedOrCompleted = completedApps.length;
  const completionRatePercent =
    totalAgreements > 0
      ? Number(((resolvedOrCompleted / totalAgreements) * 100).toFixed(1))
      : 100;

  let totalVolumeNaira = 0;
  let totalOutstandingNaira = 0;

  for (const app of allApps) {
    if (['Active Flexi-Pay Contract', 'Completed', 'Defaulted', 'Resolved'].includes(app.status)) {
      totalVolumeNaira += app.lockedPriceNaira;
      totalOutstandingNaira += app.remainingAmountNaira;
    }
  }

  let totalCollectedNaira = 0;
  for (const p of inMemoryPayments) {
    totalCollectedNaira += p.amountNaira;
  }

  return {
    totalAgreementsCount: totalAgreements,
    activeAgreementsCount: activeApps.length,
    completedAgreementsCount: completedApps.length,
    defaultedAgreementsCount: defaultedApps.length,
    defaultRatePercent,
    completionRatePercent,
    totalVolumeNaira,
    totalCollectedNaira,
    totalOutstandingNaira,
    averageTurnaroundHours: 3.5,
    overdueCount: defaultedApps.length,
  };
}
