import type { ReactNode } from 'react';
import Link from 'next/link';

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col font-sans">
      {/* Worker Operational Header */}
      <header className="bg-surface-primary border-b border-border-default sticky top-0 z-sticky">
        <div className="max-w-7xl mx-auto px-spacing-4 sm:px-spacing-6 py-spacing-3 flex flex-wrap items-center justify-between gap-spacing-3">
          <div className="flex items-center gap-spacing-3">
            <Link
              href="/worker"
              className="text-title-sm sm:text-title-md font-bold text-text-primary hover:text-brand-primary transition-colors flex items-center gap-spacing-2"
            >
              <span>DG Tech Store</span>
              <span className="text-caption font-semibold px-spacing-2 py-0.5 rounded-radius-full bg-badge-neutral-subtle text-badge-neutral-fg">
                Shop ATF 03
              </span>
            </Link>
            <span className="text-border-default select-none">|</span>
            <span className="text-caption font-semibold px-spacing-2 py-0.5 rounded-radius-sm bg-badge-warning-subtle text-badge-warning-fg uppercase tracking-wider">
              Store Worker Portal
            </span>
          </div>

          <nav className="flex items-center gap-spacing-1 sm:gap-spacing-2">
            <Link
              href="/worker"
              className="px-spacing-3 py-spacing-1 text-body-sm font-medium rounded-radius-md text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/worker/reminders"
              className="px-spacing-3 py-spacing-1 text-body-sm font-medium rounded-radius-md text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              Reminders
            </Link>
            <Link
              href="/worker/reserved"
              className="px-spacing-3 py-spacing-1 text-body-sm font-medium rounded-radius-md text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              Reserved Units
            </Link>
            <Link
              href="/worker/inventory"
              className="px-spacing-3 py-spacing-1 text-body-sm font-medium rounded-radius-md text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              Inventory
            </Link>
          </nav>

          <div className="flex items-center gap-spacing-2 text-caption text-text-muted">
            <span className="w-2 h-2 rounded-radius-full bg-badge-success-fg animate-pulse" />
            <span className="font-medium text-text-secondary">Chinedu Okafor</span>
            <span className="text-border-default">•</span>
            <span>Counter 01</span>
          </div>
        </div>
      </header>

      {/* Main Operational View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-spacing-4 sm:p-spacing-6 md:p-spacing-8">
        {children}
      </main>

      {/* Operational Footer */}
      <footer className="bg-surface-primary border-t border-border-default py-spacing-4 px-spacing-6 text-center text-caption text-text-muted">
        DG Tech Store Flexi-Pay Operational Terminal • Shop ATF 03, Banex Plaza, Wuse 2, Abuja • Enforcing Dual-Control & Audit Integrity (BR-06, BR-13)
      </footer>
    </div>
  );
}
