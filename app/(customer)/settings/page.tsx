'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { UX_STRINGS } from '@/lib/constants';

/**
 * Screen #13: Account Settings (`app/(customer)/settings/page.tsx`).
 * Source:
 * - `.agents/rules/screen-inventory.md` Row #13 (Account Settings)
 * - `.agents/rules/functional-requirements.md` FR-10 (Formal NDPA data deletion request)
 * - `.agents/rules/ndpa-compliance.md` (Consent tracking and legal retention restrictions)
 */

export default function AccountSettingsPage(): ReactNode {
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [deletionStatus, setDeletionStatus] = useState<string | null>(null);
  const [deletionError, setDeletionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDeleteRequest(): Promise<void> {
    setDeletionError(null);
    setDeletionStatus(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/customer/deletion-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });

      const payload = (await response.json()) as {
        data?: { requestId?: string; status?: string };
        error?: { message?: string };
      };

      if (!response.ok) {
        setDeletionError(payload.error?.message ?? UX_STRINGS.GENERIC_SERVER_ERROR);
        return;
      }

      setDeletionStatus(
        `Formal NDPA Data Deletion Request (${payload.data?.requestId}) submitted. It will be reviewed by the Store Owner.`
      );
    } catch {
      setDeletionError(UX_STRINGS.NETWORK_OFFLINE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-form flex flex-col gap-section-sm">
      <header className="flex flex-col gap-gap-v-xs">
        <h1 className="type-headline-large text-surface-on">Account Settings &amp; Privacy</h1>
        <p className="type-body-large text-surface-on-variant">
          Manage your personal profile, notification preferences, and statutory data rights under the Nigeria Data Protection Act (NDPA).
        </p>
      </header>

      {/* Customer Profile Summary */}
      <section aria-labelledby="profile-heading" className="bg-surface-low border border-outline-variant rounded-card p-card-pad shadow-hard flex flex-col gap-gap-v-sm">
        <h2 id="profile-heading" className="type-title-large text-surface-on">
          Personal Profile
        </h2>
        <dl className="grid grid-cols-1 gap-gap-v-xs sm:grid-cols-2">
          <div className="flex flex-col">
            <dt className="type-label-medium text-surface-on-variant">Full Legal Name</dt>
            <dd className="type-body-large text-surface-on">Ahmed Abdullahi</dd>
          </div>
          <div className="flex flex-col">
            <dt className="type-label-medium text-surface-on-variant">Mobile Phone Number</dt>
            <dd className="type-body-large text-surface-on">+2348031234567</dd>
          </div>
          <div className="flex flex-col">
            <dt className="type-label-medium text-surface-on-variant">National Identification Number (NIN)</dt>
            <dd className="type-body-large text-surface-on font-mono">*******8901</dd>
          </div>
          <div className="flex flex-col">
            <dt className="type-label-medium text-surface-on-variant">Verified Storefront</dt>
            <dd className="type-body-large text-surface-on">Shop ATF 03</dd>
          </div>
        </dl>
      </section>

      {/* Notification Preferences (ConsentRecord) */}
      <section aria-labelledby="consent-heading" className="bg-surface-low border border-outline-variant rounded-card p-card-pad shadow-hard flex flex-col gap-gap-v-sm">
        <h2 id="consent-heading" className="type-title-large text-surface-on">
          Notification Preferences
        </h2>
        <label htmlFor="pref-whatsapp" className="flex items-start gap-gap-h-sm type-body-medium text-surface-on">
          <input
            id="pref-whatsapp"
            type="checkbox"
            checked={whatsappConsent}
            onChange={(e) => setWhatsappConsent(e.target.checked)}
            className="mt-pad-xs"
          />
          <span>
            Receive manual WhatsApp balance reminders and approval updates from Shop ATF 03 store workers.
          </span>
        </label>
      </section>

      {/* NDPA Data Deletion Request (FR-10) */}
      <section aria-labelledby="ndpa-heading" className="bg-surface-low border border-outline-variant rounded-card p-card-pad shadow-hard flex flex-col gap-card-gap">
        <div className="flex flex-col gap-gap-v-xs">
          <h2 id="ndpa-heading" className="type-title-large text-surface-on">
            NDPA Right of Erasure (Data Deletion)
          </h2>
          <p className="type-body-medium text-surface-on-variant">
            Under Section 34 of the Nigeria Data Protection Act (NDPA), you may submit a formal request to erase your personal profile data. Note: Requests are legally rejected while an active contract or unpaid default is undergoing statutory retention.
          </p>
        </div>

        {deletionError ? (
          <div
            role="alert"
            className="bg-error-container text-error-on-container rounded-card p-pad-sm type-body-medium"
          >
            {deletionError}
          </div>
        ) : null}

        {deletionStatus ? (
          <div
            role="status"
            aria-live="polite"
            className="bg-success-container text-success-on-container rounded-card p-pad-sm type-body-medium"
          >
            {deletionStatus}
          </div>
        ) : null}

        {/* Single Primary Action per screen-inventory.md Row #13 */}
        <div>
          <button
            type="button"
            onClick={handleDeleteRequest}
            disabled={isSubmitting}
            className="bg-error text-error-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center"
          >
            {isSubmitting ? UX_STRINGS.SUBMITTING_LABEL : 'Submit Formal Deletion Request'}
          </button>
        </div>
      </section>

      <div>
        <Link href="/applications" className="type-label-large text-primary underline underline-offset-4">
          View My Applications
        </Link>
      </div>
    </div>
  );
}
