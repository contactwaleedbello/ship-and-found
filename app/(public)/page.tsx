import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  BALANCE_WINDOW_DAYS,
  DOWN_PAYMENT_MAX_PERCENT,
  DOWN_PAYMENT_MIN_PERCENT,
  UX_STRINGS,
} from '@/lib/constants';
import type { DeviceCardDto } from '@/lib/types';

/**
 * Screen #1: Home / Inventory Listing (`app/(public)/page.tsx`) — Phase 1 Proof-of-Concept Scaffold.
 * Source:
 * - `.agents/rules/screen-inventory.md` Row #1 (Home / Inventory Listing)
 * - `.agents/rules/functional-requirements.md` FR-01 (Battery life equal visual weight to price)
 * - `.agents/rules/accessibility-baseline.md` (Single h1, semantic <dl> for battery life & price)
 * - `docs/design-system.md` & `styles/tokens/roles.css` (Zero hardcoded colors, fonts, or spacing)
 */

const PHASE_1_PREVIEW_DEVICES: readonly DeviceCardDto[] = [
  {
    id: 'dev-samsung-a55',
    name: 'Samsung Galaxy A55 5G (256GB)',
    brand: 'Samsung',
    category: 'smartphone',
    performanceTier: 'mid',
    batteryLifeSpec: '19 hrs / 5,000 mAh',
    dynamicPriceNaira: 485000,
    availableStock: 4,
    isPriceFresh: true,
    keySpecsSummary: '8GB RAM • 256GB Storage • 6.6" Super AMOLED 120Hz',
  },
  {
    id: 'dev-hp-elitebook-840',
    name: 'HP EliteBook 840 G8 (Core i7, 16GB)',
    brand: 'HP',
    category: 'laptop',
    performanceTier: 'high',
    batteryLifeSpec: '11 hrs / 53 Wh',
    dynamicPriceNaira: 620000,
    availableStock: 2,
    isPriceFresh: true,
    keySpecsSummary: 'Intel Core i7-1165G7 • 16GB RAM • 512GB NVMe SSD • 14" FHD',
  },
  {
    id: 'dev-lenovo-tab-m11',
    name: 'Lenovo Tab M11 LTE (128GB)',
    brand: 'Lenovo',
    category: 'tablet',
    performanceTier: 'entry',
    batteryLifeSpec: '15 hrs / 7,040 mAh',
    dynamicPriceNaira: 260000,
    availableStock: 0,
    isPriceFresh: true,
    keySpecsSummary: '4GB RAM • 128GB Storage • 11" 90Hz Display • 4G LTE',
  },
];

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export default function HomeInventoryPage(): ReactNode {
  return (
    <div className="flex flex-col gap-section-sm">
      <section aria-labelledby="inventory-heading" className="flex flex-col gap-gap-v-sm">
        <h1 id="inventory-heading" className="type-headline-large text-surface-on">
          Verified Devices &amp; Flexi-Pay Inventory — Shop ATF 03
        </h1>
        <p className="type-body-large text-surface-on-variant">
          Every listing displays verified battery endurance and dynamic Naira price at equal prominence.
          Eligible devices support {DOWN_PAYMENT_MIN_PERCENT}%–{DOWN_PAYMENT_MAX_PERCENT}% down payment with a{' '}
          {BALANCE_WINDOW_DAYS}-day balance completion window.
        </p>
      </section>

      {/* Filter Bar per screen-inventory.md Row #1 (brand, category, performance_tier, battery_life) */}
      <section
        aria-label="Filter inventory"
        className="bg-surface-container border border-outline-variant rounded-card p-card-pad"
      >
        <form className="grid grid-cols-1 gap-gap-v-md sm:grid-cols-2 lg:grid-cols-4" method="get">
          <div className="flex flex-col gap-gap-v-xs">
            <label htmlFor="filter-brand" className="type-label-large text-surface-on">
              Brand
            </label>
            <select
              id="filter-brand"
              name="brand"
              defaultValue=""
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
              defaultValue=""
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
              defaultValue=""
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
              defaultValue=""
              className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-medium"
            >
              <option value="">Any Battery Rating</option>
              <option value="10">10+ Hours</option>
              <option value="15">15+ Hours</option>
              <option value="18">18+ Hours</option>
            </select>
          </div>
        </form>
      </section>

      {/* Device Grid */}
      <section aria-label="Available devices">
        {PHASE_1_PREVIEW_DEVICES.length === 0 ? (
          <div
            role="status"
            className="bg-surface-low border border-outline-variant rounded-card p-card-pad text-surface-on-variant type-body-large"
          >
            {UX_STRINGS.EMPTY_INVENTORY}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-card-gap md:grid-cols-2 lg:grid-cols-3">
            {PHASE_1_PREVIEW_DEVICES.map((device) => {
              const isAvailable = device.availableStock > 0 && device.isPriceFresh;
              const minDownPayment = Math.round(
                (device.dynamicPriceNaira * DOWN_PAYMENT_MIN_PERCENT) / 100,
              );

              return (
                <article
                  key={device.id}
                  className="bg-surface-low border border-outline-variant rounded-card p-card-pad shadow-hard flex flex-col justify-between gap-card-gap"
                >
                  <div className="flex flex-col gap-gap-v-sm">
                    <div className="flex items-center justify-between gap-gap-h-sm">
                      <span className="bg-secondary-container text-secondary-on-container rounded-chip px-pad-sm py-pad-xs type-label-medium uppercase">
                        {device.brand} • {device.category}
                      </span>

                      {isAvailable ? (
                        <span className="bg-success-container text-success-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
                          {device.availableStock} in stock
                        </span>
                      ) : (
                        <span className="bg-error-container text-error-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
                          {UX_STRINGS.OUT_OF_STOCK_LABEL}
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
                      {isAvailable ? 'View Specs & Calculator' : UX_STRINGS.CONFIRM_PRICE_CTA}
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

