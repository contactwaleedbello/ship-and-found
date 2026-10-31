import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  BALANCE_WINDOW_DAYS,
  DOWN_PAYMENT_MAX_PERCENT,
  DOWN_PAYMENT_MIN_PERCENT,
  UX_STRINGS,
} from '@/lib/constants';
import { listDevices } from '@/lib/services/catalog-service';

/**
 * Screen #1: Home / Inventory Listing (`app/(public)/page.tsx`).
 * Source:
 * - `.agents/rules/screen-inventory.md` Row #1 (Home / Inventory Listing)
 * - `.agents/rules/functional-requirements.md` FR-01 (Battery life equal visual weight to price)
 * - `.agents/rules/ux-states.md` B.1 (Empty state verbatim string)
 * - `.agents/rules/accessibility-baseline.md` (Single h1, semantic <dl> for battery life & price)
 * - `Context files/design-system.md` & `styles/tokens/roles.css` (Zero hardcoded colors, fonts, or spacing)
 */

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

interface HomePageProps {
  searchParams?: {
    brand?: string;
    category?: string;
    performance_tier?: string;
    battery_life?: string;
  };
}

export default function HomeInventoryPage({ searchParams }: HomePageProps): ReactNode {
  const brand = searchParams?.brand?.trim() || undefined;
  const category = searchParams?.category?.trim() || undefined;
  const performanceTier = searchParams?.performance_tier?.trim() || undefined;
  const batteryLife = searchParams?.battery_life?.trim() || undefined;

  const devices = listDevices({
    ...(brand !== undefined ? { brand } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(performanceTier !== undefined ? { performance_tier: performanceTier } : {}),
    ...(batteryLife !== undefined ? { battery_life: batteryLife } : {}),
  });

  const hasActiveFilters = Boolean(brand || category || performanceTier || batteryLife);

  return (
    <div className="flex flex-col gap-section-sm">
      <section aria-labelledby="inventory-heading" className="flex flex-col gap-gap-v-sm">
        <h1 id="inventory-heading" className="type-headline-large text-surface-on">
          Verified Devices &amp; Flexi-Pay Inventory — Shop ATF 03
        </h1>
        <p className="type-body-large text-surface-on-variant">
          Every listing displays verified battery endurance and dynamic Naira price at equal prominence.
          Eligible devices support {DOWN_PAYMENT_MIN_PERCENT}%–{DOWN_PAYMENT_MAX_PERCENT}% down payment with a{' '}
          {BALANCE_WINDOW_DAYS}-day balance completion window (0% interest, ₦0 late fees).
        </p>
      </section>

      {/* Filter Bar per screen-inventory.md Row #1 (brand, category, performance_tier, battery_life) */}
      <section
        aria-label="Filter inventory"
        className="bg-surface-container border border-outline-variant rounded-card p-card-pad"
      >
        <form className="flex flex-col gap-gap-v-md" method="get" action="/">
          <div className="grid grid-cols-1 gap-gap-v-md sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-gap-v-xs">
              <label htmlFor="filter-brand" className="type-label-large text-surface-on">
                Brand
              </label>
              <select
                id="filter-brand"
                name="brand"
                defaultValue={brand ?? ''}
                className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
              >
                <option value="">All Brands</option>
                <option value="Samsung">Samsung</option>
                <option value="HP">HP</option>
                <option value="Lenovo">Lenovo</option>
                <option value="Dell">Dell</option>
                <option value="Apple">Apple</option>
              </select>
            </div>

            <div className="flex flex-col gap-gap-v-xs">
              <label htmlFor="filter-category" className="type-label-large text-surface-on">
                Category
              </label>
              <select
                id="filter-category"
                name="category"
                defaultValue={category ?? ''}
                className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
              >
                <option value="">All Categories</option>
                <option value="smartphone">Smartphone</option>
                <option value="laptop">Laptop</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>

            <div className="flex flex-col gap-gap-v-xs">
              <label htmlFor="filter-tier" className="type-label-large text-surface-on">
                Performance Tier
              </label>
              <select
                id="filter-tier"
                name="performance_tier"
                defaultValue={performanceTier ?? ''}
                className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
              >
                <option value="">All Tiers</option>
                <option value="entry">Entry</option>
                <option value="mid">Mid-Range</option>
                <option value="high">High Performance</option>
              </select>
            </div>

            <div className="flex flex-col gap-gap-v-xs">
              <label htmlFor="filter-battery" className="type-label-large text-surface-on">
                Minimum Battery Life
              </label>
              <select
                id="filter-battery"
                name="battery_life"
                defaultValue={batteryLife ?? ''}
                className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
              >
                <option value="">Any Battery Rating</option>
                <option value="10">10+ Hours</option>
                <option value="14">14+ Hours</option>
                <option value="18">18+ Hours</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-gap-h-md">
            <p className="type-body-medium text-surface-on-variant" aria-live="polite">
              Showing {devices.length} verified {devices.length === 1 ? 'device' : 'devices'} at Shop ATF 03
            </p>
            <div className="flex items-center gap-gap-h-sm">
              {hasActiveFilters ? (
                <Link
                  href="/"
                  className="bg-secondary-container text-secondary-on-container rounded-button px-btn-px py-btn-py type-label-large"
                >
                  Clear Filters
                </Link>
              ) : null}
              <button
                type="submit"
                className="bg-surface-high text-surface-on border border-outline rounded-button px-btn-px py-btn-py type-label-large"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Device Grid */}
      <section aria-label="Available devices">
        {devices.length === 0 ? (
          <div
            role="status"
            aria-live="polite"
            className="bg-surface-low border border-outline-variant rounded-card p-card-pad flex flex-col items-start gap-gap-v-sm"
          >
            <p className="type-body-large text-surface-on">{UX_STRINGS.EMPTY_INVENTORY}</p>
            <Link
              href="/"
              className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-card-gap md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => {
              const isOutOfStock = device.availableStock <= 0;
              const isStalePrice = !device.isPriceFresh;
              const isAvailableForApplication = !isOutOfStock && !isStalePrice;
              const minDownPayment = Math.round(
                (device.dynamicPriceNaira * DOWN_PAYMENT_MIN_PERCENT) / 100
              );

              return (
                <article
                  key={device.id}
                  className="bg-surface-low border border-outline-variant rounded-card p-card-pad shadow-hard flex flex-col justify-between gap-card-gap"
                >
                  <div className="flex flex-col gap-gap-v-sm">
                    <div className="flex items-center justify-between gap-gap-h-sm">
                      <span className="bg-secondary-container text-secondary-on-container rounded-chip px-pad-sm py-pad-xs type-label-medium uppercase">
                        {device.brand} • {device.category} • {device.performanceTier}
                      </span>

                      {isOutOfStock ? (
                        <span className="bg-error-container text-error-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
                          {UX_STRINGS.OUT_OF_STOCK_LABEL}
                        </span>
                      ) : isStalePrice ? (
                        <span className="bg-warning-container text-warning-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
                          Confirm Price
                        </span>
                      ) : (
                        <span className="bg-success-container text-success-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
                          {device.availableStock} in stock
                        </span>
                      )}
                    </div>

                    <h2 className="type-headline-small text-surface-on">{device.name}</h2>
                    <p className="type-body-medium text-surface-on-variant">
                      {device.keySpecsSummary}
                    </p>

                    {/* FR-01: Battery life and price share identical font size (.type-title-large), weight, and card prominence */}
                    <dl className="grid grid-cols-2 gap-gap-h-sm pt-pad-xs">
                      <div className="bg-primary-container text-primary-on-container rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
                        <dt className="type-label-medium">Dynamic Price</dt>
                        <dd className="type-title-large">{formatNaira(device.dynamicPriceNaira)}</dd>
                      </div>

                      <div className="bg-tertiary-container text-tertiary-on-container rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
                        <dt className="type-label-medium">Battery Endurance</dt>
                        <dd className="type-title-large">{device.batteryLifeSpec}</dd>
                      </div>
                    </dl>

                    <p className="type-body-small text-surface-on-variant">
                      Flexi-Pay from {formatNaira(minDownPayment)} ({DOWN_PAYMENT_MIN_PERCENT}% down)
                    </p>
                  </div>

                  {/* Single Primary Action per Card per screen-inventory.md Row #1 */}
                  <div className="pt-pad-xs">
                    <Link
                      href={`/devices/${device.id}`}
                      className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex w-full items-center justify-center"
                    >
                      {isAvailableForApplication
                        ? 'View Specs & Calculator'
                        : UX_STRINGS.CONFIRM_PRICE_CTA}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
