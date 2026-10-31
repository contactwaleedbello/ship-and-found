'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import type { DeletionRequestDto } from '@/lib/services/customer-service';

export default function DeletionRequestsPage() {
  const [requests, setRequests] = useState<DeletionRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReqId, setActiveReqId] = useState<string | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadRequests() {
      try {
        // Mock / initial seed loader
        setRequests([
          {
            requestId: 'del-demo-01',
            customerId: 'user-customer-zainab',
            requestDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
            status: 'PENDING',
            reason: 'Account closed, no outstanding contracts. Requesting full data erasure under NDPA Section 37.',
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    void loadRequests();
  }, []);

  async function handleDecideSubmit(requestId: string) {
    if (decision === 'REJECTED' && !reason.trim()) {
      setErrorMsg('A reason is required when rejecting a data deletion request (FR-10).');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/deletion-requests/${requestId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          reason,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error?.message || 'Failed to record deletion decision.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg(`NDPA deletion request marked as ${decision}! Logged to AuditLog.`);
      setRequests((prev) =>
        prev.map((r) => (r.requestId === requestId ? { ...r, status: decision, reason } : r))
      );
      setActiveReqId(null);
      setReason('');
      setSubmitting(false);
    } catch {
      setErrorMsg('Network error recording NDPA decision.');
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-spacing-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-3 pb-spacing-4 border-b border-border-default">
        <div>
          <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
            NDPA Section 37 Data Deletion Requests
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Data Subject Rights Governance (FR-10, PRD 5.3 & 7.10). Balance data erasure with statutory 7-year financial record retention.
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

      {/* Statutory Guidance Box */}
      <div className="bg-badge-neutral-subtle p-spacing-4 rounded-radius-md border border-border-subtle text-body-sm space-y-1">
        <strong className="text-text-primary block">Compliance Notice (NDPA 2023 & NDPC Guidelines):</strong>
        <p className="text-text-secondary text-caption">
          Under Section 37 of the Nigeria Data Protection Act, customers have the right to request erasure of their personal data. However, requests MUST be rejected if the customer has an active or defaulted contract, or if retention is legally mandated for tax and accounting audit purposes.
        </p>
      </div>

      {/* Requests Table */}
      <div className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-spacing-12 text-center text-text-muted">Loading deletion requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-spacing-12 text-center text-text-muted text-body-sm">
            No NDPA deletion requests submitted.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {requests.map((item) => (
              <div key={item.requestId} className="p-spacing-5 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-spacing-3">
                  <div>
                    <div className="flex items-center gap-spacing-2">
                      <span className="font-bold text-text-primary text-body-md">
                        Customer: {item.customerId}
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
                    <div className="text-caption text-text-muted mt-1">
                      Request ID: <span className="font-mono text-text-secondary">{item.requestId}</span> • Submitted: {new Date(item.requestDate).toLocaleDateString()}
                    </div>
                    {item.reason && (
                      <p className="text-body-sm text-text-secondary mt-2 italic bg-surface-secondary p-spacing-3 rounded-radius-sm">
                        &quot;{item.reason}&quot;
                      </p>
                    )}
                  </div>

                  {item.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => setActiveReqId(item.requestId)}
                      className="px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active transition-colors whitespace-nowrap self-start md:self-auto"
                    >
                      Make Decision →
                    </button>
                  )}
                </div>

                {/* Inline Decision Drawer */}
                {activeReqId === item.requestId && (
                  <div className="p-spacing-4 rounded-radius-md bg-surface-secondary border border-border-default space-y-3">
                    <h4 className="text-body-sm font-bold text-text-primary">
                      Record Decision for {item.requestId}
                    </h4>

                    <div className="grid grid-cols-2 gap-spacing-2 max-w-sm">
                      <button
                        type="button"
                        onClick={() => setDecision('APPROVED')}
                        className={`py-spacing-1.5 text-caption font-bold rounded-radius-sm border transition-colors ${
                          decision === 'APPROVED'
                            ? 'bg-badge-success-subtle text-badge-success-fg border-badge-success-subtle'
                            : 'bg-surface-primary text-text-secondary border-border-default'
                        }`}
                      >
                        ✓ Approve Erasure
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecision('REJECTED')}
                        className={`py-spacing-1.5 text-caption font-bold rounded-radius-sm border transition-colors ${
                          decision === 'REJECTED'
                            ? 'bg-badge-danger-subtle text-badge-danger-fg border-badge-danger-subtle'
                            : 'bg-surface-primary text-text-secondary border-border-default'
                        }`}
                      >
                        ✕ Reject (Statutory Retention)
                      </button>
                    </div>

                    <div>
                      <label className="block text-caption font-semibold text-text-secondary mb-1">
                        Decision Notes / Legal Basis (Required if rejecting)
                      </label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Approved: No active debt. Or: Rejected under NDPA Section 37 due to statutory financial audit retention."
                        className="w-full px-spacing-3 py-spacing-2 text-body-sm rounded-radius-md border border-border-default bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
                      />
                    </div>

                    <div className="flex items-center gap-spacing-2">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleDecideSubmit(item.requestId)}
                        className="px-spacing-4 py-spacing-1.5 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover transition-colors"
                      >
                        {submitting ? 'Recording...' : 'Submit Decision'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveReqId(null)}
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
