import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { PartPaymentCalculator } from '@/app/(public)/devices/[id]/_components/part-payment-calculator';
import { UX_STRINGS } from '@/lib/constants';
import { getDeviceById } from '@/lib/services/catalog-service';

/**
 * Screen #2: Device Detail (`app/(public)/devices/[id]/page.tsx`).
 * Source:
 * - `.agents/rules/screen-inventory.md` Row #2 (Device Detail)
 * - `.agents/rules/functional-requirements.md` FR-01 (Equal weight battery & price), FR-02 (Calculator), FR-12 (WhatsApp price confirm when out of stock / stale)
 * - `.agents/rules/ux-states.md` B.2 (Out of stock, stale price, and calculator disclaimer strings verbatim)
 */

interface DeviceDetailPageProps {
  params: {
    id: string;
  };
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export default function DeviceDetailPage({ params }: DeviceDetailPageProps): ReactNode {
  const device = getDeviceById(params.id);

  if (!device) {
    notFound();
  }

  const isOutOfStock = device.availableStock <= 0;
  const isStalePrice = !device.isPriceFresh;

  return (
    <div className="flex flex-col gap-section-sm">
      <div>
        <Link
          href="/"
          className="type-label-large text-primary underline underline-offset-4"
        >
          ← Back to Shop ATF 03 Inventory
        </Link>
      </div>

      <article className="bg-surface-low border border-outline-variant rounded-card p-card-pad shadow-hard flex flex-col gap-card-gap">
        <div className="flex flex-wrap items-center justify-between gap-gap-h-md">
          <span className="bg-secondary-container text-secondary-on-container rounded-chip px-pad-sm py-pad-xs type-label-medium uppercase">
            {device.brand} • {device.category} • {device.performanceTier} tier
          </span>

          {isOutOfStock ? (
            <span className="bg-error-container text-error-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
              {UX_STRINGS.OUT_OF_STOCK_LABEL}
            </span>
          ) : isStalePrice ? (
            <span className="bg-warning-container text-warning-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
              Price Confirmation Required
            </span>
          ) : (
            <span className="bg-success-container text-success-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
              {device.availableStock} available ({device.stockCount} total, {device.reservedCount} reserved)
            </span>
          )}
        </div>

        <header className="flex flex-col gap-gap-v-xs">
          <h1 className="type-headline-large text-surface-on">{device.name}</h1>
          <p className="type-body-large text-surface-on-variant">{device.keySpecsSummary}</p>
        </header>

        {/* FR-01: Battery life and price share identical font size (.type-headline-medium), weight, and prominence */}
        <dl className="grid grid-cols-1 gap-gap-v-md sm:grid-cols-2">
          <div className="bg-primary-container text-primary-on-container rounded-card p-card-pad flex flex-col gap-gap-v-xs">
            <dt className="type-label-large">Dynamic Price (Naira)</dt>
            <dd className="type-headline-medium">{formatNaira(device.dynamicPriceNaira)}</dd>
          </div>

          <div className="bg-tertiary-container text-tertiary-on-container rounded-card p-card-pad flex flex-col gap-gap-v-xs">
            <dt className="type-label-large">Verified Battery Endurance</dt>
            <dd className="type-headline-medium">{device.batteryLifeSpec}</dd>
          </div>
        </dl>

        {/* Verified Hardware Specifications */}
        <section aria-labelledby="specs-heading" className="flex flex-col gap-gap-v-sm">
          <h2 id="specs-heading" className="type-title-large text-surface-on">
            Verified Hardware Specifications
          </h2>
          <dl className="grid grid-cols-1 gap-gap-v-sm sm:grid-cols-2">
            {Object.entries(device.specifications).map(([label, value]) => (
              <div
                key={label}
                className="bg-surface-container border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs"
              >
                <dt className="type-label-medium text-surface-on-variant">{label}</dt>
                <dd className="type-body-medium text-surface-on">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Part-Payment Calculator (FR-02) */}
        <PartPaymentCalculator
          deviceId={device.id}
          deviceName={device.name}
          dynamicPriceNaira={device.dynamicPriceNaira}
        />

        {/* Single Primary Action per screen-inventory.md Row #2 & FR-12 */}
        <div className="border-t border-outline-variant pt-pad-md flex flex-col gap-gap-v-sm">
          {isOutOfStock ? (
            <div className="flex flex-col gap-gap-v-sm">
              <p role="status" className="type-body-large text-error">
                {UX_STRINGS.OUT_OF_STOCK_DETAIL}
              </p>
              <Link
                href={`/confirm-price/${device.id}`}
                className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center"
              >
                {UX_STRINGS.CONFIRM_PRICE_CTA}
              </Link>
            </div>
          ) : isStalePrice ? (
            <div className="flex flex-col gap-gap-v-sm">
              <p role="status" className="type-body-large text-warning">
                {UX_STRINGS.STALE_PRICE_DETAIL}
              </p>
              <Link
                href={`/confirm-price/${device.id}`}
                className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center"
              >
                {UX_STRINGS.CONFIRM_PRICE_CTA}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-gap-v-xs">
              <Link
                href={`/apply/${device.id}`}
                className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center"
              >
                Apply for Part-Payment
              </Link>
              <p className="type-body-small text-surface-on-variant">
                Submitting a valid application locks {formatNaira(device.dynamicPriceNaira)} and reserves 1 unit at Shop ATF 03 for 24 hours.
              </p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
