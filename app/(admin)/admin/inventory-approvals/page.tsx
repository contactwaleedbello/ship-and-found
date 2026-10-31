'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import type { InventoryApprovalDto } from '@/lib/types';

export default function InventoryApprovalsPage() {
  const [proposals, setProposals] = useState<InventoryApprovalDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const queueRes = await fetch('/api/worker/queues').then((r) => r.json());
        setProposals(queueRes.data?.inventoryUpdates || []);
      } catch {
        setErrorMsg('Failed to load inventory proposals.');
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  async function handleDecision(approvalId: string, decision: 'APPROVE' | 'REJECT') {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/inventory-approvals/${approvalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          notes: decisionNotes,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error?.message || 'Failed to process decision.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg(`Inventory proposal ${decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'}! Catalog stock updated.`);
      setProposals((prev) =>
        prev.map((p) =>
          p.id === approvalId
            ? {
                ...p,
                status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                decisionNotes,
              }
            : p
        )
      );
      setDecidingId(null);
      setDecisionNotes('');
      setSubmitting(false);
    } catch {
      setErrorMsg('Network error processing inventory decision.');
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-spacing-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-3 pb-spacing-4 border-b border-border-default">
        <div>
          <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
            Inventory Adjustment Approvals
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Store Worker Stock Submissions (FR-13). Review shipment counts and discrepancies before physical catalog updates.
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

      {/* Proposals List */}
      <div className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-spacing-12 text-center text-text-muted">Loading inventory proposals...</div>
        ) : proposals.length === 0 ? (
          <div className="p-spacing-12 text-center text-text-muted text-body-sm">
            No inventory adjustment proposals currently pending or logged.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {proposals.map((item) => (
              <div key={item.id} className="p-spacing-5 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-spacing-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-spacing-2">
                      <span className="font-bold text-text-primary text-body-md">
                        {item.deviceName}
                      </span>
                      <span
                        className={`text-caption font-bold px-spacing-2 py-0.5 rounded-radius-sm uppercase ${
                          item.status === 'APPROVED'
                            ? 'bg-badge-success-subtle text-badge-success-fg'
                            : item.status === 'REJECTED'
                            ? 'bg-badge-danger-subtle text-badge-danger-fg'
                            : 'bg-badge-warning-subtle text-badge-warning-fg'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="text-body-sm text-text-secondary">
                      Proposed New Stock: <strong className="text-text-primary">{item.proposedStockCount} units</strong> (Current: {item.currentStockCount})
                    </div>
                    <div className="text-caption text-text-muted">
                      Reason: <span className="text-text-secondary italic">&quot;{item.reason}&quot;</span> • Submitted by: {item.submittedByName || 'Worker'}
                    </div>
                  </div>

                  {item.status === 'PENDING' && (
                    <div className="flex items-center gap-spacing-2">
                      <button
                        type="button"
                        onClick={() => setDecidingId(item.id)}
                        className="px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active transition-colors whitespace-nowrap"
                      >
                        Review & Decide →
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Decision Drawer */}
                {decidingId === item.id && (
                  <div className="p-spacing-4 rounded-radius-md bg-surface-secondary border border-border-default space-y-3">
                    <h4 className="text-body-sm font-bold text-text-primary">
                      Decision for {item.deviceName} Stock Adjustment
                    </h4>
                    <div>
                      <label className="block text-caption font-semibold text-text-secondary mb-1">
                        Executive Approval / Rejection Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={decisionNotes}
                        onChange={(e) => setDecisionNotes(e.target.value)}
                        placeholder="e.g. Verified delivery waybill at Shop ATF 03."
                        className="w-full px-spacing-3 py-spacing-2 text-body-sm rounded-radius-md border border-border-default bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
                      />
                    </div>
                    <div className="flex items-center gap-spacing-2">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleDecision(item.id, 'APPROVE')}
                        className="px-spacing-4 py-spacing-1.5 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover transition-colors"
                      >
                        ✓ Approve & Update Stock
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleDecision(item.id, 'REJECT')}
                        className="px-spacing-4 py-spacing-1.5 text-body-sm font-semibold rounded-radius-md bg-badge-danger-fg text-text-inverse hover:opacity-90 transition-colors"
                      >
                        ✕ Reject Proposal
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecidingId(null)}
                        className="px-spacing-3 py-spacing-1.5 text-body-sm text-text-secondary hover:text-text-primary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
