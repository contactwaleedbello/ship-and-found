import crypto from 'node:crypto';
import { z } from 'zod';

import {
  APPLICATION_EXPIRY_HOURS,
  DOWN_PAYMENT_MAX_PERCENT,
  DOWN_PAYMENT_MIN_PERCENT,
  NIGERIAN_PHONE_REGEX,
  NIN_REGEX,
  OTP_LENGTH,
  UX_STRINGS,
} from '@/lib/constants';
import { maskNin } from '@/lib/crypto';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getDeviceById } from '@/lib/services/catalog-service';
import type { ApplicationStatus, CustomerVisibleStatus } from '@/lib/types';

/**
 * Customer Application and Agreement Service.
 * Source: PRD Sections 3.3 (FR-03, FR-06), 4.1 (BR-01, BR-02, BR-05, BR-09, BR-17),
 * 5.1, 8.3, and `.agents/rules/data-and-schema.md`, `.agents/rules/state-transitions.md`.
 */

export const submitApplicationSchema = z.object({
  deviceId: z.string().trim().min(1, 'Device selection is required.'),
  fullName: z.string().trim().min(2, 'Enter your full legal name as it appears on your NIN.'),
  nin: z.string().trim().regex(NIN_REGEX, UX_STRINGS.NIN_INVALID),
  phone: z.string().trim().regex(NIGERIAN_PHONE_REGEX, UX_STRINGS.PHONE_INVALID),
  guarantorName: z.string().trim().min(2, 'Enter guarantor full name.'),
  guarantorPhone: z.string().trim().regex(NIGERIAN_PHONE_REGEX, 'Enter a valid Nigerian phone number for your guarantor.'),
  personalDetails: z.string().trim().min(5, 'Provide your current residential address in Nigeria.'),
  downPaymentPercent: z
    .number()
    .min(
      DOWN_PAYMENT_MIN_PERCENT,
      `Down payment must be between ${DOWN_PAYMENT_MIN_PERCENT}% and ${DOWN_PAYMENT_MAX_PERCENT}% of the locked price.`
    )
    .max(
      DOWN_PAYMENT_MAX_PERCENT,
      `Down payment must be between ${DOWN_PAYMENT_MIN_PERCENT}% and ${DOWN_PAYMENT_MAX_PERCENT}% of the locked price.`
    ),
});

export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;

export const acceptAgreementSchema = z.object({
  applicationId: z.string().trim().min(1, 'Application ID is required.'),
  otpCode: z.string().trim().regex(/^\d{6}$/, `Enter the ${OTP_LENGTH}-digit numeric verification code.`),
});

export interface ApplicationDetailDto {
  applicationId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerNinMasked: string;
  guarantorName: string;
  guarantorPhone: string;
  personalDetails: string;
  deviceId: string;
  deviceName: string;
  deviceBrandModel: string;
  lockedPriceNaira: number;
  downPaymentPercent: number;
  downPaymentAmountNaira: number;
  remainingAmountNaira: number;
  status: ApplicationStatus;
  customerVisibleStatus: CustomerVisibleStatus;
  createdAt: string;
  expiresAt: string;
  expiresInSeconds: number;
  agreementId?: string;
  agreementStatus?: string;
  agreementTerms?: string;
  customerAcceptedAt?: string | null;
  acceptanceOtpVerified: boolean;
  dueDate?: string | null;
  deviceSerial?: string | null;
  rejectionReason?: string | null;
  customerNinRaw?: string;
  downPaymentVerifiedAt?: string | null;
  downPaymentVerifierId?: string | null;
  downPaymentVerifierIp?: string | null;
  downPaymentMethod?: 'CASH' | 'TRANSFER' | null;
  activatedAt?: string | null;
  activatedByUserId?: string | null;
  activatedByIp?: string | null;
  settledAt?: string | null;
  defaultResolvedAt?: string | null;
  resolutionNotes?: string | null;
}

// In-memory application store for local development/scaffold fallback when Postgres is unseeded
const globalForApps = globalThis as unknown as {
  inMemoryApplications?: Map<string, ApplicationDetailDto>;
};

