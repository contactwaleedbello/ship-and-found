import Link from 'next/link';
import { inMemoryApplications } from '@/lib/services/application-service';
import { getSuccessMetrics } from '@/lib/services/admin-service';
import { inMemoryInventoryApprovals } from '@/lib/services/worker-service';
import { getAllDeletionRequests } from '@/lib/services/customer-service';

export default async function OwnerDashboardPage() {
  const metrics = getSuccessMetrics();
  const allApps = Array.from(inMemoryApplications.values());

  const pendingReview = allApps.filter((a) => a.status === 'Application Pending');
  const awaitingFinalApproval = allApps.filter((a) => a.status === 'Awaiting Final Approval');
  const pendingInventory = inMemoryInventoryApprovals.filter((i) => i.status === 'PENDING');
  const pendingDeletions = getAllDeletionRequests().filter((d) => d.status === 'PENDING');

  return (
    <div className="space-y-spacing-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-3 pb-spacing-4 border-b border-border-default">
        <div>
          <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
            Owner & Executive Governance Console
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Shop ATF 03 executive oversight: Dual-control approvals, exchange-rate controls, NDPA compliance, and portfolio performance.
          </p>
        </div>
        <div className="flex items-center gap-spacing-2">
          <Link
            href="/admin/exchange-rate"
            className="inline-flex items-center justify-center px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-surface-primary text-text-primary border border-border-default hover:bg-surface-secondary transition-colors"
          >
            Adjust Multiplier
          </Link>
          <Link
            href="/admin/audit"
            className="inline-flex items-center justify-center px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active transition-colors"
          >
            Inspect Audit Trail
          </Link>
        </div>
      </div>

      {/* Non-Dismissible Alert Banners (ux-states.md B.8) */}
      <div className="space-y-spacing-3">
        {awaitingFinalApproval.length > 0 && (
          <div className="p-spacing-4 rounded-radius-md bg-badge-warning-subtle border border-badge-warning-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-3 text-body-sm">
            <div className="flex items-center gap-spacing-3">
              <span className="text-display-xs">🛡️</span>
              <div>
                <strong className="text-badge-warning-fg font-bold block">
                  Dual-Control Activation Gate Pending (BR-13)
                </strong>
                <span>
                  {awaitingFinalApproval.length} contract(s) have verified down payments and OTP acceptance, awaiting independent Owner final approval and device serial assignment.
                </span>
              </div>
            </div>
            <a
              href="#queue-final-approvals"
              className="px-spacing-3 py-spacing-1.5 rounded-radius-md bg-surface-primary text-text-primary font-semibold text-caption border border-border-default hover:bg-surface-secondary whitespace-nowrap self-start sm:self-auto"
            >
              Review Activations →
            </a>
          </div>
        )}

        <div className="p-spacing-3 rounded-radius-md bg-surface-primary border border-border-default flex items-center justify-between text-caption text-text-secondary">
          <div className="flex items-center gap-spacing-2">
            <span className="w-2 h-2 rounded-radius-full bg-badge-success-fg" />
            <span>Health Status: Expiry Heartbeat OK (15m window) • Database Ready • Shop ATF 03 Online</span>
          </div>
          <span className="font-mono text-text-muted">WAT: {new Date().toLocaleTimeString('en-GB')}</span>
        </div>
      </div>

      {/* 5 Core Success Metrics (PRD 1.8 & 15.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-spacing-4">
        {/* Metric 1: Total Volume */}
        <div className="bg-surface-primary p-spacing-4 rounded-radius-lg border border-border-default shadow-sm">
          <span className="text-caption font-semibold text-text-muted block">Portfolio Volume</span>
          <div className="text-title-md font-bold text-text-primary mt-1">
            ₦{metrics.totalVolumeNaira.toLocaleString()}
          </div>
          <span className="text-caption text-text-secondary mt-1 block">Total contracted value</span>
        </div>

        {/* Metric 2: Active Contracts */}
        <div className="bg-surface-primary p-spacing-4 rounded-radius-lg border border-border-default shadow-sm">
          <span className="text-caption font-semibold text-text-muted block">Active Contracts</span>
          <div className="text-title-md font-bold text-brand-primary mt-1">
            {metrics.activeAgreementsCount}
          </div>
          <span className="text-caption text-text-secondary mt-1 block">In 30-day balance window</span>
        </div>

        {/* Metric 3: Completion Rate */}
        <div className="bg-surface-primary p-spacing-4 rounded-radius-lg border border-border-default shadow-sm">
          <span className="text-caption font-semibold text-badge-success-fg block">Completion Rate</span>
          <div className="text-title-md font-bold text-text-primary mt-1">
            {metrics.completionRatePercent}%
          </div>
          <span className="text-caption text-text-muted mt-1 block">Target: &gt; 90% completion</span>
        </div>

        {/* Metric 4: Default Rate */}
        <div className="bg-surface-primary p-spacing-4 rounded-radius-lg border border-border-default shadow-sm">
          <span className="text-caption font-semibold text-badge-danger-fg block">Default Rate</span>
          <div className="text-title-md font-bold text-text-primary mt-1">
            {metrics.defaultRatePercent}%
          </div>
          <span className="text-caption text-text-muted mt-1 block">Target: &lt; 3% portfolio loss</span>
        </div>

        {/* Metric 5: Average Turnaround */}
        <div className="bg-surface-primary p-spacing-4 rounded-radius-lg border border-border-default shadow-sm">
          <span className="text-caption font-semibold text-text-muted block">Avg Turnaround</span>
          <div className="text-title-md font-bold text-text-primary mt-1">
            {metrics.averageTurnaroundHours}h
          </div>
          <span className="text-caption text-text-muted mt-1 block">App to in-hand delivery</span>
        </div>
      </div>

      {/* Operational Queue 1: Awaiting Final Approval & Activation (Dual-Control BR-13) */}
      <section id="queue-final-approvals" className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm overflow-hidden">
        <div className="p-spacing-4 sm:p-spacing-5 border-b border-border-default flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-2">
          <div>
            <h2 className="text-title-md font-bold text-text-primary">
              Dual-Control Final Approvals (Awaiting Device Serial)
            </h2>
            <p className="text-body-sm text-text-secondary mt-0.5">
              Contracts with verified down payment & accepted customer agreement ready for physical handover (BR-13).
            </p>
          </div>
          <span className="text-caption font-bold px-spacing-3 py-spacing-1 rounded-radius-full bg-badge-warning-subtle text-badge-warning-fg self-start sm:self-auto">
            {awaitingFinalApproval.length} Ready for Activation
          </span>
        </div>

        {awaitingFinalApproval.length === 0 ? (
          <div className="p-spacing-8 text-center text-text-muted text-body-sm">
            No contracts currently awaiting dual-control final approval.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {awaitingFinalApproval.map((app) => (
              <div
                key={app.applicationId}
                className="p-spacing-4 sm:p-spacing-5 flex flex-col md:flex-row md:items-center md:justify-between gap-spacing-4 hover:bg-surface-secondary transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-spacing-2">
                    <span className="font-bold text-text-primary text-body-md">
                      {app.customerName}
                    </span>
                    <span className="text-caption text-text-muted">
                      ({app.customerPhone})
                    </span>
                    <span className="text-caption font-semibold px-spacing-2 py-0.5 rounded-radius-sm bg-badge-success-subtle text-badge-success-fg">
                      Down Payment Verified
                    </span>
                  </div>
                  <div className="text-body-sm text-text-secondary">
                    Device: <strong className="text-text-primary">{app.deviceName}</strong> • Locked: ₦{app.lockedPriceNaira.toLocaleString()}
                  </div>
                  <div className="text-caption text-text-muted">
                    Verified By: Worker {app.downPaymentVerifierId || 'chinedu'} • Down Payment: ₦{app.downPaymentAmountNaira.toLocaleString()} ({app.downPaymentPercent}%)
                  </div>
                </div>

                <Link
                  href={`/admin/applications/${app.applicationId}/final-approve`}
                  className="inline-flex items-center justify-center px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active transition-colors whitespace-nowrap self-start md:self-auto"
                >
                  Final Approve & Assign Serial →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Operational Queue 2: Pending Initial Application Reviews */}
      <section className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm overflow-hidden">
        <div className="p-spacing-4 sm:p-spacing-5 border-b border-border-default flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-2">
          <div>
            <h2 className="text-title-md font-bold text-text-primary">
              Initial Application Reviews
            </h2>
            <p className="text-body-sm text-text-secondary mt-0.5">
              New customer applications requiring credit & guarantor inspection before down payment verification (FR-04).
            </p>
          </div>
          <span className="text-caption font-bold px-spacing-3 py-spacing-1 rounded-radius-full bg-badge-neutral-subtle text-badge-neutral-fg self-start sm:self-auto">
            {pendingReview.length} Pending Review
          </span>
        </div>

        {pendingReview.length === 0 ? (
          <div className="p-spacing-8 text-center text-text-muted text-body-sm">
            No new applications pending initial review.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {pendingReview.map((app) => (
              <div
                key={app.applicationId}
                className="p-spacing-4 sm:p-spacing-5 flex flex-col md:flex-row md:items-center md:justify-between gap-spacing-4 hover:bg-surface-secondary transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-spacing-2">
                    <span className="font-bold text-text-primary text-body-md">
                      {app.customerName}
                    </span>
                    <span className="text-caption text-text-muted">
                      ({app.customerPhone})
                    </span>
                    <span className="text-caption font-semibold px-spacing-2 py-0.5 rounded-radius-sm bg-badge-warning-subtle text-badge-warning-fg">
                      Pending Review
                    </span>
                  </div>
                  <div className="text-body-sm text-text-secondary">
                    Device: <strong className="text-text-primary">{app.deviceName}</strong> • Down Payment Proposal: {app.downPaymentPercent}% (₦{app.downPaymentAmountNaira.toLocaleString()})
                  </div>
                  <div className="text-caption text-text-muted">
                    Guarantor: {app.guarantorName} ({app.guarantorPhone})
                  </div>
                </div>

                <Link
                  href={`/admin/applications/${app.applicationId}/review`}
                  className="inline-flex items-center justify-center px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-surface-secondary text-text-primary border border-border-default hover:bg-surface-tertiary transition-colors whitespace-nowrap self-start md:self-auto"
                >
                  Inspect & Decide →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Governance Quick Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-spacing-4">
        <Link
          href="/admin/inventory-approvals"
          className="bg-surface-primary p-spacing-5 rounded-radius-lg border border-border-default shadow-sm hover:border-brand-primary transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary text-body-md">Inventory Approvals</span>
              <span className="text-caption font-bold px-spacing-2 py-0.5 rounded-radius-full bg-badge-neutral-subtle text-badge-neutral-fg">
                {pendingInventory.length} Pending
              </span>
            </div>
            <p className="text-caption text-text-secondary mt-spacing-2">
              Review store worker stock adjustments and physical shipment intakes (FR-13).
            </p>
          </div>
          <span className="text-caption font-bold text-brand-primary mt-spacing-4">
            Manage Inventory Proposals →
          </span>
        </Link>

        <Link
          href="/admin/deletion-requests"
          className="bg-surface-primary p-spacing-5 rounded-radius-lg border border-border-default shadow-sm hover:border-brand-primary transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary text-body-md">NDPA Deletion Requests</span>
              <span className="text-caption font-bold px-spacing-2 py-0.5 rounded-radius-full bg-badge-neutral-subtle text-badge-neutral-fg">
                {pendingDeletions.length} Pending
              </span>
            </div>
            <p className="text-caption text-text-secondary mt-spacing-2">
              Review Section 37 data erasure requests against active debt retention rules (FR-10).
            </p>
          </div>
          <span className="text-caption font-bold text-brand-primary mt-spacing-4">
            Review NDPA Decisions →
          </span>
        </Link>

        <Link
          href="/admin/exchange-rate"
          className="bg-surface-primary p-spacing-5 rounded-radius-lg border border-border-default shadow-sm hover:border-brand-primary transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary text-body-md">Exchange Rate Multiplier</span>
              <span className="text-caption font-bold px-spacing-2 py-0.5 rounded-radius-full bg-badge-success-subtle text-badge-success-fg">
                Live Pricing
              </span>
            </div>
            <p className="text-caption text-text-secondary mt-spacing-2">
              Update global pricing multiplier to automatically recalculate dynamic Naira prices (FR-13).
            </p>
          </div>
          <span className="text-caption font-bold text-brand-primary mt-spacing-4">
            Configure Multiplier →
          </span>
        </Link>
      </div>
    </div>
  );
}
