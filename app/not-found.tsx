import Link from 'next/link';
import type { ReactNode } from 'react';

import { UX_STRINGS } from '@/lib/constants';

/**
 * Global Not Found boundary (`app/not-found.tsx`).
 * Source: `.agents/rules/screen-inventory.md` & `.agents/rules/ux-states.md` (`"The page you are looking for does not exist."`).
 */
export default function NotFound(): ReactNode {
  return (
    <div className="mx-auto max-w-form flex flex-col gap-section-sm">
      <section className="bg-surface-low border border-outline-variant rounded-card p-card-pad shadow-hard flex flex-col items-start gap-card-gap">
        <h1 className="type-headline-medium text-surface-on">{UX_STRINGS.NOT_FOUND}</h1>
        <Link
          href="/"
          className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center"
        >
          Return to Shop ATF 03 Inventory
        </Link>
      </section>
    </div>
  );
}
