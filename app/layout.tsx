import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import './globals.css';

/**
 * Root Server Component Layout.
 * Source: PRD Section 3.1, `.agents/rules/accessibility-baseline.md`, `docs/design-system.md`.
 * Uses exclusively Task 1 design tokens from `styles/tokens/roles.css`.
 */

export const metadata: Metadata = {
  title: 'DG Tech Store — Shop ATF 03 | Real-Time Inventory & Flexi-Pay',
  description:
    'Browse verified smartphone, laptop, and tablet inventory at Shop ATF 03 with equal-weight battery life and dynamic Naira pricing, plus 30-day Flexi-Pay part-payment plans.',
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): ReactNode {
  return (
    <html lang="en" data-theme="light">
      <body className="bg-surface text-surface-on type-body-medium flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:inline-block bg-primary text-primary-on px-btn-px py-btn-py rounded-button type-label-large"
        >
          Skip to main content
        </a>

        <header className="bg-surface-container border-b border-outline-variant px-layout-margin">
          <div className="mx-auto flex h-app-bar max-w-7xl items-center justify-between gap-gap-h-md">
            <div className="flex items-center gap-gap-h-sm">
              <Link
                href="/"
                className="type-title-large text-surface-on rounded-chip px-pad-xs py-pad-xs"
              >
                DG Tech Store
              </Link>
              <span className="bg-secondary-container text-secondary-on-container rounded-badge px-pad-sm py-pad-xs type-label-medium">
                Shop ATF 03
              </span>
            </div>

            <nav aria-label="Primary navigation" className="flex items-center gap-gap-h-sm">
              <Link
                href="/"
                className="text-surface-on hover:bg-surface-high rounded-button px-btn-px py-btn-py type-label-large"
              >
                Inventory
              </Link>
              <Link
                href="/login"
                className="bg-surface-high text-surface-on rounded-button px-btn-px py-btn-py type-label-large"
              >
                Log in
              </Link>
            </nav>
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-layout-margin py-section-py">
          {children}
        </main>

        <footer className="bg-surface-low border-t border-outline-variant px-layout-margin py-pad-lg">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-gap-v-sm sm:flex-row sm:items-center">
            <p className="type-body-small text-surface-on-variant">
              DG Tech Store — Physical Storefront: Shop ATF 03. All prices in Nigerian Naira (₦).
            </p>
            <p className="type-body-small text-surface-on-variant">
              Flexi-Pay terms: 70%–80% down payment, 30-day balance window, 0% interest, ₦0 late fees.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

