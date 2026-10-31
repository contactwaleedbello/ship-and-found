import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { getApplicationById } from '@/lib/services/application-service';

/**
 * Screen #9: Application Status (`app/(customer)/applications/[id]/page.tsx`).
 * Source:
 * - `.agents/rules/screen-inventory.md` Row #9 (Application Status)
 * - `.agents/rules/ux-states.md` B.4 (Status badge copy and countdown timer)
 * - `.agents/rules/functional-requirements.md` FR-03, FR-06
 */

interface ApplicationStatusPageProps {
  params: {
    id: string;
  };
}

function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

export default async function ApplicationStatusPage({
  params,
}: ApplicationStatusPageProps): Promise<ReactNode> {
  let application;
  try {
    application = await getApplicationById(params.id, 'user-customer-ahmed');
  } catch {
    notFound();
  }

  const hoursRemaining = Math.floor(application.expiresInSeconds / 3600);
  const minutesRemaining = Math.floor((application.expiresInSeconds % 3600) / 60);

  const isPending = application.status === 'Application Pending';
  const isAwaitingVerification = application.status === 'Awaiting Down Payment Verification';
  const isAwaitingAcceptance = application.status === 'Awaiting Customer Acceptance';
  const isAwaitingFinalApproval = application.status === 'Awaiting Final Approval';
  const isActive = application.status === 'Active Flexi-Pay Contract';
  const isRejected = application.status === 'Rejected';
  const isExpired = application.status === 'Expired';

  return (
    <div className="mx-auto max-w-form flex flex-col gap-section-sm">
      <div>
        <Link href="/applications" className="type-label-large text-primary underline underline-offset-4">
          ← Back to My Applications
        </Link>
      </div>

      <article className="bg-surface-low border border-outline-variant rounded-card p-card-pad shadow-hard flex flex-col gap-card-gap">
        <header className="flex flex-col gap-gap-v-xs">
          <div className="flex flex-wrap items-center justify-between gap-gap-h-md">
            <span className="type-label-medium text-surface-on-variant font-mono">
              Ref: {application.applicationId}
            </span>

            {/* Status badge per ux-states.md B.4 */}
            {isPending ? (
              <span className="bg-warning-container text-warning-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
                Application Pending
              </span>
            ) : isAwaitingVerification ? (
              <span className="bg-info-container text-info-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
                Awaiting Down Payment Verification
              </span>
            ) : isAwaitingAcceptance ? (
              <span className="bg-success-container text-success-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
                Approved (Accept with OTP)
              </span>
            ) : isAwaitingFinalApproval ? (
              <span className="bg-info-container text-info-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
                Awaiting Final Store Approval
              </span>
            ) : isActive ? (
              <span className="bg-success-container text-success-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
                Active Flexi-Pay Contract
              </span>
            ) : isRejected ? (
              <span className="bg-error-container text-error-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
                Rejected
              </span>
            ) : isExpired ? (
              <span className="bg-error-container text-error-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
                Expired
              </span>
            ) : (
              <span className="bg-surface-high text-surface-on rounded-badge px-pad-sm py-pad-xs type-label-medium">
                {application.status}
              </span>
            )}
          </div>

          <h1 className="type-headline-medium text-surface-on">
            {application.deviceName}
          </h1>
          <p className="type-body-medium text-surface-on-variant">
            Part-Payment Application submitted on{' '}
            {new Date(application.createdAt).toLocaleDateString('en-GB')}
          </p>
        </header>

        {/* 24-hour Reservation Expiry Countdown when pending (ux-states.md B.4) */}
        {isPending ? (
          <aside
            aria-label="Reservation countdown"
            className="bg-primary-container text-primary-on-container rounded-card p-pad-sm flex flex-col gap-gap-v-xs"
          >
            <span className="type-label-medium">24-Hour Price &amp; Stock Reservation Timer</span>
            <p className="type-title-large">
              {hoursRemaining}h {minutesRemaining}m remaining
            </p>
            <p className="type-body-small">
              Your device unit is reserved at Shop ATF 03 until{' '}
              {new Date(application.expiresAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.
            </p>
          </aside>
        ) : null}

        {/* Rejection reason when rejected */}
        {isRejected ? (
          <aside
            role="alert"
            className="bg-error-container text-error-on-container rounded-card p-pad-sm flex flex-col gap-gap-v-xs"
          >
            <span className="type-label-medium">Rejection Reason</span>
            <p className="type-body-medium">
              {application.rejectionReason ?? 'Application details could not be verified by Store Owner.'}
            </p>
          </aside>
        ) : null}

        {/* Application Summary */}
        <section aria-labelledby="app-summary-heading" className="flex flex-col gap-gap-v-sm">
          <h2 id="app-summary-heading" className="type-title-medium text-surface-on">
            Application Terms
          </h2>
          <dl className="grid grid-cols-2 gap-gap-h-sm">
            <div className="bg-surface-container border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
              <dt className="type-label-medium text-surface-on-variant">Locked Price</dt>
              <dd className="type-title-large text-surface-on">
                {formatNaira(application.lockedPriceNaira)}
              </dd>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
              <dt className="type-label-medium text-surface-on-variant">
                Down Payment ({application.downPaymentPercent}%)
              </dt>
              <dd className="type-title-large text-surface-on">
                {formatNaira(application.downPaymentAmountNaira)}
              </dd>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
              <dt className="type-label-medium text-surface-on-variant">Remaining Balance</dt>
              <dd className="type-title-large text-surface-on">
                {formatNaira(application.remainingAmountNaira)}
              </dd>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
              <dt className="type-label-medium text-surface-on-variant">Customer Identity</dt>
              <dd className="type-body-medium text-surface-on">
                {application.customerName} (NIN: {application.customerNinMasked})
              </dd>
            </div>
          </dl>
        </section>

        {/* Next Step / Single Primary Action per screen-inventory.md Row #9 */}
        <footer className="border-t border-outline-variant pt-pad-md flex flex-col gap-gap-v-sm">
          {isAwaitingAcceptance ? (
            <div className="flex flex-col gap-gap-v-sm">
              <p className="type-body-medium text-success">
                Your down payment has been verified by Shop ATF 03. Please read and accept your agreement with OTP to activate your contract.
              </p>
              <Link
                href={`/applications/${application.applicationId}/accept`}
                className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center"
              >
                Accept Agreement with OTP
              </Link>
            </div>
          ) : isActive ? (
            <Link
              href={`/contracts/${application.applicationId}`}
              className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center"
            >
              View Active Contract &amp; Payment History
            </Link>
          ) : isAwaitingVerification ? (
            <div className="bg-info-container text-info-on-container rounded-card p-pad-sm type-body-medium">
              Please visit Shop ATF 03 with your cash or bank transfer down payment ({formatNaira(application.downPaymentAmountNaira)}) for Worker verification.
            </div>
          ) : isPending ? (
            <div className="bg-surface-container text-surface-on rounded-card p-pad-sm type-body-medium">
              Under Store Owner review. You will receive an SMS and WhatsApp notification once approved for payment verification.
            </div>
          ) : (
            <Link
              href="/"
              className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center"
            >
              Browse Devices to Reapply
            </Link>
          )}
        </footer>
      </article>
    </div>
  );
}
