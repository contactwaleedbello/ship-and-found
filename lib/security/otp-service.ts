import crypto from 'node:crypto';

/**
 * Cryptographic Email Verification & One-Time Password (OTP) Service.
 * Source: docs/verification-design.md
 * 
 * Invariants:
 * 1. Codes are generated using platform cryptographic random function (crypto.randomInt).
 * 2. Hard 10-minute validity window.
 * 3. Atomic consumption prevents replay attacks (defect DEF-T4-03).
 */

export interface OtpRecord {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
  consumedAt: number | null;
  createdAt: number;
}

const otpStore = new Map<string, OtpRecord>();

export const OTP_CONFIG = {
  CODE_LENGTH: 6,
  EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
  MAX_ATTEMPTS: 3,
};

export function generateVerificationCode(email: string): OtpRecord {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Platform cryptographic PRNG (prevents predictable Math.random() sequence attacks)
  const numericCode = crypto.randomInt(100000, 1000000).toString();
  const now = Date.now();

  const record: OtpRecord = {
    code: numericCode,
    email: normalizedEmail,
    expiresAt: now + OTP_CONFIG.EXPIRY_MS,
    attempts: 0,
    consumedAt: null,
    createdAt: now,
  };

  otpStore.set(normalizedEmail, record);
  return record;
}

export type VerifyResult = 
  | { status: 'SUCCESS'; message: string }
  | { status: 'EXPIRED'; message: string }
  | { status: 'INVALID_CODE'; message: string; remainingAttempts: number }
  | { status: 'ALREADY_USED'; message: string }
  | { status: 'MAX_ATTEMPTS_EXCEEDED'; message: string }
  | { status: 'NOT_FOUND'; message: string };

export function verifyCode(email: string, inputCode: string): VerifyResult {
  const normalizedEmail = email.toLowerCase().trim();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return { status: 'NOT_FOUND', message: 'No active verification code found for this email.' };
  }

  // 1. Replay check (Atomic single-use enforcement)
  if (record.consumedAt !== null) {
    return {
      status: 'ALREADY_USED',
      message: 'This verification code has already been consumed. Request a new code.',
    };
  }

  // 2. Expiry check
  if (Date.now() > record.expiresAt) {
    return {
      status: 'EXPIRED',
      message: 'Verification code has expired (10-minute window exceeded). Request a fresh code.',
    };
  }

  // 3. Brute force check
  if (record.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    return {
      status: 'MAX_ATTEMPTS_EXCEEDED',
      message: 'Maximum verification attempts exceeded. Code invalidated for security.',
    };
  }

  // 4. Equality check (constant-time comparison)
  const inputBuffer = Buffer.from(inputCode.trim());
  const targetBuffer = Buffer.from(record.code);

  const isMatch =
    inputBuffer.length === targetBuffer.length &&
    crypto.timingSafeEqual(inputBuffer, targetBuffer);

  if (!isMatch) {
    record.attempts += 1;
    const remaining = OTP_CONFIG.MAX_ATTEMPTS - record.attempts;
    return {
      status: 'INVALID_CODE',
      message: `Invalid verification code. ${remaining} attempt(s) remaining.`,
      remainingAttempts: remaining,
    };
  }

  // Success: mark consumed
  record.consumedAt = Date.now();
  return {
    status: 'SUCCESS',
    message: 'Email address successfully verified.',
  };
}

export function getOtpRecord(email: string): OtpRecord | undefined {
  return otpStore.get(email.toLowerCase().trim());
}
