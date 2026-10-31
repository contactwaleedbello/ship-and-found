'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';

import {
  BALANCE_WINDOW_DAYS,
  DOWN_PAYMENT_MAX_PERCENT,
  DOWN_PAYMENT_MIN_PERCENT,
  NIGERIAN_PHONE_REGEX,
  NIN_REGEX,
  UX_STRINGS,
} from '@/lib/constants';
import { getDeviceById } from '@/lib/services/catalog-service';

/**
 * Screen #8: Apply for Part-Payment (`app/(customer)/apply/[deviceId]/page.tsx`).
 * Source:
 * - `.agents/rules/screen-inventory.md` Row #8 (Apply for Part-Payment)
 * - `.agents/rules/functional-requirements.md` FR-03 (Inline validation, No OTP at submission)
 * - `.agents/rules/business-rules.md` BR-01, BR-02 (70%–80% down payment), BR-03 (30-day window)
 * - `.agents/rules/ux-states.md` B.3 (Exact error strings)
 */

interface ApplyPageProps {
  params: {
    deviceId: string;
  };
}

function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

export default function ApplyForPartPaymentPage({ params }: ApplyPageProps): ReactNode {
  const router = useRouter();
  const device = getDeviceById(params.deviceId);

  const [fullName, setFullName] = useState('Ahmed Abdullahi');
  const [nin, setNin] = useState('');
  const [phone, setPhone] = useState('+2348031234567');
  const [guarantorName, setGuarantorName] = useState('Mallam Suleiman Danjuma');
  const [guarantorPhone, setGuarantorPhone] = useState('+2348039998877');
  const [personalDetails, setPersonalDetails] = useState('Banex Plaza Environs, Wuse 2, Abuja');
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(75);

  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [ninError, setNinError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [guarantorNameError, setGuarantorNameError] = useState<string | null>(null);
  const [guarantorPhoneError, setGuarantorPhoneError] = useState<string | null>(null);
  const [personalDetailsError, setPersonalDetailsError] = useState<string | null>(null);
  const [downPaymentError, setDownPaymentError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!device) {
    return (
      <div className="mx-auto max-w-form flex flex-col gap-section-sm">
        <section className="bg-surface-low border border-outline-variant rounded-card p-card-pad shadow-hard flex flex-col gap-gap-v-sm">
          <h1 className="type-headline-medium text-surface-on">{UX_STRINGS.NOT_FOUND}</h1>
          <Link href="/" className="type-label-large text-primary underline underline-offset-4">
            Return to Inventory
          </Link>
        </section>
      </div>
    );
  }

  const lockedPrice = device.dynamicPriceNaira;
  const downPaymentAmount = Math.round((lockedPrice * downPaymentPercent) / 100);
  const remainingBalance = lockedPrice - downPaymentAmount;

  function validateFullName(val: string): boolean {
    if (val.trim().length < 2) {
      setFullNameError('Enter your full legal name as it appears on your NIN.');
      return false;
    }
    setFullNameError(null);
    return true;
  }

  function validateNin(val: string): boolean {
    if (!NIN_REGEX.test(val.trim())) {
      setNinError(UX_STRINGS.NIN_INVALID);
      return false;
    }
    setNinError(null);
    return true;
  }

  function validatePhone(val: string): boolean {
    if (!NIGERIAN_PHONE_REGEX.test(val.trim())) {
      setPhoneError(UX_STRINGS.PHONE_INVALID);
      return false;
    }
    setPhoneError(null);
    return true;
  }

  function validateGuarantorName(val: string): boolean {
    if (val.trim().length < 2) {
      setGuarantorNameError('Enter guarantor full name.');
      return false;
    }
    setGuarantorNameError(null);
    return true;
  }

  function validateGuarantorPhone(val: string): boolean {
    if (!NIGERIAN_PHONE_REGEX.test(val.trim())) {
      setGuarantorPhoneError('Enter a valid Nigerian phone number for your guarantor.');
      return false;
    }
    setGuarantorPhoneError(null);
    return true;
  }

  function validatePersonalDetails(val: string): boolean {
    if (val.trim().length < 5) {
      setPersonalDetailsError('Provide your current residential address in Nigeria.');
      return false;
    }
    setPersonalDetailsError(null);
    return true;
  }

  function validateDownPayment(pct: number): boolean {
    if (pct < DOWN_PAYMENT_MIN_PERCENT || pct > DOWN_PAYMENT_MAX_PERCENT) {
      setDownPaymentError(
        `Down payment must be between ${DOWN_PAYMENT_MIN_PERCENT}% and ${DOWN_PAYMENT_MAX_PERCENT}% of the locked price.`
      );
      return false;
    }
    setDownPaymentError(null);
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!device) return;
    setFormError(null);

    const isNameOk = validateFullName(fullName);
    const isNinOk = validateNin(nin);
    const isPhoneOk = validatePhone(phone);
    const isGNameOk = validateGuarantorName(guarantorName);
    const isGPhoneOk = validateGuarantorPhone(guarantorPhone);
    const isDetailsOk = validatePersonalDetails(personalDetails);
    const isDownPaymentOk = validateDownPayment(downPaymentPercent);

    if (
      !isNameOk ||
      !isNinOk ||
      !isPhoneOk ||
      !isGNameOk ||
      !isGPhoneOk ||
      !isDetailsOk ||
      !isDownPaymentOk
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          deviceId: device.id,
          fullName: fullName.trim(),
          nin: nin.trim(),
          phone: phone.trim(),
          guarantorName: guarantorName.trim(),
          guarantorPhone: guarantorPhone.trim(),
          personalDetails: personalDetails.trim(),
          downPaymentPercent,
        }),
      });

      const payload = (await response.json()) as {
        data?: { applicationId?: string };
        error?: { message?: string; fields?: Record<string, string[]> };
      };

      if (!response.ok) {
        if (payload.error?.fields?.['nin']?.[0]) {
          setNinError(payload.error.fields['nin'][0]);
        }
        if (payload.error?.fields?.['phone']?.[0]) {
          setPhoneError(payload.error.fields['phone'][0]);
        }
        setFormError(payload.error?.message ?? UX_STRINGS.GENERIC_SERVER_ERROR);
        return;
      }

      const targetId = payload.data?.applicationId ?? 'app-latest';
      router.push(`/applications/${targetId}`);
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
          href={`/devices/${device.id}`}
          className="type-label-large text-primary underline underline-offset-4"
        >
          ← Back to {device.name}
        </Link>
      </div>

      <section className="bg-surface-low border border-outline-variant rounded-card p-card-pad shadow-hard flex flex-col gap-card-gap">
        <header className="flex flex-col gap-gap-v-xs">
          <span className="bg-secondary-container text-secondary-on-container rounded-chip px-pad-sm py-pad-xs type-label-medium uppercase self-start">
            {device.brand} • {device.category}
          </span>
          <h1 className="type-headline-medium text-surface-on">
            Apply for Part-Payment (Flexi-Pay)
          </h1>
          <p className="type-body-medium text-surface-on-variant">
            Submit your personal details and 11-digit NIN to reserve <strong>{device.name}</strong> and lock your dynamic Naira price for 24 hours. (No OTP required at submission).
          </p>
        </header>

        {/* FR-01: Equal visual weight for dynamic price and battery endurance */}
        <dl className="grid grid-cols-2 gap-gap-h-sm">
          <div className="bg-primary-container text-primary-on-container rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
            <dt className="type-label-medium">Locked Price</dt>
            <dd className="type-title-large">{formatNaira(lockedPrice)}</dd>
          </div>
          <div className="bg-tertiary-container text-tertiary-on-container rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
            <dt className="type-label-medium">Battery Endurance</dt>
            <dd className="type-title-large">{device.batteryLifeSpec}</dd>
          </div>
        </dl>

        {formError ? (
          <div
            role="alert"
            className="bg-error-container text-error-on-container rounded-card p-pad-sm type-body-medium"
          >
            {formError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-gap-v-md">
          {/* Section 1: Customer Details */}
          <fieldset className="flex flex-col gap-gap-v-sm border-t border-outline-variant pt-pad-sm">
            <legend className="type-title-medium text-surface-on mb-pad-xs">
              1. Customer Identity &amp; Contact
            </legend>

            <div className="flex flex-col gap-gap-v-xs">
              <label htmlFor="apply-name" className="type-label-large text-surface-on">
                Full Legal Name (as registered with NIMC)
              </label>
              <input
                id="apply-name"
                name="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={(e) => validateFullName(e.target.value)}
                aria-invalid={fullNameError ? 'true' : 'false'}
                aria-describedby={fullNameError ? 'apply-name-error' : undefined}
                disabled={isSubmitting}
                className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
              />
              {fullNameError ? (
                <p id="apply-name-error" role="alert" className="type-body-small text-error">
                  {fullNameError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-gap-v-xs">
              <label htmlFor="apply-nin" className="type-label-large text-surface-on">
                11-Digit National Identification Number (NIN)
              </label>
              <input
                id="apply-nin"
                name="nin"
                type="text"
                inputMode="numeric"
                maxLength={11}
                placeholder="12345678901"
                value={nin}
                onChange={(e) => setNin(e.target.value)}
                onBlur={(e) => validateNin(e.target.value)}
                aria-invalid={ninError ? 'true' : 'false'}
                aria-describedby={ninError ? 'apply-nin-error' : undefined}
                disabled={isSubmitting}
                className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium font-mono"
              />
              {ninError ? (
                <p id="apply-nin-error" role="alert" className="type-body-small text-error">
                  {ninError}
                </p>
              ) : (
                <p className="type-body-small text-surface-on-variant">
                  Encrypted at rest with AES-256-GCM under NDPA Section 37.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-gap-v-xs">
              <label htmlFor="apply-phone" className="type-label-large text-surface-on">
                Nigerian Mobile Phone Number
              </label>
              <input
                id="apply-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={(e) => validatePhone(e.target.value)}
                aria-invalid={phoneError ? 'true' : 'false'}
                aria-describedby={phoneError ? 'apply-phone-error' : undefined}
                disabled={isSubmitting}
                className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
              />
              {phoneError ? (
                <p id="apply-phone-error" role="alert" className="type-body-small text-error">
                  {phoneError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-gap-v-xs">
              <label htmlFor="apply-details" className="type-label-large text-surface-on">
                Residential Address in Abuja / Nigeria
              </label>
              <textarea
                id="apply-details"
                name="personalDetails"
                rows={2}
                value={personalDetails}
                onChange={(e) => setPersonalDetails(e.target.value)}
                onBlur={(e) => validatePersonalDetails(e.target.value)}
                aria-invalid={personalDetailsError ? 'true' : 'false'}
                aria-describedby={personalDetailsError ? 'apply-details-error' : undefined}
                disabled={isSubmitting}
                className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
              />
              {personalDetailsError ? (
                <p id="apply-details-error" role="alert" className="type-body-small text-error">
                  {personalDetailsError}
                </p>
              ) : null}
            </div>
          </fieldset>

          {/* Section 2: Guarantor Details */}
          <fieldset className="flex flex-col gap-gap-v-sm border-t border-outline-variant pt-pad-sm">
            <legend className="type-title-medium text-surface-on mb-pad-xs">
              2. Guarantor Reference
            </legend>

            <div className="flex flex-col gap-gap-v-xs">
              <label htmlFor="apply-gname" className="type-label-large text-surface-on">
                Guarantor Full Legal Name
              </label>
              <input
                id="apply-gname"
                name="guarantorName"
                type="text"
                value={guarantorName}
                onChange={(e) => setGuarantorName(e.target.value)}
                onBlur={(e) => validateGuarantorName(e.target.value)}
                aria-invalid={guarantorNameError ? 'true' : 'false'}
                aria-describedby={guarantorNameError ? 'apply-gname-error' : undefined}
                disabled={isSubmitting}
                className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
              />
              {guarantorNameError ? (
                <p id="apply-gname-error" role="alert" className="type-body-small text-error">
                  {guarantorNameError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-gap-v-xs">
              <label htmlFor="apply-gphone" className="type-label-large text-surface-on">
                Guarantor Nigerian Phone Number
              </label>
              <input
                id="apply-gphone"
                name="guarantorPhone"
                type="tel"
                value={guarantorPhone}
                onChange={(e) => setGuarantorPhone(e.target.value)}
                onBlur={(e) => validateGuarantorPhone(e.target.value)}
                aria-invalid={guarantorPhoneError ? 'true' : 'false'}
                aria-describedby={guarantorPhoneError ? 'apply-gphone-error' : undefined}
                disabled={isSubmitting}
                className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
              />
              {guarantorPhoneError ? (
                <p id="apply-gphone-error" role="alert" className="type-body-small text-error">
                  {guarantorPhoneError}
                </p>
              ) : null}
            </div>
          </fieldset>

          {/* Section 3: Down-Payment Selection */}
          <fieldset className="flex flex-col gap-gap-v-sm border-t border-outline-variant pt-pad-sm">
            <legend className="type-title-medium text-surface-on mb-pad-xs">
              3. Down-Payment Selection ({DOWN_PAYMENT_MIN_PERCENT}%–{DOWN_PAYMENT_MAX_PERCENT}%)
            </legend>

            <div className="flex flex-col gap-gap-v-xs">
              <label htmlFor="apply-down-pct" className="type-label-large text-surface-on">
                Down-Payment Percentage
              </label>
              <div className="flex flex-wrap items-center gap-gap-h-md">
                <input
                  id="apply-down-pct"
                  name="downPaymentPercent"
                  type="number"
                  min={DOWN_PAYMENT_MIN_PERCENT}
                  max={DOWN_PAYMENT_MAX_PERCENT}
                  step={1}
                  value={downPaymentPercent}
                  onChange={(e) => {
                    const parsed = Number.parseFloat(e.target.value);
                    setDownPaymentPercent(parsed);
                    if (downPaymentError) validateDownPayment(parsed);
                  }}
                  onBlur={(e) => validateDownPayment(Number.parseFloat(e.target.value))}
                  aria-invalid={downPaymentError ? 'true' : 'false'}
                  aria-describedby={downPaymentError ? 'apply-down-error' : undefined}
                  disabled={isSubmitting}
                  className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
                />
                <div className="flex items-center gap-gap-h-xs">
                  {[70, 75, 80].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setDownPaymentPercent(preset);
                        setDownPaymentError(null);
                      }}
                      className="bg-secondary-container text-secondary-on-container rounded-chip px-pad-sm py-pad-xs type-label-medium"
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>
              {downPaymentError ? (
                <p id="apply-down-error" role="alert" className="type-body-small text-error">
                  {downPaymentError}
                </p>
              ) : null}
            </div>

            <dl className="grid grid-cols-2 gap-gap-h-sm pt-pad-xs">
              <div className="bg-surface-container border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
                <dt className="type-label-medium text-surface-on-variant">Upfront Down Payment</dt>
                <dd className="type-title-large text-surface-on">{formatNaira(downPaymentAmount)}</dd>
              </div>
              <div className="bg-surface-container border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
                <dt className="type-label-medium text-surface-on-variant">Remaining Balance ({BALANCE_WINDOW_DAYS} Days)</dt>
                <dd className="type-title-large text-surface-on">{formatNaira(remainingBalance)}</dd>
              </div>
            </dl>
          </fieldset>

          {/* Single Primary Action per screen-inventory.md Row #8 */}
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center"
          >
            {isSubmitting ? UX_STRINGS.SUBMITTING_LABEL : 'Submit Part-Payment Application'}
          </button>
        </form>

        <footer className="bg-info-container text-info-on-container rounded-card p-pad-sm type-body-small">
          Submitting a valid application locks {formatNaira(lockedPrice)} and reserves 1 unit at Shop ATF 03 for 24 hours. Your application will be reviewed by the Store Owner.
        </footer>
      </section>
    </div>
  );
}
