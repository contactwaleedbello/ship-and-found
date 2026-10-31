import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { UX_STRINGS } from '@/lib/constants';
import { getDeviceById } from '@/lib/services/catalog-service';
import {
  buildWhatsAppDeepLink,
  renderTemplateA3ConfirmCurrentPrice,
} from '@/lib/templates';

/**
 * Screen #7: Confirm Current Price via WhatsApp (`app/(public)/confirm-price/[deviceId]/page.tsx`).
 * Source:
 * - `.agents/rules/screen-inventory.md` Row #7 (Confirm Current Price via WhatsApp)
 * - `.agents/rules/functional-requirements.md` FR-12 (Out of stock or stale price blocked-checkout action)
 * - `.agents/rules/message-templates.md` Template A.3 verbatim
 * - `.agents/rules/ux-states.md` B.2 (Fallback string: "Call Shop ATF 03 or visit in person.")
 */

interface ConfirmPricePageProps {
  params: {
    deviceId: string;
  };
  searchParams?: {
    customerName?: string;
  };
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export default function ConfirmCurrentPricePage({
  params,
  searchParams,
}: ConfirmPricePageProps): ReactNode {
  const device = getDeviceById(params.deviceId);
  if (!device) {
    notFound();
  }

  const deviceBrandModel = `${device.brand} ${device.model}`;
  const prefilledMessage = renderTemplateA3ConfirmCurrentPrice({
    deviceBrandModel,
    customerName: searchParams?.customerName ?? null,
  });
  const whatsappUrl = buildWhatsAppDeepLink(prefilledMessage);
  const isOutOfStock = device.availableStock <= 0;

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
          <span className="bg-warning-container text-warning-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium self-start">
            {isOutOfStock ? UX_STRINGS.OUT_OF_STOCK_DETAIL : UX_STRINGS.STALE_PRICE_DETAIL}
          </span>
          <h1 className="type-headline-medium text-surface-on">
            {UX_STRINGS.CONFIRM_PRICE_CTA}
          </h1>
          <p className="type-body-medium text-surface-on-variant">
            Online part-payment checkout is paused for <strong>{device.name}</strong> (last listed at{' '}
            {formatNaira(device.dynamicPriceNaira)} · {device.batteryLifeSpec}). Confirm current stock and Naira pricing directly with Shop ATF 03.
          </p>
        </header>

        <div className="bg-surface-container border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
          <span className="type-label-medium text-surface-on-variant">
            Prefilled WhatsApp Message (Template A.3)
          </span>
          <p className="type-body-medium text-surface-on font-mono">{prefilledMessage}</p>
        </div>

        {/* Single Primary CTA per screen-inventory.md Row #7 */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center"
        >
          Open WhatsApp
        </a>

        {/* Verbatim Fallback per screen-inventory.md Row #7 & ux-states.md B.2 */}
        <footer className="bg-info-container text-info-on-container rounded-card p-pad-sm type-body-medium">
          {UX_STRINGS.CONFIRM_PRICE_FALLBACK}
        </footer>
      </section>
    </div>
  );
}
