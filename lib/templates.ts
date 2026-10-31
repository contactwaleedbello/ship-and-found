import { SHOP_WHATSAPP_NUMBER } from '@/lib/constants';

/**
 * Verbatim SMS and manual WhatsApp message templates for DG Tech Store Version 1.
 * Source: PRD Appendix A, Section 9.3, Section 11, and `.agents/rules/message-templates.md`.
 * Plain text only. Do not reword, add emoji, or add WhatsApp markdown.
 */

export function formatNairaAmount(amountNaira: number): string {
  return `₦${Math.round(amountNaira).toLocaleString('en-NG')}`;
}

export function renderTemplateA1TMinus7(params: {
  customerName: string;
  deviceBrandModel: string;
  remainingAmountNaira: number;
  dueDateWat: string;
}): string {
  const amount = formatNairaAmount(params.remainingAmountNaira);
  return `Hello ${params.customerName.trim()}, this is DG Tech Store. Your balance for ${params.deviceBrandModel.trim()} is ${amount}. Due date is ${params.dueDateWat}. Visit Shop ATF 03 or call us to complete payment.`;
}

export function renderTemplateA1TMinus3(params: {
  customerName: string;
  deviceBrandModel: string;
  remainingAmountNaira: number;
  dueDateWat: string;
}): string {
  const amount = formatNairaAmount(params.remainingAmountNaira);
  return `Hello ${params.customerName.trim()}, this is DG Tech Store. Your balance of ${amount} for ${params.deviceBrandModel.trim()} is due in 3 days on ${params.dueDateWat}. Visit Shop ATF 03 or call us.`;
}

export function renderTemplateA1TMinus1(params: {
  customerName: string;
  deviceBrandModel: string;
  remainingAmountNaira: number;
  dueDateWat: string;
}): string {
  const amount = formatNairaAmount(params.remainingAmountNaira);
  return `Hello ${params.customerName.trim()}, this is DG Tech Store. Your balance of ${amount} for ${params.deviceBrandModel.trim()} is due tomorrow ${params.dueDateWat}. Visit Shop ATF 03 or call us.`;
}

export function renderTemplateA1TDue(params: {
  customerName: string;
  deviceBrandModel: string;
  remainingAmountNaira: number;
}): string {
  const amount = formatNairaAmount(params.remainingAmountNaira);
  return `Hello ${params.customerName.trim()}, this is DG Tech Store. Your balance of ${amount} for ${params.deviceBrandModel.trim()} is due today. Visit Shop ATF 03 or call us.`;
}

export function renderTemplateA1TPlus1(params: {
  customerName: string;
  deviceBrandModel: string;
  remainingAmountNaira: number;
}): string {
  const amount = formatNairaAmount(params.remainingAmountNaira);
  return `Hello ${params.customerName.trim()}, this is DG Tech Store. Your balance of ${amount} for ${params.deviceBrandModel.trim()} is now overdue. Your contract status will change to Defaulted. Please visit Shop ATF 03 or call us immediately.`;
}

export function renderTemplateA2ContractConfirmation(params: {
  customerName: string;
  deviceBrandModel: string;
  remainingAmountNaira: number;
  dueDateWat: string;
}): string {
  const amount = formatNairaAmount(params.remainingAmountNaira);
  return `Hello ${params.customerName.trim()}, your DG Tech Store contract is now active. Device: ${params.deviceBrandModel.trim()}. Remaining balance: ${amount}. Due date: ${params.dueDateWat}. 30-day window starts today. Visit Shop ATF 03 for any questions.`;
}

export function renderTemplateA3ConfirmCurrentPrice(params: {
  deviceBrandModel: string;
  customerName?: string | null;
}): string {
  const base = `Hi DG Tech Store, I want to confirm the current price for ${params.deviceBrandModel.trim()}.`;
  const trimmedName = params.customerName?.trim();
  if (trimmedName) {
    return `${base} My name is ${trimmedName}.`;
  }
  return base;
}

export const TEMPLATE_A4_AGREEMENT_ACCEPTANCE_PROMPT =
  'Your payment has been verified. Please read and accept your agreement to activate your contract.';

export const TEMPLATE_A5_PAYMENT_VERIFIED =
  'Payment verified. Accept your agreement to activate contract.';

export const TEMPLATE_A6_APPROVED_FOR_VERIFICATION =
  'Your application has been approved for payment verification. Please visit Shop ATF 03 to complete your down payment.';

export function renderOtpSmsBody(otpCode: string): string {
  return `DG Tech Store verification code: ${otpCode}. Valid for 10 minutes. Do not share this code with anyone.`;
}

export function buildWhatsAppDeepLink(
  message: string,
  recipientPhone: string = SHOP_WHATSAPP_NUMBER
): string {
  const digitsOnly = recipientPhone.replace(/\D/g, '');
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
