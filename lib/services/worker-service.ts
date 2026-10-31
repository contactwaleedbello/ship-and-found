import crypto from 'node:crypto';
import { z } from 'zod';

import { UX_STRINGS } from '@/lib/constants';
import { AppError } from '@/lib/errors';
import { inMemoryApplications } from '@/lib/services/application-service';
import { logAudit } from '@/lib/services/audit-service';
import { getDeviceById } from '@/lib/services/catalog-service';
import type {
  InventoryApprovalDto,
  PaymentRecordDto,
  ReminderType,
  WhatsAppReminderLogDto,
} from '@/lib/types';

/**
 * Store Worker Service for DG Tech Store (Shop ATF 03).
 * Source: PRD Section 3.3 (FR-05, FR-07, FR-08, FR-13), 7.1–7.8, 8.4,
 * and `.agents/rules/business-rules.md` (BR-06, BR-13, BR-19).
 */

const globalForWorker = globalThis as unknown as {
  inMemoryPayments?: PaymentRecordDto[];
  inMemoryWhatsAppReminders?: WhatsAppReminderLogDto[];
  inMemoryInventoryApprovals?: InventoryApprovalDto[];
};

export const inMemoryPayments: PaymentRecordDto[] =
  globalForWorker.inMemoryPayments ?? [];
export const inMemoryWhatsAppReminders: WhatsAppReminderLogDto[] =
  globalForWorker.inMemoryWhatsAppReminders ?? [];
export const inMemoryInventoryApprovals: InventoryApprovalDto[] =
  globalForWorker.inMemoryInventoryApprovals ?? [];

if (process.env['NODE_ENV'] !== 'production') {
  globalForWorker.inMemoryPayments = inMemoryPayments;
  globalForWorker.inMemoryWhatsAppReminders = inMemoryWhatsAppReminders;
  globalForWorker.inMemoryInventoryApprovals = inMemoryInventoryApprovals;
}

// Pre-seed an active contract and payment for testing worker workflows
const seedActiveAppId = 'app-fatima-redmi13';
if (!inMemoryApplications.has(seedActiveAppId)) {
  inMemoryApplications.set(seedActiveAppId, {
    applicationId: seedActiveAppId,
    customerId: 'user-customer-fatima',
    customerName: 'Fatima Garba',
    customerPhone: '+2348023456789',
    customerNinMasked: '*******1234',
    customerNinRaw: '12345678901',
    guarantorName: 'Alhaji Garba Shehu',
    guarantorPhone: '+2348031112233',
    personalDetails: 'Garki 2, Area 11, Abuja',
    deviceId: 'dev-redmi-13',
    deviceName: 'Xiaomi Redmi 13 (256GB)',
    deviceBrandModel: 'Xiaomi Redmi 13 (256GB)',
    lockedPriceNaira: 195000,
    downPaymentPercent: 70,
    downPaymentAmountNaira: 136500,
    remainingAmountNaira: 58500,
    status: 'Active Flexi-Pay Contract',
    customerVisibleStatus: 'Active Flexi-Pay Contract',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 19 * 3600 * 1000).toISOString(),
    expiresInSeconds: 19 * 3600,
    agreementId: 'agr-fatima-redmi13',
    agreementStatus: 'Active Flexi-Pay Contract',
    agreementTerms: 'DG Tech Store Flexi-Pay Agreement (Shop ATF 03): 30-day balance completion window, 0% interest, ₦0 late fees.',
    customerAcceptedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    acceptanceOtpVerified: true,
    dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    deviceSerial: 'SN-XIAOMI-R13-882194',
    downPaymentVerifiedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    downPaymentVerifierId: 'user-worker-chinedu',
    downPaymentVerifierIp: '197.210.64.1',
    downPaymentMethod: 'CASH',
    activatedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    activatedByUserId: 'user-owner-dg',
    activatedByIp: '197.210.64.2',
  });

  inMemoryPayments.push({
    id: `pay-${crypto.randomUUID()}`,
    agreementId: 'agr-fatima-redmi13',
    amountNaira: 136500,
    paymentMethod: 'CASH',
    paymentType: 'DOWN_PAYMENT',
    recordedByUserId: 'user-worker-chinedu',
    recordedByName: 'Chinedu Okafor (Store Worker)',
    recordedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    notes: 'Initial 70% cash down payment verified at Shop ATF 03 counter.',
  });
}

