'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';

import { NIGERIAN_PHONE_REGEX, UX_STRINGS } from '@/lib/constants';

/**
 * Screen #3: Login (`app/(public)/login/page.tsx`).
 * Source:
 * - `.agents/rules/screen-inventory.md` Row #3 (Login)
 * - `.agents/rules/accessibility-baseline.md` (Forms: label association, on-blur validation, aria-invalid)
 * - `.agents/rules/ux-states.md` (Submitting state, exact error messages)
 */

export default function LoginPage(): ReactNode {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
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
    if (value.length < 1) {
      setPasswordError('Enter your password.');
      return false;
    }
    setPasswordError(null);
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);

    const isPhoneOk = validatePhone(phoneNumber);
    const isPasswordOk = validatePassword(password);
    if (!isPhoneOk || !isPasswordOk) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim(), password }),
      });

      const payload = (await response.json()) as {
        data?: { role?: string };
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

      router.push('/');
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
          <h1 className="type-headline-medium text-surface-on">Log in to DG Tech Store</h1>
          <p className="type-body-medium text-surface-on-variant">
            Sign in with your Nigerian mobile number and password to view or manage your Shop ATF 03 part-payment applications.
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
            <label htmlFor="login-phone" className="type-label-large text-surface-on">
              Phone Number
            </label>
            <input
              id="login-phone"
              name="phoneNumber"
              type="tel"
              autoComplete="tel"
              placeholder="+2348031234567 or 08031234567"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              onBlur={(event) => validatePhone(event.target.value)}
              aria-invalid={phoneError ? 'true' : 'false'}
              aria-describedby={phoneError ? 'login-phone-error' : undefined}
              disabled={isSubmitting}
              className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
            />
            {phoneError ? (
              <p id="login-phone-error" role="alert" className="type-body-small text-error">
                {phoneError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-gap-v-xs">
            <label htmlFor="login-password" className="type-label-large text-surface-on">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onBlur={(event) => validatePassword(event.target.value)}
              aria-invalid={passwordError ? 'true' : 'false'}
              aria-describedby={passwordError ? 'login-password-error' : undefined}
              disabled={isSubmitting}
              className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
            />
            {passwordError ? (
              <p id="login-password-error" role="alert" className="type-body-small text-error">
                {passwordError}
              </p>
            ) : null}
          </div>

          {/* Single Primary CTA per screen-inventory.md Row #3 */}
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center"
          >
            {isSubmitting ? UX_STRINGS.SUBMITTING_LABEL : 'Log in'}
          </button>
        </form>

        {/* Secondary links permitted by screen-inventory.md Row #3 Key Elements */}
        <footer className="border-t border-outline-variant pt-pad-sm flex flex-wrap items-center justify-between gap-gap-h-md">
          <Link href="/register" className="type-label-large text-primary underline underline-offset-4">
            Create customer account (Register)
          </Link>
          <Link
            href="/forgot-password"
            className="type-label-large text-surface-on-variant underline underline-offset-4"
          >
            Forgot Password?
          </Link>
        </footer>
      </section>
    </div>
  );
}
