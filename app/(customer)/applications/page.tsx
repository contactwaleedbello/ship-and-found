import Link from 'next/link';
import type { ReactNode } from 'react';

import { getCustomerApplications } from '@/lib/services/application-service';

/**
 * Screen #10: My Applications (`app/(customer)/applications/page.tsx`).
 * Source:
 * - `.agents/rules/screen-inventory.md` Row #10 (My Applications)
 * - `.agents/rules/ux-states.md` (List screen patterns)
 */

function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

export default async function MyApplicationsPage(): Promise<ReactNode> {
  const applications = await getCustomerApplications('user-customer-ahmed');

  return (
    <div className="flex flex-col gap-section-sm">
      <header className="flex flex-col gap-gap-v-xs">
        <h1 className="type-headline-large text-surface-on">My Flexi-Pay Applications</h1>
        <p className="type-body-large text-surface-on-variant">
          Track the status, price lock, and approval progress of your Shop ATF 03 part-payment applications.
        </p>
      </header>

      <section aria-label="Applications list">
        {applications.length === 0 ? (
          <div className="bg-surface-low border border-outline-variant rounded-card p-card-pad flex flex-col items-start gap-gap-v-sm">
            <p className="type-body-large text-surface-on">
              You do not have any part-payment applications yet.
            </p>
            <Link
              href="/"
              className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large"
            >
              Browse Inventory to Apply
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-card-gap md:grid-cols-2">
            {applications.map((app) => (
              <article
                key={app.applicationId}
                className="bg-surface-low border border-outline-variant rounded-card p-card-pad shadow-hard flex flex-col justify-between gap-card-gap"
              >
                <div className="flex flex-col gap-gap-v-sm">
                  <div className="flex items-center justify-between gap-gap-h-sm">
                    <span className="type-label-medium text-surface-on-variant font-mono">
                      Ref: {app.applicationId}
                    </span>
                    <span className="bg-secondary-container text-secondary-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
                      {app.status}
                    </span>
                  </div>

                  <h2 className="type-headline-small text-surface-on">{app.deviceName}</h2>

                  <dl className="grid grid-cols-2 gap-gap-h-sm">
                    <div className="bg-surface-container border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
                      <dt className="type-label-medium text-surface-on-variant">Locked Price</dt>
                      <dd className="type-title-large text-surface-on">{formatNaira(app.lockedPriceNaira)}</dd>
                    </div>
                    <div className="bg-surface-container border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
                      <dt className="type-label-medium text-surface-on-variant">Down Payment</dt>
                      <dd className="type-title-large text-surface-on">{formatNaira(app.downPaymentAmountNaira)}</dd>
                    </div>
                  </dl>

                  <p className="type-body-small text-surface-on-variant">
                    Submitted: {new Date(app.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>

                {/* Single Primary Action per screen-inventory.md Row #10 */}
                <div className="pt-pad-xs">
                  <Link
                    href={`/applications/${app.applicationId}`}
                    className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex w-full items-center justify-center"
                  >
                    Open Application Status
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