// Pre-seed an inventory update proposal
if (inMemoryInventoryApprovals.length === 0) {
  inMemoryInventoryApprovals.push({
    id: 'inv-prop-01',
    deviceId: 'dev-a15',
    deviceName: 'Samsung Galaxy A15 (128GB)',
    proposedStockCount: 5,
    currentStockCount: 2,
    reason: 'Received new stock shipment of 3 units at Shop ATF 03.',
    status: 'PENDING',
    submittedByUserId: 'user-worker-chinedu',
    submittedByName: 'Chinedu Okafor (Store Worker)',
    submittedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  });
}

export interface WorkerQueuesDto {
  paymentsToVerifyCount: number;
  remindersDueCount: number;
  reservedUnitsCount: number;
  inventoryPendingCount: number;
  paymentsToVerify: Array<{
    applicationId: string;
    customerName: string;
    customerPhone: string;
    deviceName: string;
    downPaymentAmountNaira: number;
    createdAt: string;
    expiresAt: string;
    status: string;
  }>;
  remindersDue: Array<{
    agreementId: string;
    customerName: string;
    customerPhone: string;
    deviceName: string;
    remainingAmountNaira: number;
    dueDate: string;
    reminderType: ReminderType;
    lastReminderSentAt?: string | undefined;
  }>;
  reservedUnits: Array<{
    applicationId: string;
    customerName: string;
    deviceName: string;
    expiresAt: string;
    status: string;
  }>;
  inventoryUpdates: InventoryApprovalDto[];
}

export function getWorkerQueues(): WorkerQueuesDto {
  const now = Date.now();
  const paymentsToVerify: WorkerQueuesDto['paymentsToVerify'] = [];
  const reservedUnits: WorkerQueuesDto['reservedUnits'] = [];
  const remindersDue: WorkerQueuesDto['remindersDue'] = [];

  for (const app of inMemoryApplications.values()) {
    // 1. Payments to verify queue: status is 'Application Pending' or 'Awaiting Down Payment Verification' and not yet verified
    if (
      (app.status === 'Application Pending' || app.status === 'Awaiting Down Payment Verification' || app.status === 'Awaiting Customer Acceptance') &&
      !app.downPaymentVerifiedAt
    ) {
      paymentsToVerify.push({
        applicationId: app.applicationId,
        customerName: app.customerName,
        customerPhone: app.customerPhone,
        deviceName: app.deviceName,
        downPaymentAmountNaira: app.downPaymentAmountNaira,
        createdAt: app.createdAt,
        expiresAt: app.expiresAt,
        status: app.status,
      });
    }

    // 2. Reserved units queue: holds reserved device
    if (
      ['Application Pending', 'Awaiting Down Payment Verification', 'Awaiting Customer Acceptance', 'Awaiting Final Approval'].includes(app.status)
    ) {
      reservedUnits.push({
        applicationId: app.applicationId,
        customerName: app.customerName,
        deviceName: app.deviceName,
        expiresAt: app.expiresAt,
        status: app.status,
      });
    }

    // 3. Reminders queue: active contracts with upcoming or overdue milestones
    if (app.status === 'Active Flexi-Pay Contract' && app.dueDate && app.agreementId) {
      const dueTime = new Date(app.dueDate).getTime();
      const diffDays = Math.ceil((dueTime - now) / (1000 * 3600 * 24));
      let reminderType: ReminderType | null = null;

      if (diffDays <= -1) reminderType = 'T+1';
      else if (diffDays === 0) reminderType = 'T-0';
      else if (diffDays <= 1) reminderType = 'T-1';
      else if (diffDays <= 3) reminderType = 'T-3';
      else if (diffDays <= 7) reminderType = 'T-7';

      if (reminderType) {
        const lastSent = inMemoryWhatsAppReminders
          .filter((r) => r.agreementId === app.agreementId)
          .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0];

        remindersDue.push({
          agreementId: app.agreementId,
          customerName: app.customerName,
          customerPhone: app.customerPhone,
          deviceName: app.deviceName,
          remainingAmountNaira: app.remainingAmountNaira,
          dueDate: app.dueDate,
          reminderType,
          lastReminderSentAt: lastSent?.sentAt,
        });
      }
    }
  }

  const inventoryPending = inMemoryInventoryApprovals.filter((inv) => inv.status === 'PENDING');

  return {
    paymentsToVerifyCount: paymentsToVerify.length,
    remindersDueCount: remindersDue.length,
    reservedUnitsCount: reservedUnits.length,
    inventoryPendingCount: inventoryPending.length,
    paymentsToVerify,
    remindersDue,
    reservedUnits,
    inventoryUpdates: inMemoryInventoryApprovals,
  };
}

