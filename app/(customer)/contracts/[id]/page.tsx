import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { PrintContractButton } from '@/app/(customer)/contracts/[id]/_components/print-contract-button';
import { BALANCE_WINDOW_DAYS, CONTRACT_INTEREST_RATE, CONTRACT_LATE_FEE_NAIRA } from '@/lib/constants';
import { getApplicationById } from '@/lib/services/application-service';

/**
 * Screen #11: Contract Detail (`app/(customer)/contracts/[id]/page.tsx`).
 * Source:
 * - `.agents/rules/screen-inventory.md` Row #11 (Contract Detail)
 * - `.agents/rules/business-rules.md` BR-03 (30-day window), BR-04 (0% interest, ₦0 fees)
 * - `.agents/rules/state-transitions.md` (#5 Active Flexi-Pay Contract)
 */

interface ContractDetailPageProps {
  params: {
    id: string;
  };
}

function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps): Promise<ReactNode> {
  let application;
  try {
    application = await getApplicationById(params.id, 'user-customer-ahmed');
  } catch {
    notFound();
  }

  const deviceSerial = application.deviceSerial ?? 'SN-ATF03-VERIFIED';

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
              Contract: {application.agreementId ?? `AGR-${application.applicationId}`}
            </span>
            <span className="bg-success-container text-success-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
              {application.status}
            </span>
          </div>

          <h1 className="type-headline-medium text-surface-on">{application.deviceName}</h1>
          <p className="type-body-medium text-surface-on-variant">
            Device Serial: <span className="font-mono text-surface-on">{deviceSerial}</span>
          </p>
        </header>

        {/* Financial Overview (Remaining Balance & 30-Day Window) */}
        <section aria-labelledby="balance-heading" className="flex flex-col gap-gap-v-sm">
          <h2 id="balance-heading" className="type-title-medium text-surface-on">
            Balance &amp; Completion Window
          </h2>
          <dl className="grid grid-cols-1 gap-gap-v-sm sm:grid-cols-3">
            <div className="bg-primary-container text-primary-on-container rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
              <dt className="type-label-medium">Remaining Balance</dt>
              <dd className="type-headline-small">{formatNaira(application.remainingAmountNaira)}</dd>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
              <dt className="type-label-medium text-surface-on-variant">Completion Window</dt>
              <dd className="type-headline-small text-surface-on">{BALANCE_WINDOW_DAYS} Days</dd>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
              <dt className="type-label-medium text-surface-on-variant">Interest &amp; Late Fees</dt>
              <dd className="type-headline-small text-surface-on">{CONTRACT_INTEREST_RATE}% / ₦{CONTRACT_LATE_FEE_NAIRA}</dd>
            </div>
          </dl>
        </section>

        {/* Agreement Document View */}
        <section aria-labelledby="terms-heading" className="flex flex-col gap-gap-v-xs">
          <h2 id="terms-heading" className="type-title-medium text-surface-on">
            Executed Agreement Terms
          </h2>
          <div className="bg-surface-container border border-outline-variant rounded-card p-pad-sm type-body-small text-surface-on font-mono">
            {application.agreementTerms ?? 'DG Tech Store Flexi-Pay Agreement Terms: Shop ATF 03.'}
          </div>
        </section>

        {/* Verified Payment History Table */}
        <section aria-labelledby="history-heading" className="flex flex-col gap-gap-v-xs">
          <h2 id="history-heading" className="type-title-medium text-surface-on">
            Verified Payment History
          </h2>
          <div className="bg-surface border border-outline-variant rounded-card overflow-x-auto">
            <table className="w-full text-left type-body-small">
              <thead className="bg-surface-high border-b border-outline-variant text-surface-on">
                <tr>
                  <th className="px-pad-sm py-pad-xs">Date</th>
                  <th className="px-pad-sm py-pad-xs">Transaction</th>
                  <th className="px-pad-sm py-pad-xs">Method</th>
                  <th className="px-pad-sm py-pad-xs">Amount</th>
                  <th className="px-pad-sm py-pad-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                <tr>
                  <td className="px-pad-sm py-pad-xs">
                    {new Date(application.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-pad-sm py-pad-xs">Initial Down Payment</td>
                  <td className="px-pad-sm py-pad-xs">Cash / Bank Transfer</td>
                  <td className="px-pad-sm py-pad-xs font-semibold">
                    {formatNaira(application.downPaymentAmountNaira)}
                  </td>
                  <td className="px-pad-sm py-pad-xs text-success">Verified</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Single Primary Action per screen-inventory.md Row #11 */}
        <footer className="border-t border-outline-variant pt-pad-md flex flex-col gap-gap-v-sm">
          <PrintContractButton />
          <p className="type-body-small text-surface-on-variant">
            To record a balance or settlement payment, please visit Shop ATF 03 in person.
          </p>
        </footer>
      </article>
    </div>
  );
}
