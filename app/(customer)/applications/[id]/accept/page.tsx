'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';

import {
  BALANCE_WINDOW_DAYS,
  CONTRACT_INTEREST_RATE,
  CONTRACT_LATE_FEE_NAIRA,
  OTP_LENGTH,
  UX_STRINGS,
} from '@/lib/constants';

/**
 * Screen #12: Agreement Acceptance (`app/(customer)/applications/[id]/accept/page.tsx`).
 * Source:
 * - `.agents/rules/screen-inventory.md` Row #12 (Agreement Acceptance)
 * - `.agents/rules/functional-requirements.md` FR-06 (Accept with 6-digit SMS OTP)
 * - `.agents/rules/business-rules.md` BR-17 (Customer acceptance timestamp recorded)
 */

interface AcceptAgreementPageProps {
  params: {
    id: string;
  };
}

export default function AcceptAgreementPage({ params }: AcceptAgreementPageProps): ReactNode {
  const router = useRouter();
  const [otpCode, setOtpCode] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSendOtp(): Promise<void> {
    setFormError(null);
    setOtpNotice(null);
    try {
      const response = await fetch('/api/auth/accept-agreement-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ applicationId: params.id }),
      });

      const payload = (await response.json()) as {
        data?: { fallbackNotice?: string };
        error?: { message?: string };
      };

      if (!response.ok) {
        setFormError(payload.error?.message ?? UX_STRINGS.GENERIC_SERVER_ERROR);
        return;
      }

      setOtpNotice('6-digit SMS OTP sent to your registered mobile number. Valid for 10 minutes.');
    } catch {
      setFormError(UX_STRINGS.NETWORK_OFFLINE);
    }
  }

  function validateOtp(val: string): boolean {
    if (!/^\d{6}$/.test(val.trim())) {
      setOtpError(`Enter the ${OTP_LENGTH}-digit numeric verification code.`);
      return false;
    }
    setOtpError(null);
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);

    if (!termsAgreed) {
      setTermsError('You must check the box confirming you have read and agree to all contract terms.');
      return;
    }
    setTermsError(null);

    if (!validateOtp(otpCode)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/applications/${params.id}/accept-agreement`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ otpCode: otpCode.trim() }),
      });

      const payload = (await response.json()) as {
        data?: { applicationId?: string };
        error?: { message?: string };
      };

      if (!response.ok) {
        setFormError(payload.error?.message ?? UX_STRINGS.GENERIC_SERVER_ERROR);
        return;
      }

      router.push(`/applications/${params.id}`);
    } catch {
      setFormError(UX_STRINGS.NETWORK_OFFLINE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-form flex flex-col gap-section-sm">
      <div>
        <Link
          href={`/applications/${params.id}`}
          className="type-label-large text-primary underline underline-offset-4"
        >
          ← Back to Application Status
        </Link>
      </div>

      <article className="bg-surface-low border border-outline-variant rounded-card p-card-pad shadow-hard flex flex-col gap-card-gap">
        <header className="flex flex-col gap-gap-v-xs">
          <span className="bg-info-container text-info-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium self-start">
            Step 3 of 4: Agreement Acceptance
          </span>
          <h1 className="type-headline-medium text-surface-on">
            Execute Flexi-Pay Agreement (with SMS OTP)
          </h1>
          <p className="type-body-medium text-surface-on-variant">
            Please read the formal contract terms for Shop ATF 03 below. Per PRD Section 3.2 and FR-06, agreement acceptance is legally validated using a 6-digit SMS OTP.
          </p>
        </header>

        {/* Contract Terms Box */}
        <section aria-labelledby="contract-terms-heading" className="flex flex-col gap-gap-v-xs">
          <h2 id="contract-terms-heading" className="type-title-medium text-surface-on">
            Flexi-Pay Contract Terms &amp; Conditions
          </h2>
          <div className="bg-surface-container border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs type-body-small text-surface-on max-h-60 overflow-y-auto">
            <p><strong>1. Parties &amp; Physical Storefront:</strong> This agreement is between the Customer and DG Tech Store (Shop ATF 03, Abuja, Nigeria).</p>
            <p><strong>2. Down Payment &amp; Price Lock:</strong> The upfront down payment verified by Shop ATF 03 locks the dynamic Naira price for the duration of this plan.</p>
            <p><strong>3. Balance Completion Window:</strong> The remaining balance must be paid in full within {BALANCE_WINDOW_DAYS} calendar days of contract activation.</p>
            <p><strong>4. Commercial Terms:</strong> {CONTRACT_INTEREST_RATE}% interest rate. ₦{CONTRACT_LATE_FEE_NAIRA} late penalty fees. Partial payments are accepted anytime at Shop ATF 03 without extending the {BALANCE_WINDOW_DAYS}-day due date.</p>
            <p><strong>5. Overdue &amp; Default:</strong> If the remaining balance is not settled by 19:59 WAT on Day {BALANCE_WINDOW_DAYS}, the contract status transitions to Defaulted and a platform purchase block is applied.</p>
            <p><strong>6. Statutory Data Rights:</strong> Personal identity and transaction records are processed in compliance with the Nigeria Data Protection Act (NDPA).</p>
          </div>
        </section>

        {formError ? (
          <div
            role="alert"
            className="bg-error-container text-error-on-container rounded-card p-pad-sm type-body-medium"
          >
            {formError}
          </div>
        ) : null}

        {otpNotice ? (
          <div
            role="status"
            aria-live="polite"
            className="bg-info-container text-info-on-container rounded-card p-pad-sm type-body-small"
          >
            {otpNotice}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-gap-v-md">
          {/* Terms Attestation Checkbox */}
          <div className="flex flex-col gap-gap-v-xs">
            <label
              htmlFor="agree-terms"
              className="flex items-start gap-gap-h-sm type-body-medium text-surface-on"
            >
              <input
                id="agree-terms"
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => {
                  setTermsAgreed(e.target.checked);
                  if (e.target.checked) setTermsError(null);
                }}
                disabled={isSubmitting}
                className="mt-pad-xs"
              />
              <span>
                I have read, understood, and accept the DG Tech Store Flexi-Pay terms ({BALANCE_WINDOW_DAYS}-day balance window, 0% interest, ₦0 late fees).
              </span>
            </label>
            {termsError ? (
              <p role="alert" className="type-body-small text-error">
                {termsError}
              </p>
            ) : null}
          </div>

          {/* OTP Trigger and Input */}
          <div className="flex flex-col gap-gap-v-xs">
            <div className="flex items-center justify-between">
              <label htmlFor="accept-otp" className="type-label-large text-surface-on">
                6-Digit Acceptance OTP
              </label>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSubmitting}
                className="type-label-medium text-primary underline underline-offset-4"
              >
                Send SMS OTP
              </button>
            </div>
            <input
              id="accept-otp"
              name="otpCode"
              type="text"
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              placeholder="123456"
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value);
                if (otpError) validateOtp(e.target.value);
              }}
              onBlur={(e) => validateOtp(e.target.value)}
              aria-invalid={otpError ? 'true' : 'false'}
              aria-describedby={otpError ? 'accept-otp-error' : undefined}
              disabled={isSubmitting}
              className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-title-large"
            />
            {otpError ? (
              <p id="accept-otp-error" role="alert" className="type-body-small text-error">
                {otpError}
              </p>
            ) : null}
          </div>

          {/* Single Primary Action per screen-inventory.md Row #12 */}
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center"
          >
            {isSubmitting ? UX_STRINGS.SUBMITTING_LABEL : 'Accept Agreement with OTP'}
          </button>
        </form>

        <footer className="bg-info-container text-info-on-container rounded-card p-pad-sm type-body-small">
          {UX_STRINGS.OTP_TROUBLE_FALLBACK}
        </footer>
      </article>
    </div>
  );
}