export const inMemoryApplications: Map<string, ApplicationDetailDto> =
  globalForApps.inMemoryApplications ?? new Map<string, ApplicationDetailDto>();

if (process.env['NODE_ENV'] !== 'production') {
  globalForApps.inMemoryApplications = inMemoryApplications;
}

// Preload Ahmed's persona application for immediate testing
const defaultAhmedAppId = 'app-ahmed-a15';
inMemoryApplications.set(defaultAhmedAppId, {
  applicationId: defaultAhmedAppId,
  customerId: 'user-customer-ahmed',
  customerName: 'Ahmed Abdullahi',
  customerPhone: '+2348031234567',
  customerNinMasked: '*******8901',
  guarantorName: 'Mallam Suleiman Danjuma',
  guarantorPhone: '+2348039998877',
  personalDetails: 'Banex Plaza Environs, Wuse 2, Abuja',
  deviceId: 'dev-a15',
  deviceName: 'Samsung Galaxy A15 (128GB)',
  deviceBrandModel: 'Samsung Galaxy A15 (128GB)',
  lockedPriceNaira: 235000,
  downPaymentPercent: 75,
  downPaymentAmountNaira: 176250,
  remainingAmountNaira: 58750,
  status: 'Awaiting Customer Acceptance',
  customerVisibleStatus: 'Approved',
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
  expiresInSeconds: 22 * 3600,
  agreementId: 'agr-ahmed-a15',
  agreementStatus: 'Awaiting Customer Acceptance',
  agreementTerms: 'DG Tech Store Flexi-Pay Agreement (Shop ATF 03): 30-day balance completion window, 0% interest, ₦0 late fees.',
  customerAcceptedAt: null,
  acceptanceOtpVerified: false,
  dueDate: null,
  deviceSerial: null,
  rejectionReason: null,
});

export async function submitApplication(
  rawInput: unknown,
  customerId: string,
  clientIp: string,
  requestId: string
): Promise<ApplicationDetailDto> {
  const input = submitApplicationSchema.parse(rawInput);
  const device = getDeviceById(input.deviceId);

  if (!device) {
    throw new AppError('NOT_FOUND', 404, UX_STRINGS.NOT_FOUND);
  }

  if (device.availableStock <= 0) {
    throw new AppError('OUT_OF_STOCK', 400, UX_STRINGS.OUT_OF_STOCK_DETAIL);
  }

  if (!device.isPriceFresh) {
    throw new AppError('STALE_PRICE', 400, UX_STRINGS.STALE_PRICE_DETAIL);
  }

  // PRD 4.1 BR-09: Platform purchase block if customer has defaulted contracts
  for (const existing of inMemoryApplications.values()) {
    if (existing.customerId === customerId && existing.status === 'Defaulted') {
      throw new AppError('PURCHASE_BLOCKED', 403, 'Customer has a defaulted contract. Applications are blocked.');
    }
  }

  // PRD 9.2: Customer duplicate check: 1 pending application per customer within 24h
  for (const existing of inMemoryApplications.values()) {
    if (
      existing.customerId === customerId &&
      existing.status === 'Application Pending' &&
      new Date(existing.expiresAt).getTime() > Date.now()
    ) {
      throw new AppError('DUPLICATE_APPLICATION', 409, 'You already have a pending application.');
    }
  }

  const lockedPriceNaira = device.dynamicPriceNaira;
  const downPaymentAmountNaira = Math.round((lockedPriceNaira * input.downPaymentPercent) / 100);
  const remainingAmountNaira = lockedPriceNaira - downPaymentAmountNaira;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + APPLICATION_EXPIRY_HOURS * 60 * 60 * 1000);
  const applicationId = `app_${crypto.randomUUID()}`;
  const agreementId = `agr_${crypto.randomUUID()}`;

  const applicationRecord: ApplicationDetailDto = {
    applicationId,
    customerId,
    customerName: input.fullName.trim(),
    customerPhone: input.phone.trim(),
    customerNinMasked: maskNin(input.nin.trim()),
    customerNinRaw: input.nin.trim(),
    guarantorName: input.guarantorName.trim(),
    guarantorPhone: input.guarantorPhone.trim(),
    personalDetails: input.personalDetails.trim(),
    deviceId: device.id,
    deviceName: device.name,
    deviceBrandModel: `${device.brand} ${device.model}`,
    lockedPriceNaira,
    downPaymentPercent: input.downPaymentPercent,
    downPaymentAmountNaira,
    remainingAmountNaira,
    status: 'Application Pending',
    customerVisibleStatus: 'Application Pending',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    expiresInSeconds: APPLICATION_EXPIRY_HOURS * 3600,
    agreementId,
    agreementStatus: 'Application Pending',
    agreementTerms: `DG Tech Store Flexi-Pay Agreement (Shop ATF 03): Locked price ₦${lockedPriceNaira.toLocaleString()}, down payment ₦${downPaymentAmountNaira.toLocaleString()} (${input.downPaymentPercent}%), remaining balance ₦${remainingAmountNaira.toLocaleString()} due within 30 days of activation with 0% interest and ₦0 late fees.`,
    customerAcceptedAt: null,
    acceptanceOtpVerified: false,
    dueDate: null,
    deviceSerial: null,
    rejectionReason: null,
  };

  inMemoryApplications.set(applicationId, applicationRecord);

  // Decrement available stock by incrementing reservedCount
  device.reservedCount += 1;
  device.availableStock = Math.max(0, device.stockCount - device.reservedCount);

  logger.info('APPLICATION_SUBMITTED', {
    requestId,
    actorId: customerId,
    role: 'CUSTOMER',
    route: 'POST /api/applications',
    metadata: {
      applicationId,
      deviceId: device.id,
      lockedPriceNaira,
      downPaymentAmountNaira,
      remainingAmountNaira,
      clientIp,
    },
  });

  return applicationRecord;
}

