import Link from 'next/link';
import { getSuccessMetrics } from '@/lib/services/admin-service';

export default async function SuccessMetricsPage() {
  const metrics = getSuccessMetrics();

  const isDefaultHealthy = metrics.defaultRatePercent <= 3.0;
  const isCompletionHealthy = metrics.completionRatePercent >= 90.0;

  return (
    <div className="space-y-spacing-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-3 pb-spacing-4 border-b border-border-default">
        <div>
          <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
            DG Tech Store Business Success Metrics
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Shop ATF 03 Key Performance Indicators (PRD Section 1.8 & 15.1). Benchmarking default prevention, cash flow velocity, and customer turnaround.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-surface-primary text-text-primary border border-border-default hover:bg-surface-secondary transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-6">
        {/* KPI 1: Default Rate */}
        <div className="bg-surface-primary p-spacing-5 rounded-radius-lg border border-border-default shadow-sm space-y-spacing-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-bold text-text-primary">1. Default Rate</span>
              <span
                className={`text-caption font-bold px-spacing-2 py-0.5 rounded-radius-full ${
                  isDefaultHealthy
                    ? 'bg-badge-success-subtle text-badge-success-fg'
                    : 'bg-badge-danger-subtle text-badge-danger-fg'
                }`}
              >
                {isDefaultHealthy ? 'Target Met (< 3%)' : 'Exceeds Target'}
              </span>
            </div>
            <div className="text-display-md font-bold text-text-primary mt-spacing-2">
              {metrics.defaultRatePercent}%
            </div>
            <p className="text-caption text-text-secondary mt-1">
              {metrics.defaultedAgreementsCount} defaulted of {metrics.totalAgreementsCount} total lifetime contracts.
            </p>
          </div>
          <div className="pt-spacing-3 border-t border-border-subtle text-caption text-text-muted">
            PRD Benchmark: Strict 70%–80% down payment (BR-02) prevents defaults and ensures zero platform capital loss.
          </div>
        </div>

        {/* KPI 2: 30-Day Completion Rate */}
        <div className="bg-surface-primary p-spacing-5 rounded-radius-lg border border-border-default shadow-sm space-y-spacing-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-bold text-text-primary">2. Completion Rate</span>
              <span
                className={`text-caption font-bold px-spacing-2 py-0.5 rounded-radius-full ${
                  isCompletionHealthy
                    ? 'bg-badge-success-subtle text-badge-success-fg'
                    : 'bg-badge-warning-subtle text-badge-warning-fg'
                }`}
              >
                {isCompletionHealthy ? 'Target Met (> 90%)' : 'Target Warning'}
              </span>
            </div>
            <div className="text-display-md font-bold text-brand-primary mt-spacing-2">
              {metrics.completionRatePercent}%
            </div>
            <p className="text-caption text-text-secondary mt-1">
              {metrics.completedAgreementsCount} completed contracts with ₦0 remaining balance within 30 days.
            </p>
          </div>
          <div className="pt-spacing-3 border-t border-border-subtle text-caption text-text-muted">
            PRD Benchmark: Target &gt; 90% full balance completion supported by structured WhatsApp reminders (FR-07).
          </div>
        </div>

        {/* KPI 3: Average Turnaround Time */}
        <div className="bg-surface-primary p-spacing-5 rounded-radius-lg border border-border-default shadow-sm space-y-spacing-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-bold text-text-primary">3. Operational Turnaround</span>
              <span className="text-caption font-bold px-spacing-2 py-0.5 rounded-radius-full bg-badge-neutral-subtle text-badge-neutral-fg">
                Fast Delivery
              </span>
            </div>
            <div className="text-display-md font-bold text-text-primary mt-spacing-2">
              {metrics.averageTurnaroundHours} Hours
            </div>
            <p className="text-caption text-text-secondary mt-1">
              Average elapsed time between customer online application and counter physical device handover.
            </p>
          </div>
          <div className="pt-spacing-3 border-t border-border-subtle text-caption text-text-muted">
            PRD Benchmark: 24-hour reservation window (BR-01) guarantees same-day pickup for Shop ATF 03 walk-ins.
          </div>
        </div>
      </div>

      {/* Financial Portfolio Cashflow Deep Dive */}
      <div className="bg-surface-primary p-spacing-6 rounded-radius-lg border border-border-default shadow-sm space-y-spacing-5">
        <h2 className="text-title-md font-bold text-text-primary">
          Shop ATF 03 Cashflow & Capital Liquidity Summary
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-spacing-4">
          <div className="p-spacing-4 rounded-radius-md bg-surface-secondary border border-border-subtle">
            <span className="text-caption font-semibold text-text-muted block">Total Disbursed Volume</span>
            <span className="text-title-lg font-bold text-text-primary mt-1 block">
              ₦{metrics.totalVolumeNaira.toLocaleString()}
            </span>
            <span className="text-caption text-text-secondary">Face value of all contracted devices</span>
          </div>

          <div className="p-spacing-4 rounded-radius-md bg-badge-success-subtle/40 border border-badge-success-subtle">
            <span className="text-caption font-semibold text-badge-success-fg block">Total Cash Collected</span>
            <span className="text-title-lg font-bold text-badge-success-fg mt-1 block">
              ₦{metrics.totalCollectedNaira.toLocaleString()}
            </span>
            <span className="text-caption text-text-secondary">Down payments & balance installments</span>
          </div>

          <div className="p-spacing-4 rounded-radius-md bg-badge-warning-subtle/40 border border-badge-warning-subtle">
            <span className="text-caption font-semibold text-badge-warning-fg block">Outstanding Balances</span>
            <span className="text-title-lg font-bold text-brand-primary mt-1 block">
              ₦{metrics.totalOutstandingNaira.toLocaleString()}
            </span>
            <span className="text-caption text-text-secondary">Current active customer receivables</span>
          </div>
        </div>

        <div className="p-spacing-4 rounded-radius-md bg-surface-secondary text-caption text-text-secondary space-y-1">
          <span className="font-bold text-text-primary block">Zero Capital Exposure Note:</span>
          Because every device requires an upfront 70%–80% cash or transfer down payment at Shop ATF 03 counter (BR-02), DG Tech Store&apos;s wholesale acquisition cost is recouped on Day 1, leaving zero unhedged exposure during the 30-day balance completion window.
        </div>
      </div>
    </div>
  );
}
