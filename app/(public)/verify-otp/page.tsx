'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent, type ReactNode } from 'react';

import { NIGERIAN_PHONE_REGEX, OTP_LENGTH, UX_STRINGS } from '@/lib/constants';

/**
 * Screen #5: OTP Verification (`app/(public)/verify-otp/page.tsx`).
 * Source:
 * - `.agents/rules/screen-inventory.md` Row #5 (OTP Verification)
 * - `.agents/rules/ux-states.md` B.6 (Trouble receiving OTP in-person fallback note verbatim)
 */

function VerifyOtpForm(): ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get('phone') ?? '';
  const initialPurpose = searchParams.get('purpose') ?? 'REGISTRATION';

  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [otpCode, setOtpCode] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);
    setStatusMessage(null);

    const isPhoneOk = validatePhone(phoneNumber);
    const isOtpOk = validateOtp(otpCode);
    if (!isPhoneOk || !isOtpOk) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          otpCode: otpCode.trim(),
          purpose: initialPurpose,
        }),
      });

      const payload = (await response.json()) as {
        error?: { message?: string };
      };

      if (!response.ok) {
        setFormError(payload.error?.message ?? UX_STRINGS.GENERIC_SERVER_ERROR);
        return;
      }

      setStatusMessage('OTP verified. Redirecting to login...');
      router.push('/login');
    } catch {
      setFormError(UX_STRINGS.NETWORK_OFFLINE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="bg-surface-low border border-outline-variant rounded-card p-card-pad shadow-hard flex flex-col gap-card-gap">
      <header className="flex flex-col gap-gap-v-xs">
        <h1 className="type-headline-medium text-surface-on">Verify 6-Digit SMS OTP</h1>
        <p className="type-body-medium text-surface-on-variant">
          Enter the 6-digit verification code sent to your mobile number. Codes expire after 10 minutes (maximum 3 attempts).
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

      {statusMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="bg-success-container text-success-on-container rounded-card p-pad-sm type-body-medium"
        >
          {statusMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-gap-v-md">
        <div className="flex flex-col gap-gap-v-xs">
          <label htmlFor="otp-phone" className="type-label-large text-surface-on">
            Phone Number
          </label>
          <input
            id="otp-phone"
            name="phoneNumber"
            type="tel"
            placeholder="+2348031234567"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            onBlur={(event) => validatePhone(event.target.value)}
            aria-invalid={phoneError ? 'true' : 'false'}
            aria-describedby={phoneError ? 'otp-phone-error' : undefined}
            disabled={isSubmitting}
            className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
          />
          {phoneError ? (
            <p id="otp-phone-error" role="alert" className="type-body-small text-error">
              {phoneError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-gap-v-xs">
          <label htmlFor="otp-code" className="type-label-large text-surface-on">
            6-Digit Verification Code
          </label>
          <input
            id="otp-code"
            name="otpCode"
            type="text"
            inputMode="numeric"
            maxLength={OTP_LENGTH}
            placeholder="123456"
            value={otpCode}
            onChange={(event) => setOtpCode(event.target.value)}
            onBlur={(event) => validateOtp(event.target.value)}
            aria-invalid={otpError ? 'true' : 'false'}
            aria-describedby={otpError ? 'otp-code-error' : undefined}
            disabled={isSubmitting}
            className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-title-large"
          />
          {otpError ? (
            <p id="otp-code-error" role="alert" className="type-body-small text-error">
              {otpError}
            </p>
          ) : null}
        </div>

        {/* Single Primary CTA per screen-inventory.md Row #5 */}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center"
        >
          {isSubmitting ? UX_STRINGS.SUBMITTING_LABEL : 'Verify'}
        </button>
      </form>

      <div className="flex items-center justify-between gap-gap-h-md">
        <button
          type="button"
          onClick={() => setStatusMessage('A fresh 6-digit SMS OTP has been requested.')}
          className="type-label-large text-primary underline underline-offset-4"
        >
          Resend OTP
        </button>
        <Link href="/login" className="type-label-large text-surface-on-variant underline underline-offset-4">
          Back to Login
        </Link>
      </div>

      {/* Verbatim B.6 In-Person Fallback Note per ux-states.md */}
      <aside
        aria-label="In-person OTP verification fallback"
        className="bg-info-container text-info-on-container rounded-card p-pad-sm type-body-small"
      >
        {UX_STRINGS.OTP_TROUBLE_FALLBACK}
      </aside>
    </section>
  );
}

export default function VerifyOtpPage(): ReactNode {
  return (
    <div className="mx-auto max-w-form flex flex-col gap-section-sm">
      <Suspense
        fallback={
          <div className="bg-surface-low border border-outline-variant rounded-card p-card-pad type-body-medium text-surface-on-variant">
            Loading verification form...
          </div>
        }
      >
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}