export const verifyPaymentSchema = z.object({
  applicationId: z.string().trim().min(1, 'Application ID is required.'),
  paymentMethod: z.enum(['CASH', 'TRANSFER'], {
    errorMap: () => ({ message: 'Payment method must be either CASH or TRANSFER.' }),
  }),
  attestationChecked: z.boolean().refine((val) => val === true, {
    message: 'You must confirm physical receipt of down payment before verifying (BR-06).',
  }),
  notes: z.string().optional(),
});

export async function recordDownPaymentVerification(
  rawInput: unknown,
  verifierUserId: string,
  verifierIp: string
) {
  const input = verifyPaymentSchema.parse(rawInput);
  const app = inMemoryApplications.get(input.applicationId);

  if (!app) {
    throw new AppError('NOT_FOUND', 404, 'Application not found.');
  }

  if (app.downPaymentVerifiedAt) {
    throw new AppError('ALREADY_VERIFIED', 400, 'Down payment has already been verified for this application.');
  }

  // Update application with verification metadata
  const verifiedAt = new Date().toISOString();
  app.downPaymentVerifiedAt = verifiedAt;
  app.downPaymentVerifierId = verifierUserId;
  app.downPaymentVerifierIp = verifierIp;
  app.downPaymentMethod = input.paymentMethod;

  // State transition: If customer has already accepted OTP, advance to Awaiting Final Approval;
  // otherwise, advance to Awaiting Customer Acceptance.
  if (app.acceptanceOtpVerified) {
    app.status = 'Awaiting Final Approval';
    app.customerVisibleStatus = 'Approved';
  } else {
    app.status = 'Awaiting Customer Acceptance';
    app.customerVisibleStatus = 'Approved';
  }

  // Record payment receipt
  const paymentRecord: PaymentRecordDto = {
    id: `pay-${crypto.randomUUID()}`,
    agreementId: app.agreementId ?? app.applicationId,
    amountNaira: app.downPaymentAmountNaira,
    paymentMethod: input.paymentMethod,
    paymentType: 'DOWN_PAYMENT',
    recordedByUserId: verifierUserId,
    recordedByName: 'Store Worker (Shop ATF 03)',
    recordedAt: verifiedAt,
    notes: input.notes?.trim() || `Verified ${input.paymentMethod} down payment in-store at Shop ATF 03 counter.`,
  };
  inMemoryPayments.push(paymentRecord);

  // Log to immutable audit trail
  logAudit({
    action: 'DOWN_PAYMENT_VERIFIED',
    actorId: verifierUserId,
    actorRole: 'STORE_WORKER',
    targetId: app.applicationId,
    ipAddress: verifierIp,
    metadata: {
      applicationId: app.applicationId,
      paymentMethod: input.paymentMethod,
      amountNaira: app.downPaymentAmountNaira,
      nextStatus: app.status,
    },
  });

  return { application: app, payment: paymentRecord };
}

export const recordBalancePaymentSchema = z.object({
  agreementId: z.string().trim().min(1, 'Agreement ID is required.'),
  amountNaira: z.number().positive('Payment amount must be greater than zero.'),
  paymentMethod: z.enum(['CASH', 'TRANSFER']),
  notes: z.string().optional(),
});

