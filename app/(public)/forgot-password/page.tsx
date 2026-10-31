'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';

import {
  NIGERIAN_PHONE_REGEX,
  OTP_LENGTH,
  PASSWORD_RESET_LOCK_HOURS,
  UX_STRINGS,
} from '@/lib/constants';

/**
 * Screen #6: Forgot Password (`app/(public)/forgot-password/page.tsx`).
 * Source:
 * - `.agents/rules/screen-inventory.md` Row #6 (Forgot Password)
 * - `.agents/rules/security-baseline.md` (Password reset applies 24-hour security hold)
 */

export default function ForgotPasswordPage(): ReactNode {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [otpTriggeredMessage, setOtpTriggeredMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validatePhone(value: string): boolean {
    if (!NIGERIAN_PHONE_REGEX.test(value.trim())) {
      setPhoneError(UX_STRINGS.PHONE_INVALID);
      return false;
    }
    setPhoneError(null);
    return true;
  }

  function validateOtp(value: string): boolean {
    if (!/^\d{6}$/.test(value.trim())) {
      setOtpError(`Enter the ${OTP_LENGTH}-digit numeric verification code.`);
      return false;
    }
    setOtpError(null);
    return true;
  }

  function validateNewPassword(value: string): boolean {
    if (value.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return false;
    }
    setPasswordError(null);
    return true;
  }

  async function handleSendOtp(): Promise<void> {
    setFormError(null);
    setOtpTriggeredMessage(null);
    if (!validatePhone(phoneNumber)) {
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });

      const payload = (await response.json()) as {
        data?: { securityNotice?: string };
        error?: { message?: string };
      };

      if (!response.ok) {
        setFormError(payload.error?.message ?? UX_STRINGS.GENERIC_SERVER_ERROR);
        return;
      }

      setOtpTriggeredMessage(
        payload.data?.securityNotice ??
          '6-digit password reset OTP sent. Valid for 10 minutes.'
      );
    } catch {
      setFormError(UX_STRINGS.NETWORK_OFFLINE);
    }
  }

  async function handleResetSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);

    const isPhoneOk = validatePhone(phoneNumber);
    const isOtpOk = validateOtp(otpCode);
    const isPasswordOk = validateNewPassword(newPassword);

    if (!isPhoneOk || !isOtpOk || !isPasswordOk) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          otpCode: otpCode.trim(),
          newPassword,
        }),
      });

      const payload = (await response.json()) as {
        error?: { message?: string };
      };

      if (!response.ok) {
        setFormError(payload.error?.message ?? UX_STRINGS.GENERIC_SERVER_ERROR);
        return;
      }

      router.push('/login');
    } catch {
      setFormError(UX_STRINGS.NETWORK_OFFLINE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-form flex flex-col gap-section-sm">
      <section className="bg-surface-low border border-outline-variant rounded-card p-card-pad shadow-hard flex flex-col gap-card-gap">
        <header className="flex flex-col gap-gap-v-xs">
          <h1 className="type-headline-medium text-surface-on">Reset Password via OTP</h1>
          <p className="type-body-medium text-surface-on-variant">
            Recover your account with a 6-digit SMS OTP. For security, resetting your password applies a{' '}
            {PASSWORD_RESET_LOCK_HOURS}-hour hold on new part-payment applications and agreement acceptances.
          </p>
        </header>

        {formError ? (
          <div
            role="alert"
            className="bg-error-container text-error-on-container rounded-card p-pad-sm type-body-medium"
          >
            {formError}
          </div>
        ) : null}

        {otpTriggeredMessage ? (
          <div
            role="status"
            aria-live="polite"
            className="bg-warning-container text-warning-on-container rounded-card p-pad-sm type-body-small"
          >
            {otpTriggeredMessage}
          </div>
        ) : null}

        <form onSubmit={handleResetSubmit} noValidate className="flex flex-col gap-gap-v-md">
          <div className="flex flex-col gap-gap-v-xs">
            <label htmlFor="reset-phone" className="type-label-large text-surface-on">
              Phone Number
            </label>
            <div className="flex flex-wrap items-center gap-gap-h-sm">
              <input
                id="reset-phone"
                name="phoneNumber"
                type="tel"
                placeholder="+2348031234567"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                onBlur={(event) => validatePhone(event.target.value)}
                aria-invalid={phoneError ? 'true' : 'false'}
                aria-describedby={phoneError ? 'reset-phone-error' : undefined}
                disabled={isSubmitting}
                className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium flex-1"
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSubmitting}
                className="bg-secondary-container text-secondary-on-container rounded-button px-btn-px py-btn-py type-label-large"
              >
                Send OTP
              </button>
            </div>
            {phoneError ? (
              <p id="reset-phone-error" role="alert" className="type-body-small text-error">
                {phoneError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-gap-v-xs">
            <label htmlFor="reset-otp" className="type-label-large text-surface-on">
              6-Digit OTP Code
            </label>
            <input
              id="reset-otp"
              name="otpCode"
              type="text"
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              placeholder="123456"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value)}
              onBlur={(event) => validateOtp(event.target.value)}
              aria-invalid={otpError ? 'true' : 'false'}
              aria-describedby={otpError ? 'reset-otp-error' : undefined}
              disabled={isSubmitting}
              className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-title-large"
            />
            {otpError ? (
              <p id="reset-otp-error" role="alert" className="type-body-small text-error">
                {otpError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-gap-v-xs">
            <label htmlFor="reset-new-password" className="type-label-large text-surface-on">
              New Password (minimum 8 characters)
            </label>
            <input
              id="reset-new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              onBlur={(event) => validateNewPassword(event.target.value)}
              aria-invalid={passwordError ? 'true' : 'false'}
              aria-describedby={passwordError ? 'reset-password-error' : undefined}
              disabled={isSubmitting}
              className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
            />
            {passwordError ? (
              <p id="reset-password-error" role="alert" className="type-body-small text-error">
                {passwordError}
              </p>
            ) : null}
          </div>

          {/* Single Primary CTA per screen-inventory.md Row #6 */}
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center"
          >
            {isSubmitting ? UX_STRINGS.SUBMITTING_LABEL : 'Reset'}
          </button>
        </form>

        <footer className="border-t border-outline-variant pt-pad-sm flex items-center justify-between gap-gap-h-md">
          <Link href="/login" className="type-label-large text-primary underline underline-offset-4">
            Back to Log in
          </Link>
          <span className="type-body-small text-surface-on-variant">
            {UX_STRINGS.OTP_TROUBLE_FALLBACK}
          </span>
        </footer>
      </section>
    </div>
  );
}
