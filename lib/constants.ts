/**
 * Business rule constants and status enumerations for DG Tech Store (Shop ATF 03).
 * Source: PRD Sections 3.3, 3.4, 4.1 (BR-01 through BR-20), Appendix B, and
 * `.agents/rules/business-rules.md`, `.agents/rules/state-transitions.md`, `.agents/rules/ux-states.md`.
 */

// BR-01: Valid application locks the device price and reserves 1 unit for 24 hours.
export const APPLICATION_EXPIRY_HOURS = 24;

// BR-02: Down payment must be between 70% and 80% of the locked price (inclusive).
export const DOWN_PAYMENT_MIN_PERCENT = 70;
export const DOWN_PAYMENT_MAX_PERCENT = 80;

// BR-03 & BR-04: Remaining balance must be completed within 30 calendar days (19:59 WAT on Day 30) with zero interest/fees.
export const BALANCE_WINDOW_DAYS = 30;
export const CONTRACT_INTEREST_RATE = 0;
export const CONTRACT_LATE_FEE_NAIRA = 0;

// BR-05: Price freshness window defaults to 24 hours unless updated in Settings.
export const DEFAULT_PRICE_FRESHNESS_HOURS = 24;

// FR-03 & BR-19: NIN must be exactly 11 numeric digits.
export const NIN_REGEX = /^\d{11}$/;

// FR-03: Nigerian mobile phone format (+234XXXXXXXXXX or 0XXXXXXXXXX).
export const NIGERIAN_PHONE_REGEX = /^(?:\+234|0)[789][01]\d{8}$/;

// PRD 9.3: Password reset locks part-payment application submission and agreement acceptance for 24 hours.
export const PASSWORD_RESET_LOCK_HOURS = 24;

// PRD 9.3: OTP is 6 numeric digits, valid for 10 minutes, max 3 failed verification attempts.
export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 3;

// Shop ATF 03 outbound WhatsApp recipient number (international digits without '+' for wa.me links).
export const SHOP_WHATSAPP_NUMBER = '2348090000303';
export const SHOP_NAME = 'DG Tech Store (Shop ATF 03)';

// PRD 3.4 & .agents/rules/state-transitions.md: 10 internal application & contract statuses.
export const APPLICATION_STATUSES = [
  'Application Pending',
  'Awaiting Down Payment Verification',
  'Awaiting Customer Acceptance',
  'Awaiting Final Approval',
  'Active Flexi-Pay Contract',
  'Completed',
  'Defaulted',
  'Resolved',
  'Rejected',
  'Expired',
] as const;

// PRD 3.4: 7 customer-visible status badges.
export const CUSTOMER_VISIBLE_STATUSES = [
  'Application Pending',
  'Approved',
  'Active Flexi-Pay Contract',
  'Completed',
  'Defaulted',
  'Rejected',
  'Expired',
] as const;

// PRD 10 & .agents/rules/permission-matrix.md: Platform roles.
export const USER_ROLES = [
  'VISITOR',
  'CUSTOMER',
  'STORE_WORKER',
  'OWNER',
  'CO_OWNER',
] as const;

// PRD Appendix B & .agents/rules/ux-states.md: Canonical UI and API strings verbatim.
export const UX_STRINGS = {
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to view this page.',
  NOT_FOUND: 'The page you are looking for does not exist.',
  NETWORK_OFFLINE: 'Could not connect. Check your connection and try again.',
  GENERIC_SERVER_ERROR: 'Something went wrong on our end. Try again.',
  SUBMITTING_LABEL: 'Submitting...',
  RATE_LIMITED: 'Too many requests. Wait a moment and try again.',
  EMPTY_INVENTORY: 'No devices match your filters. Clear filters to see all devices.',
  LOAD_INVENTORY_ERROR: 'Could not load devices. Check connection and try again.',
  OUT_OF_STOCK_LABEL: 'Out of Stock',
  OUT_OF_STOCK_DETAIL: 'Out of Stock. Confirm Current Price via WhatsApp.',
  STALE_PRICE_DETAIL: 'Price may have changed. Confirm Current Price via WhatsApp.',
  CALCULATOR_DISCLAIMER: 'This is an estimate. Final amount is validated at application submission.',
  LOAD_DEVICE_ERROR: 'Could not load device. Refresh to try again.',
  CONFIRM_PRICE_CTA: 'Confirm Current Price via WhatsApp',
  CONFIRM_PRICE_FALLBACK: 'Call Shop ATF 03 or visit in person.',
  NIN_INVALID: 'NIN must be exactly 11 numeric digits.',
  PHONE_INVALID: 'Enter a valid Nigerian phone number.',
  OVERPAYMENT_BLOCKED: 'Amount exceeds remaining balance.',
  SAME_USER_FINAL_APPROVAL: 'Final approval must be by a different user than the verifier.',
  OTP_TROUBLE_FALLBACK: 'Trouble receiving OTP? Visit Shop ATF 03 for in-person verification.',
  OTP_EXPIRED: 'OTP expired. Request a new one.',
  OTP_LOCKOUT: 'Too many incorrect OTP attempts. Request a new OTP.',
} as const;
