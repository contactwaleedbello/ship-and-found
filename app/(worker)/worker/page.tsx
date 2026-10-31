import Link from 'next/link';
import { getWorkerQueues } from '@/lib/services/worker-service';

export default async function WorkerDashboardPage() {
  const queues = getWorkerQueues();

  return (
    <div className="space-y-spacing-6">
      {/* Page Title & Shift Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-3 pb-spacing-4 border-b border-border-default">
        <div>
          <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
            Store Worker Operations Dashboard
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Real-time counter queues for Shop ATF 03: Down payment verification, customer reminders, and physical stock holds.
          </p>
        </div>
        <div className="flex items-center gap-spacing-2">
          <Link
            href="/worker/inventory"
            className="inline-flex items-center justify-center px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-surface-primary text-text-primary border border-border-default hover:bg-surface-secondary transition-colors"
          >
            Adjust Stock
          </Link>
          <Link
            href="/worker/reminders"
            className="inline-flex items-center justify-center px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active transition-colors"
          >
            Open Reminders
          </Link>
        </div>
      </div>

      {/* 4 Primary Queue Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-spacing-4">
        {/* Queue 1: Payments to Verify */}
        <div className="bg-surface-primary p-spacing-5 rounded-radius-lg border border-border-default shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-medium text-text-secondary">Payments to Verify</span>
            <span className="px-spacing-2 py-0.5 rounded-radius-full text-caption font-semibold bg-badge-warning-subtle text-badge-warning-fg">
              Counter Action
            </span>
          </div>
          <div className="mt-spacing-3">
            <span className="text-display-sm font-bold text-text-primary">
              {queues.paymentsToVerifyCount}
            </span>
            <span className="text-caption text-text-muted ml-spacing-2">applications pending cash/transfer</span>
          </div>
          <div className="mt-spacing-4 pt-spacing-3 border-t border-border-subtle">
            <a
              href="#queue-payments"
              className="text-body-sm font-semibold text-brand-primary hover:underline"
            >
              View Verification Queue →
            </a>
          </div>
        </div>

        {/* Queue 2: Due Reminders */}
        <div className="bg-surface-primary p-spacing-5 rounded-radius-lg border border-border-default shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-medium text-text-secondary">Due Reminders</span>
            <span className="px-spacing-2 py-0.5 rounded-radius-full text-caption font-semibold bg-badge-neutral-subtle text-badge-neutral-fg">
              WhatsApp Log
            </span>
          </div>
          <div className="mt-spacing-3">
            <span className="text-display-sm font-bold text-text-primary">
              {queues.remindersDueCount}
            </span>
            <span className="text-caption text-text-muted ml-spacing-2">contracts due for outreach</span>
          </div>
          <div className="mt-spacing-4 pt-spacing-3 border-t border-border-subtle">
            <Link
              href="/worker/reminders"
              className="text-body-sm font-semibold text-brand-primary hover:underline"
            >
              Open Reminder Checklist →
            </Link>
          </div>
        </div>

        {/* Queue 3: Reserved Units */}
        <div className="bg-surface-primary p-spacing-5 rounded-radius-lg border border-border-default shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-medium text-text-secondary">Reserved Units</span>
            <span className="px-spacing-2 py-0.5 rounded-radius-full text-caption font-semibold bg-badge-neutral-subtle text-badge-neutral-fg">
              24h Window
            </span>
          </div>
          <div className="mt-spacing-3">
            <span className="text-display-sm font-bold text-text-primary">
              {queues.reservedUnitsCount}
            </span>
            <span className="text-caption text-text-muted ml-spacing-2">units tagged on physical shelves</span>
          </div>
          <div className="mt-spacing-4 pt-spacing-3 border-t border-border-subtle">
            <Link
              href="/worker/reserved"
              className="text-body-sm font-semibold text-brand-primary hover:underline"
            >
              Review Tagged Shelves →
            </Link>
          </div>
        </div>

        {/* Queue 4: Inventory Updates */}
        <div className="bg-surface-primary p-spacing-5 rounded-radius-lg border border-border-default shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-medium text-text-secondary">Inventory Updates</span>
            <span className="px-spacing-2 py-0.5 rounded-radius-full text-caption font-semibold bg-badge-neutral-subtle text-badge-neutral-fg">
              Owner Approval
            </span>
          </div>
          <div className="mt-spacing-3">
            <span className="text-display-sm font-bold text-text-primary">
              {queues.inventoryPendingCount}
            </span>
            <span className="text-caption text-text-muted ml-spacing-2">proposals awaiting review</span>
          </div>
          <div className="mt-spacing-4 pt-spacing-3 border-t border-border-subtle">
            <Link
              href="/worker/inventory"
              className="text-body-sm font-semibold text-brand-primary hover:underline"
            >
              Manage Stock Proposals →
            </Link>
          </div>
        </div>
      </div>

      {/* Operational Queue 1: Down Payments to Verify */}
      <section id="queue-payments" className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm overflow-hidden">
        <div className="p-spacing-4 sm:p-spacing-5 border-b border-border-default flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-2">
          <div>
            <h2 className="text-title-md font-bold text-text-primary">
              Payments to Verify (In-Store Counter)
            </h2>
            <p className="text-body-sm text-text-secondary mt-0.5">
              Customers currently at Shop ATF 03 to deposit their 70%–80% down payment (BR-06).
            </p>
          </div>
          <span className="text-caption font-medium px-spacing-3 py-spacing-1 rounded-radius-full bg-badge-neutral-subtle text-badge-neutral-fg self-start sm:self-auto">
            {queues.paymentsToVerify.length} Pending
          </span>
        </div>

        {queues.paymentsToVerify.length === 0 ? (
          <div className="p-spacing-8 text-center text-text-muted text-body-sm">
            No down payments currently awaiting verification.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle overflow-x-auto">
            {queues.paymentsToVerify.map((item) => (
              <div
                key={item.applicationId}
                className="p-spacing-4 sm:p-spacing-5 flex flex-col md:flex-row md:items-center md:justify-between gap-spacing-4 hover:bg-surface-secondary transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-spacing-2">
                    <span className="font-bold text-text-primary text-body-md">
                      {item.customerName}
                    </span>
                    <span className="text-caption text-text-muted">
                      ({item.customerPhone})
                    </span>
                    <span className="text-caption font-semibold px-spacing-2 py-0.5 rounded-radius-sm bg-badge-warning-subtle text-badge-warning-fg">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-body-sm text-text-secondary">
                    Device: <span className="font-semibold text-text-primary">{item.deviceName}</span>
                  </div>
                  <div className="text-caption text-text-muted">
                    Application ID: <span className="font-mono text-text-secondary">{item.applicationId}</span> • Applied: {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center gap-spacing-4">
                  <div className="text-right">
                    <div className="text-caption text-text-muted">Expected Down Payment</div>
                    <div className="text-title-sm font-bold text-text-primary">
                      ₦{item.downPaymentAmountNaira.toLocaleString()}
                    </div>
                  </div>
                  <Link
                    href={`/worker/verify/${item.applicationId}`}
                    className="inline-flex items-center justify-center px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active transition-colors whitespace-nowrap"
                  >
                    Verify Payment →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Action: Balance & Settlement Search */}
      <section className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm p-spacing-5">
        <h2 className="text-title-md font-bold text-text-primary">
          Customer Balance & Settlement Lookup
        </h2>
        <p className="text-body-sm text-text-secondary mt-1">
          When a customer arrives at Shop ATF 03 to pay off their remaining balance or settle a defaulted contract.
        </p>
        <div className="mt-spacing-4 flex flex-col sm:flex-row gap-spacing-3 max-w-xl">
          <input
            type="text"
            placeholder="Enter Agreement or Application ID (e.g. app-fatima-redmi13)"
            className="flex-1 px-spacing-3 py-spacing-2 rounded-radius-md border border-border-default bg-surface-primary text-text-primary text-body-sm focus:outline-none focus:ring-2 focus:ring-focus"
            id="agreementSearchInput"
          />
          <Link
            href="/worker/balance/agr-fatima-redmi13"
            className="inline-flex items-center justify-center px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-surface-secondary text-text-primary border border-border-default hover:bg-surface-tertiary transition-colors"
          >
            Open Active Demo Contract
          </Link>
        </div>
      </section>
    </div>
  );
}
