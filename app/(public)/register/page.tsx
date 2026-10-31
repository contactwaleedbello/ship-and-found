'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';

import { NIGERIAN_PHONE_REGEX, UX_STRINGS } from '@/lib/constants';

/**
 * Screen #4: Register (`app/(public)/register/page.tsx`).
 * Source:
 * - `.agents/rules/screen-inventory.md` Row #4 (Register)
 * - `.agents/rules/ndpa-compliance.md` (Consent checkboxes for Terms & WhatsApp)
 * - `.agents/rules/ux-states.md` (Inline validation on blur, Submitting state)
 */

export default function RegisterPage(): ReactNode {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(true);

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
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

  function validatePassword(value: string): boolean {
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return false;
    }
    setPasswordError(null);
    return true;
  }

  function validateTerms(checked: boolean): boolean {
    if (!checked) {
      setTermsError('You must accept the Flexi-Pay Terms to register.');
      return false;
    }
    setTermsError(null);
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);

    const isPhoneOk = validatePhone(phoneNumber);
    const isPasswordOk = validatePassword(password);
    const isTermsOk = validateTerms(termsAccepted);

    if (!isPhoneOk || !isPasswordOk || !isTermsOk) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          password,
          termsAccepted: true,
          whatsappConsent,
        }),
      });

      const payload = (await response.json()) as {
        data?: { phoneNumber?: string };
        error?: { message?: string; fields?: Record<string, string[]> };
      };

      if (!response.ok) {
        if (payload.error?.fields?.['phoneNumber']?.[0]) {
          setPhoneError(payload.error.fields['phoneNumber'][0]);
        }
        if (payload.error?.fields?.['password']?.[0]) {
          setPasswordError(payload.error.fields['password'][0]);
        }
        setFormError(payload.error?.message ?? UX_STRINGS.GENERIC_SERVER_ERROR);
        return;
      }

      const targetPhone = encodeURIComponent(payload.data?.phoneNumber ?? phoneNumber.trim());
      router.push(`/verify-otp?phone=${targetPhone}&purpose=REGISTRATION`);
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
          <h1 className="type-headline-medium text-surface-on">Create Customer Account</h1>
          <p className="type-body-medium text-surface-on-variant">
            Register with your Nigerian mobile number. We will send a 6-digit SMS verification code to activate your Shop ATF 03 account.
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

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-gap-v-md">
          <div className="flex flex-col gap-gap-v-xs">
            <label htmlFor="register-phone" className="type-label-large text-surface-on">
              Nigerian Phone Number
            </label>
            <input
              id="register-phone"
              name="phoneNumber"
              type="tel"
              autoComplete="tel"
              placeholder="+2348031234567 or 08031234567"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              onBlur={(event) => validatePhone(event.target.value)}
              aria-invalid={phoneError ? 'true' : 'false'}
              aria-describedby={phoneError ? 'register-phone-error' : undefined}
              disabled={isSubmitting}
              className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
            />
            {phoneError ? (
              <p id="register-phone-error" role="alert" className="type-body-small text-error">
                {phoneError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-gap-v-xs">
            <label htmlFor="register-password" className="type-label-large text-surface-on">
              Password (minimum 8 characters)
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onBlur={(event) => validatePassword(event.target.value)}
              aria-invalid={passwordError ? 'true' : 'false'}
              aria-describedby={passwordError ? 'register-password-error' : undefined}
              disabled={isSubmitting}
              className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
            />
            {passwordError ? (
              <p id="register-password-error" role="alert" className="type-body-small text-error">
                {passwordError}
              </p>
            ) : null}
          </div>

          {/* Consent Checkboxes per screen-inventory.md Row #4 */}
          <div className="bg-surface-container border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-sm">
            <label
              htmlFor="consent-terms"
              className="flex items-start gap-gap-h-sm type-body-medium text-surface-on"
            >
              <input
                id="consent-terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => {
                  setTermsAccepted(event.target.checked);
                  validateTerms(event.target.checked);
                }}
                disabled={isSubmitting}
                className="mt-pad-xs"
              />
              <span>
                I accept the DG Tech Store (Shop ATF 03) Flexi-Pay Terms and NDPA Data Processing Policy (70%–80% down payment, 30-day balance window, 0% interest).
              </span>
            </label>
            {termsError ? (
              <p role="alert" className="type-body-small text-error">
                {termsError}
              </p>
            ) : null}

            <label
              htmlFor="consent-whatsapp"
              className="flex items-start gap-gap-h-sm type-body-medium text-surface-on"
            >
              <input
                id="consent-whatsapp"
                type="checkbox"
                checked={whatsappConsent}
                onChange={(event) => setWhatsappConsent(event.target.checked)}
                disabled={isSubmitting}
                className="mt-pad-xs"
              />
              <span>
                I consent to receive contract status and balance reminders from Shop ATF 03 via WhatsApp.
              </span>
            </label>
          </div>

          {/* Single Primary CTA per screen-inventory.md Row #4 */}
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center"
          >
            {isSubmitting ? UX_STRINGS.SUBMITTING_LABEL : 'Register'}
          </button>
        </form>

        <footer className="border-t border-outline-variant pt-pad-sm">
          <Link href="/login" className="type-label-large text-primary underline underline-offset-4">
            Already have an account? Log in
          </Link>
        </footer>
      </section>
    </div>
  );
}