export async function recordBalancePayment(
  rawInput: unknown,
  recordedByUserId: string,
  clientIp: string
) {
  const input = recordBalancePaymentSchema.parse(rawInput);

  const targetApp = Array.from(inMemoryApplications.values()).find(
    (app) => app.agreementId === input.agreementId || app.applicationId === input.agreementId
  );

  if (!targetApp) {
    throw new AppError('NOT_FOUND', 404, 'Flexi-pay contract agreement not found.');
  }

  if (targetApp.status !== 'Active Flexi-Pay Contract') {
    throw new AppError('INVALID_STATE', 400, `Cannot record balance payment for agreement in status "${targetApp.status}".`);
  }

  // FR-08 / BR: Overpayment block!
  if (input.amountNaira > targetApp.remainingAmountNaira) {
    throw new AppError('OVERPAYMENT_BLOCKED', 400, UX_STRINGS.OVERPAYMENT_BLOCKED);
  }

  targetApp.remainingAmountNaira -= input.amountNaira;
  const recordedAt = new Date().toISOString();

  // If balance reached 0, contract is completed
  let isCompleted = false;
  if (targetApp.remainingAmountNaira <= 0) {
    targetApp.remainingAmountNaira = 0;
    targetApp.status = 'Completed';
    targetApp.customerVisibleStatus = 'Completed';
    targetApp.settledAt = recordedAt;
    isCompleted = true;
  }

  const paymentRecord: PaymentRecordDto = {
    id: `pay-${crypto.randomUUID()}`,
    agreementId: targetApp.agreementId ?? targetApp.applicationId,
    amountNaira: input.amountNaira,
    paymentMethod: input.paymentMethod,
    paymentType: 'BALANCE',
    recordedByUserId,
    recordedByName: 'Store Worker (Shop ATF 03)',
    recordedAt,
    notes: input.notes?.trim() || `Balance payment recorded via ${input.paymentMethod}.`,
  };
  inMemoryPayments.push(paymentRecord);

  logAudit({
    action: isCompleted ? 'CONTRACT_COMPLETED' : 'BALANCE_PAYMENT_RECORDED',
    actorId: recordedByUserId,
    actorRole: 'STORE_WORKER',
    targetId: targetApp.agreementId ?? targetApp.applicationId,
    ipAddress: clientIp,
    metadata: {
      amountNaira: input.amountNaira,
      remainingAmountNaira: targetApp.remainingAmountNaira,
      isCompleted,
    },
  });

  return { application: targetApp, payment: paymentRecord, isCompleted };
}

export const recordSettlementPaymentSchema = z.object({
  agreementId: z.string().trim().min(1, 'Agreement ID is required.'),
  amountNaira: z.number().positive('Settlement payment must be greater than zero.'),
  paymentMethod: z.enum(['CASH', 'TRANSFER']),
  notes: z.string().optional(),
});

export async function recordSettlementPayment(
  rawInput: unknown,
  recordedByUserId: string,
  clientIp: string
) {
  const input = recordSettlementPaymentSchema.parse(rawInput);

  const targetApp = Array.from(inMemoryApplications.values()).find(
    (app) => app.agreementId === input.agreementId || app.applicationId === input.agreementId
  );

  if (!targetApp) {
    throw new AppError('NOT_FOUND', 404, 'Flexi-pay contract agreement not found.');
  }

  if (targetApp.status !== 'Defaulted') {
    throw new AppError('INVALID_STATE', 400, 'Settlement payments can only be recorded on Defaulted contracts.');
  }

  // Deduct from remaining balance
  targetApp.remainingAmountNaira = Math.max(0, targetApp.remainingAmountNaira - input.amountNaira);
  const recordedAt = new Date().toISOString();

  const paymentRecord: PaymentRecordDto = {
    id: `pay-${crypto.randomUUID()}`,
    agreementId: targetApp.agreementId ?? targetApp.applicationId,
    amountNaira: input.amountNaira,
    paymentMethod: input.paymentMethod,
    paymentType: 'SETTLEMENT',
    recordedByUserId,
    recordedByName: 'Store Worker (Shop ATF 03)',
    recordedAt,
    notes: input.notes?.trim() || `Settlement recovery payment recorded.`,
  };
  inMemoryPayments.push(paymentRecord);

  logAudit({
    action: 'SETTLEMENT_PAYMENT_RECORDED',
    actorId: recordedByUserId,
    actorRole: 'STORE_WORKER',
    targetId: targetApp.agreementId ?? targetApp.applicationId,
    ipAddress: clientIp,
    metadata: {
      amountNaira: input.amountNaira,
      remainingAmountNaira: targetApp.remainingAmountNaira,
    },
  });

  return { application: targetApp, payment: paymentRecord };
}

