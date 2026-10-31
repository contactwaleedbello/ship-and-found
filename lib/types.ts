import type {
  APPLICATION_STATUSES,
  CUSTOMER_VISIBLE_STATUSES,
  USER_ROLES,
} from '@/lib/constants';

/**
 * Shared domain types and DTO interfaces.
 * Source: PRD Sections 3.2, 3.4, 5.1, 8.3 and `.agents/rules/state-transitions.md`, `.agents/rules/api-design.md`.
 */

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type CustomerVisibleStatus = (typeof CUSTOMER_VISIBLE_STATUSES)[number];
export type UserRole = (typeof USER_ROLES)[number];

export type DeviceCategory = 'smartphone' | 'laptop' | 'tablet';
export type PerformanceTier = 'entry' | 'mid' | 'high';

export interface DeviceCardDto {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: DeviceCategory;
  performanceTier: PerformanceTier;
  /** Battery endurance specification displayed at equal visual weight to dynamicPriceNaira (FR-01). */
  batteryLifeSpec: string;
  /** Numeric battery endurance hours used for filter evaluation. */
  batteryLifeHours: number;
  /** Base price in whole Naira before multiplier. */
  basePriceNaira: number;
  /** Dynamic price in whole Naira (Int), displayed at equal visual weight to batteryLifeSpec (FR-01). */
  dynamicPriceNaira: number;
  stockCount: number;
  reservedCount: number;
  availableStock: number;
  isPriceFresh: boolean;
  keySpecsSummary: string;
  specifications: Record<string, string>;
}

export interface CalculatorResultDto {
  deviceId: string;
  deviceName: string;
  lockedPriceEstimateNaira: number;
  downPaymentPercent: number;
  downPaymentAmountNaira: number;
  remainingBalanceNaira: number;
  completionWindowDays: number;
  interestRatePercent: number;
  lateFeesNaira: number;
  disclaimer: string;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
    requestId: string;
  };
}

export interface HealthResponseDto {
  status: 'ok' | 'degraded';
  shop: string;
  timestamp: string;
  requestId: string;
  checks: {
    app: 'ok';
    database: 'ok' | 'unconfigured' | 'unreachable';
    expiryCronHeartbeat: 'ok' | 'unconfigured' | 'stale';
    defaultCronHeartbeat: 'ok' | 'unconfigured' | 'stale';
  };
}

export type PaymentMethod = 'CASH' | 'TRANSFER';
export type PaymentType = 'DOWN_PAYMENT' | 'BALANCE' | 'SETTLEMENT';

export interface PaymentRecordDto {
  id: string;
  agreementId: string;
  amountNaira: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  recordedByUserId: string;
  recordedByName?: string | undefined;
  recordedAt: string;
  notes?: string | undefined;
}

export type ReminderType = 'T-7' | 'T-3' | 'T-1' | 'T-0' | 'T+1';

export interface WhatsAppReminderLogDto {
  id: string;
  agreementId: string;
  customerName: string;
  customerPhone: string;
  reminderType: ReminderType;
  channel: 'WHATSAPP';
  status: 'SENT' | 'FAILED';
  sentAt: string;
  loggedByUserId: string;
  loggedByName?: string | undefined;
}

export interface InventoryApprovalDto {
  id: string;
  deviceId: string;
  deviceName: string;
  proposedStockCount: number;
  currentStockCount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedByUserId: string;
  submittedByName?: string | undefined;
  submittedAt: string;
  decidedByUserId?: string | undefined;
  decidedAt?: string | undefined;
  decisionNotes?: string | undefined;
}

export interface AuditLogEntryDto {
  id: string;
  timestamp: string;
  action: string;
  actorId: string;
  actorRole: UserRole;
  targetId?: string | undefined;
  ipAddress?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface SuccessMetricsDto {
  totalAgreementsCount: number;
  activeAgreementsCount: number;
  completedAgreementsCount: number;
  defaultedAgreementsCount: number;
  defaultRatePercent: number;
  completionRatePercent: number;
  totalVolumeNaira: number;
  totalCollectedNaira: number;
  totalOutstandingNaira: number;
  averageTurnaroundHours: number;
  overdueCount: number;
}