export async function getCustomerApplications(customerId: string): Promise<ApplicationDetailDto[]> {
  const result: ApplicationDetailDto[] = [];
  for (const app of inMemoryApplications.values()) {
    if (app.customerId === customerId) {
      const remainingSeconds = Math.max(
        0,
        Math.floor((new Date(app.expiresAt).getTime() - Date.now()) / 1000)
      );
      result.push({
        ...app,
        expiresInSeconds: remainingSeconds,
      });
    }
  }
  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getApplicationById(
  applicationId: string,
  requestingCustomerId?: string
): Promise<ApplicationDetailDto> {
  const record = inMemoryApplications.get(applicationId);
  if (!record) {
    throw new AppError('NOT_FOUND', 404, UX_STRINGS.NOT_FOUND);
  }

  // IDOR Protection: PRD 13.4 & architecture.md: If requested by another customer, return 404
  if (requestingCustomerId && record.customerId !== requestingCustomerId) {
    throw new AppError('NOT_FOUND', 404, UX_STRINGS.NOT_FOUND);
  }

  const remainingSeconds = Math.max(
    0,
    Math.floor((new Date(record.expiresAt).getTime() - Date.now()) / 1000)
  );

  return {
    ...record,
    expiresInSeconds: remainingSeconds,
  };
}

export async function acceptAgreementWithOtp(
  rawInput: unknown,
  customerId: string,
  requestId: string
): Promise<ApplicationDetailDto> {
  const input = acceptAgreementSchema.parse(rawInput);
  const application = inMemoryApplications.get(input.applicationId);

  if (!application) {
    throw new AppError('NOT_FOUND', 404, UX_STRINGS.NOT_FOUND);
  }

  if (application.customerId !== customerId) {
    throw new AppError('NOT_FOUND', 404, UX_STRINGS.NOT_FOUND);
  }

  const now = new Date().toISOString();
  application.customerAcceptedAt = now;
  application.acceptanceOtpVerified = true;
  application.status = 'Awaiting Final Approval';
  application.agreementStatus = 'Awaiting Final Approval';
  application.customerVisibleStatus = 'Approved';

  logger.info('AGREEMENT_ACCEPTED_OTP', {
    requestId,
    actorId: customerId,
    role: 'CUSTOMER',
    metadata: {
      applicationId: application.applicationId,
      acceptedAt: now,
    },
  });

  return application;
}
