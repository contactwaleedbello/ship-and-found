import Link from 'next/link';
import { getWorkerQueues } from '@/lib/services/worker-service';

export default async function ReservedUnitsPage() {
  const queues = getWorkerQueues();

  return (
    <div className="space-y-spacing-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-3 pb-spacing-4 border-b border-border-default">
        <div>
          <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
            Reserved Units & Shelf Holds
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Physical stock held for 24-hour customer reservation window at Shop ATF 03 (BR-01, PRD 7.4).
          </p>
        </div>
        <Link
          href="/worker"
          className="inline-flex items-center justify-center px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-surface-primary text-text-primary border border-border-default hover:bg-surface-secondary transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Summary Banner */}
      <div className="bg-badge-neutral-subtle p-spacing-4 rounded-radius-md border border-border-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-3 text-body-sm">
        <div>
          <span className="font-bold text-text-primary">Stock Hold Protocol:</span> Attach physical yellow reservation tag to the device box immediately upon application creation. Units are automatically released if 24 hours expire without payment verification.
        </div>
        <span className="font-bold text-brand-primary whitespace-nowrap">
          {queues.reservedUnits.length} Total Units Held
        </span>
      </div>

      {/* Reserved Units List */}
      <div className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm overflow-hidden">
        {queues.reservedUnits.length === 0 ? (
          <div className="p-spacing-12 text-center text-text-muted text-body-sm">
            No units are currently under active reservation hold.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {queues.reservedUnits.map((unit) => {
              const remainingMs = new Date(unit.expiresAt).getTime() - Date.now();
              const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 3600)));
              const isUrgent = remainingHours < 4;

              return (
                <div
                  key={unit.applicationId}
                  className="p-spacing-4 sm:p-spacing-5 flex flex-col md:flex-row md:items-center md:justify-between gap-spacing-4 hover:bg-surface-secondary transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-spacing-2">
                      <span className="font-bold text-text-primary text-body-md">
                        {unit.deviceName}
                      </span>
                      <span className="text-caption font-semibold px-spacing-2 py-0.5 rounded-radius-sm bg-badge-neutral-subtle text-badge-neutral-fg">
                        {unit.status}
                      </span>
                    </div>
                    <div className="text-body-sm text-text-secondary">
                      Reserved by: <strong className="text-text-primary">{unit.customerName}</strong>
                    </div>
                    <div className="text-caption text-text-muted">
                      Shelf Tag: <span className="font-mono text-text-secondary">TAG-{unit.applicationId.slice(-6).toUpperCase()}</span> • Shelf Location: ATF-03 Glass Cabinet A
                    </div>
                  </div>

                  <div className="flex items-center gap-spacing-4">
                    <div className="text-right">
                      <div className="text-caption text-text-muted">Reservation Expires</div>
                      <div className={`text-body-md font-bold ${isUrgent ? 'text-badge-danger-fg' : 'text-text-primary'}`}>
                        {remainingHours}h remaining
                      </div>
                    </div>

                    <Link
                      href={`/worker/verify/${unit.applicationId}`}
                      className="inline-flex items-center justify-center px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active transition-colors whitespace-nowrap"
                    >
                      Verify Payment →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
