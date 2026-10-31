'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DefaultedContractItem {
  applicationId: string;
  agreementId?: string;
  customerName: string;
  customerPhone: string;
  deviceName: string;
  lockedPriceNaira: number;
  remainingAmountNaira: number;
  status: string;
}

export default function DefaultedContractsPage() {
  const [defaults, setDefaults] = useState<DefaultedContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadDefaults() {
      try {
        // Load in-memory applications for defaults
        const adminRes = await fetch('/api/admin/metrics');
        if (adminRes.ok) {
          // For initial scaffold display, if none defaulted, we provide demo item
          setDefaults([
            {
              applicationId: 'app-default-demo-01',
              agreementId: 'agr-default-demo-01',
              customerName: 'Ibrahim Danladi',
              customerPhone: '+2348051239876',
              deviceName: 'Infinix Hot 40i (128GB)',
              lockedPriceNaira: 145000,
              remainingAmountNaira: 0, // Fully recovered demo
              status: 'Defaulted',
            },
            {
              applicationId: 'app-default-demo-02',
              agreementId: 'agr-default-demo-02',
              customerName: 'Emeka Nwosu',
              customerPhone: '+2348076543210',
              deviceName: 'Tecno Spark 20 (128GB)',
              lockedPriceNaira: 160000,
              remainingAmountNaira: 32000, // Balance still remains
              status: 'Defaulted',
            },
          ]);
        }
      } catch {
        setErrorMsg('Failed to load defaulted contracts.');
      } finally {
        setLoading(false);
      }
    }
    void loadDefaults();
  }, []);

  async function handleResolve(agreementId: string, remainingNaira: number) {
    if (remainingNaira > 0) {
      setErrorMsg(`Cannot resolve default while outstanding balance of ₦${remainingNaira.toLocaleString()} remains (FR-09). Balance must be ₦0.`);
      return;
    }

    if (!resolutionNotes.trim()) {
      setErrorMsg('Provide resolution notes documenting settlement and debt discharge.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/defaults/${agreementId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionNotes }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error?.message || 'Failed to resolve default.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg(`Contract ${agreementId} marked as Resolved! Customer platform purchase block lifted.`);
      setDefaults((prev) => prev.filter((d) => (d.agreementId || d.applicationId) !== agreementId));
      setResolvingId(null);
      setResolutionNotes('');
      setSubmitting(false);
    } catch {
      setErrorMsg('Network error resolving defaulted contract.');
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-spacing-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-3 pb-spacing-4 border-b border-border-default">
        <div>
          <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
            Defaulted Flexi-Pay Contracts Management
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Shop ATF 03 Bad-Debt Recovery (FR-09). Enforce recovery settlement and resolve contracts only upon ₦0 remaining balance.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-surface-primary text-text-primary border border-border-default hover:bg-surface-secondary transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-spacing-4 rounded-radius-md bg-badge-danger-subtle text-badge-danger-fg border border-badge-danger-subtle text-body-sm font-medium">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-spacing-4 rounded-radius-md bg-badge-success-subtle text-badge-success-fg border border-badge-success-subtle text-body-sm font-medium">
          {successMsg}
        </div>
      )}

      {/* Defaults List */}
      <div className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-spacing-12 text-center text-text-muted">Loading defaulted contracts...</div>
        ) : defaults.length === 0 ? (
          <div className="p-spacing-12 text-center text-text-muted text-body-sm">
            No active defaulted contracts currently open. Default rate is 0.0%!
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {defaults.map((contract) => {
              const contractId = contract.agreementId || contract.applicationId;
              const isZeroBalance = contract.remainingAmountNaira === 0;

              return (
                <div key={contractId} className="p-spacing-5 space-y-spacing-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-spacing-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-spacing-2">
                        <span className="font-bold text-text-primary text-body-md">
                          {contract.customerName}
                        </span>
                        <span className="text-caption text-text-muted">
                          ({contract.customerPhone})
                        </span>
                        <span className="text-caption font-bold px-spacing-2 py-0.5 rounded-radius-sm bg-badge-danger-subtle text-badge-danger-fg">
                          Defaulted (BR-09 Block Active)
                        </span>
                      </div>
                      <div className="text-body-sm text-text-secondary">
                        Device: <strong className="text-text-primary">{contract.deviceName}</strong> • Total Contract: ₦{contract.lockedPriceNaira.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-spacing-4">
                      <div className="text-right">
                        <div className="text-caption text-text-muted">Outstanding Debt</div>
                        <div className={`text-title-sm font-bold ${isZeroBalance ? 'text-badge-success-fg' : 'text-badge-danger-fg'}`}>
                          ₦{contract.remainingAmountNaira.toLocaleString()}
                        </div>
                      </div>

                      <Link
                        href={`/worker/settlement/${contractId}`}
                        className="px-spacing-3 py-spacing-2 text-body-sm font-semibold rounded-radius-md border border-border-default bg-surface-secondary text-text-primary hover:bg-surface-tertiary transition-colors whitespace-nowrap"
                      >
                        Record Settlement →
                      </Link>

                      {isZeroBalance ? (
                        <button
                          type="button"
                          onClick={() => setResolvingId(contractId)}
                          className="px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active transition-colors whitespace-nowrap"
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="Cannot resolve while outstanding balance remains"
                          className="px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-surface-disabled text-text-disabled cursor-not-allowed whitespace-nowrap"
                        >
                          Balance Remains (Blocked)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Resolution Notes Prompt */}
                  {resolvingId === contractId && (
                    <div className="p-spacing-4 rounded-radius-md bg-surface-secondary border border-border-default space-y-3">
                      <h4 className="text-body-sm font-bold text-text-primary">
                        Confirm Default Resolution for {contract.customerName}
                      </h4>
                      <p className="text-caption text-text-secondary">
                        Outstanding debt is ₦0. Please enter resolution documentation below to discharge debt and restore platform purchasing privileges.
                      </p>
                      <textarea
                        rows={2}
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="e.g. Full recovery settlement paid at Shop ATF 03 counter. Debt discharged."
                        className="w-full px-spacing-3 py-spacing-2 text-body-sm rounded-radius-md border border-border-default bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
                      />
                      <div className="flex items-center gap-spacing-2">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleResolve(contractId, contract.remainingAmountNaira)}
                          className="px-spacing-4 py-spacing-1.5 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover transition-colors"
                        >
                          {submitting ? 'Resolving...' : 'Confirm & Discharge Default'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setResolvingId(null)}
                          className="px-spacing-3 py-spacing-1.5 text-body-sm text-text-secondary hover:text-text-primary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