export const logWhatsAppReminderSchema = z.object({
  agreementId: z.string().trim().min(1),
  reminderType: z.enum(['T-7', 'T-3', 'T-1', 'T-0', 'T+1']),
  recipientPhone: z.string().trim().min(10),
  status: z.enum(['SENT', 'FAILED']).default('SENT'),
});

export async function logWhatsAppReminder(
  rawInput: unknown,
  loggedByUserId: string,
  clientIp: string
) {
  const input = logWhatsAppReminderSchema.parse(rawInput);

  const targetApp = Array.from(inMemoryApplications.values()).find(
    (app) => app.agreementId === input.agreementId || app.applicationId === input.agreementId
  );

  const reminderLog: WhatsAppReminderLogDto = {
    id: `rem-${crypto.randomUUID()}`,
    agreementId: input.agreementId,
    customerName: targetApp?.customerName ?? 'Customer',
    customerPhone: input.recipientPhone,
    reminderType: input.reminderType,
    channel: 'WHATSAPP',
    status: input.status,
    sentAt: new Date().toISOString(),
    loggedByUserId,
    loggedByName: 'Store Worker (Shop ATF 03)',
  };

  inMemoryWhatsAppReminders.push(reminderLog);

  logAudit({
    action: 'WHATSAPP_REMINDER_LOGGED',
    actorId: loggedByUserId,
    actorRole: 'STORE_WORKER',
    targetId: input.agreementId,
    ipAddress: clientIp,
    metadata: {
      reminderType: input.reminderType,
      recipientPhone: input.recipientPhone,
    },
  });

  return reminderLog;
}

export const submitInventoryUpdateSchema = z.object({
  deviceId: z.string().trim().min(1, 'Device selection is required.'),
  proposedStockCount: z.number().int().min(0, 'Stock count cannot be negative.'),
  reason: z.string().trim().min(3, 'Provide a brief reason for the inventory adjustment.'),
});

export async function submitInventoryUpdate(
  rawInput: unknown,
  submittedByUserId: string,
  clientIp: string
) {
  const input = submitInventoryUpdateSchema.parse(rawInput);
  const device = getDeviceById(input.deviceId);

  if (!device) {
    throw new AppError('NOT_FOUND', 404, 'Device not found in catalog.');
  }

  const approvalRecord: InventoryApprovalDto = {
    id: `inv-${crypto.randomUUID()}`,
    deviceId: device.id,
    deviceName: device.name,
    proposedStockCount: input.proposedStockCount,
    currentStockCount: device.stockCount,
    reason: input.reason.trim(),
    status: 'PENDING',
    submittedByUserId,
    submittedByName: 'Store Worker (Shop ATF 03)',
    submittedAt: new Date().toISOString(),
  };

  inMemoryInventoryApprovals.unshift(approvalRecord);

  logAudit({
    action: 'INVENTORY_UPDATE_PROPOSED',
    actorId: submittedByUserId,
    actorRole: 'STORE_WORKER',
    targetId: device.id,
    ipAddress: clientIp,
    metadata: {
      deviceId: device.id,
      currentStockCount: device.stockCount,
      proposedStockCount: input.proposedStockCount,
      reason: input.reason,
    },
  });

  return approvalRecord;
}

export async function resendOtpInPerson(applicationId: string, workerUserId: string, clientIp: string) {
  const app = inMemoryApplications.get(applicationId);
  if (!app) {
    throw new AppError('NOT_FOUND', 404, 'Application not found.');
  }

  const generatedOtp = '582914'; // Mock deterministic OTP for easy verification testing

  logAudit({
    action: 'IN_PERSON_OTP_RESENT',
    actorId: workerUserId,
    actorRole: 'STORE_WORKER',
    targetId: applicationId,
    ipAddress: clientIp,
    metadata: {
      applicationId,
      customerPhone: app.customerPhone,
      otpSimulated: generatedOtp,
    },
  });

  return {
    success: true,
    message: `New OTP dispatched to customer ${app.customerPhone}.`,
    otpHint: generatedOtp,
  };
}

export function getPaymentsForAgreement(agreementId: string): PaymentRecordDto[] {
  return inMemoryPayments.filter((p) => p.agreementId === agreementId);
}
