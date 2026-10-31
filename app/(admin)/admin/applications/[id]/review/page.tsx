'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface AppDetail {
  applicationId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerNinMasked: string;
  guarantorName: string;
  guarantorPhone: string;
  personalDetails: string;
  deviceId: string;
  deviceName: string;
  lockedPriceNaira: number;
  downPaymentPercent: number;
  downPaymentAmountNaira: number;
  remainingAmountNaira: number;
  status: string;
}

export default function ReviewApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params['id'] as string;

  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [decryptedNin, setDecryptedNin] = useState<string | null>(null);
  const [fetchingNin, setFetchingNin] = useState(false);
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/applications/${applicationId}`);
        if (!res.ok) {
          setErrorMsg('Failed to load application details.');
          setLoading(false);
          return;
        }
        const json = await res.json();
        setApp(json.data);
      } catch {
        setErrorMsg('Network error loading application.');
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [applicationId]);

  async function handleViewNin() {
    setFetchingNin(true);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/view-nin`, {
        method: 'POST',
      });
      const json = await res.json();
      if (res.ok) {
        setDecryptedNin(json.data.decryptedNin);
      } else {
        setErrorMsg(json.error?.message || 'Could not decrypt NIN.');
      }
    } catch {
      setErrorMsg('Network error decrypting NIN.');
    } finally {
      setFetchingNin(false);
    }
  }

  async function handleDecisionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (decision === 'REJECT' && !rejectionReason.trim()) {
      setErrorMsg('Rejection reason is required when rejecting an application (FR-04).');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          rejectionReason: decision === 'REJECT' ? rejectionReason : undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error?.message || 'Failed to submit decision.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg(
        decision === 'APPROVE'
          ? 'Application approved! Status moved to Awaiting Down Payment Verification.'
          : 'Application rejected. Reserved stock released back to inventory.'
      );

      setSubmitting(false);
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch {
      setErrorMsg('Network error submitting review decision.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-spacing-12 text-center text-text-muted">Loading application review details...</div>;
  }

  if (!app && errorMsg) {
    return (
      <div className="bg-surface-primary p-spacing-6 rounded-radius-lg border border-border-default space-y-4">
        <div className="text-body-md text-badge-danger-fg">{errorMsg}</div>
        <Link href="/admin" className="text-brand-primary font-semibold hover:underline">
          ← Back to Owner Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-spacing-6">
      {/* Breadcrumb Navigation */}
      <nav className="text-body-sm text-text-muted">
        <Link href="/admin" className="hover:text-text-primary">Owner Dashboard</Link>
        <span className="mx-spacing-2">/</span>
        <span className="text-text-primary font-medium">Review Application</span>
      </nav>

      {/* Screen Title */}
      <div className="pb-spacing-3 border-b border-border-default">
        <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
          Review Customer Part-Payment Application
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Owner Credit & Guarantor Assessment (FR-04). Verify applicant legitimacy before counter down payment intake.
        </p>
      </div>

      {/* Error & Success Alerts */}
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

      {/* Application Details Summary */}
      <div className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm p-spacing-5 space-y-spacing-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-2 pb-spacing-3 border-b border-border-subtle">
          <div>
            <h2 className="text-title-sm font-bold text-text-primary">{app?.customerName}</h2>
            <div className="text-caption text-text-muted">Application ID: {app?.applicationId}</div>
          </div>
          <span className="px-spacing-2 py-0.5 rounded-radius-sm text-caption font-semibold bg-badge-warning-subtle text-badge-warning-fg self-start sm:self-auto">
            {app?.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-4 text-body-sm">
          <div>
            <span className="text-caption text-text-muted block">Phone Number</span>
            <span className="font-semibold text-text-primary">{app?.customerPhone}</span>
          </div>
          <div>
            <span className="text-caption text-text-muted block">Residential Address</span>
            <span className="text-text-primary">{app?.personalDetails}</span>
          </div>
          <div>
            <span className="text-caption text-text-muted block">Guarantor Name</span>
            <span className="font-semibold text-text-primary">{app?.guarantorName}</span>
          </div>
          <div>
            <span className="text-caption text-text-muted block">Guarantor Phone</span>
            <span className="font-semibold text-text-primary">{app?.guarantorPhone}</span>
          </div>
          <div className="sm:col-span-2 pt-spacing-2 border-t border-border-subtle">
            <span className="text-caption text-text-muted block">Requested Device</span>
            <span className="font-bold text-text-primary text-body-md">{app?.deviceName}</span>
          </div>
        </div>

        {/* Pricing Terms */}
        <div className="bg-surface-secondary p-spacing-4 rounded-radius-md grid grid-cols-3 gap-spacing-2 text-center text-body-sm">
          <div>
            <div className="text-caption text-text-muted">Locked Total</div>
            <div className="font-bold text-text-primary">₦{app?.lockedPriceNaira.toLocaleString()}</div>
          </div>
          <div className="border-x border-border-default">
            <div className="text-caption text-badge-warning-fg font-semibold">Down Payment ({app?.downPaymentPercent}%)</div>
            <div className="font-bold text-brand-primary">₦{app?.downPaymentAmountNaira.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-caption text-text-muted">Balance Due in 30 Days</div>
            <div className="font-bold text-text-secondary">₦{app?.remainingAmountNaira.toLocaleString()}</div>
          </div>
        </div>

        {/* NDPA Protected NIN Access Section */}
        <div className="p-spacing-4 rounded-radius-md border border-border-default bg-surface-secondary flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-3">
          <div>
            <span className="text-caption font-bold text-text-primary block">
              National Identity Number (NIN)
            </span>
            <span className="font-mono text-body-md text-text-primary">
              {decryptedNin ? decryptedNin : app?.customerNinMasked}
            </span>
            {decryptedNin && (
              <span className="text-caption text-badge-success-fg block mt-0.5">
                ✓ Decrypted & logged to AuditLog (NIN_ACCESS)
              </span>
            )}
          </div>

          {!decryptedNin && (
            <button
              type="button"
              disabled={fetchingNin}
              onClick={handleViewNin}
              className="px-spacing-3 py-spacing-1.5 rounded-radius-md bg-surface-primary text-text-primary text-caption font-semibold border border-border-default hover:bg-surface-tertiary transition-colors"
            >
              {fetchingNin ? 'Accessing...' : '👁️ View Decrypted NIN (PRD 8.4)'}
            </button>
          )}
        </div>
      </div>

      {/* Decision Form */}
      <form onSubmit={handleDecisionSubmit} className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm p-spacing-5 space-y-spacing-5">
        <h2 className="text-title-sm font-bold text-text-primary">
          Executive Review Decision
        </h2>

        {/* Approve vs Reject Selector */}
        <div className="grid grid-cols-2 gap-spacing-3">
          <button
            type="button"
            onClick={() => setDecision('APPROVE')}
            className={`p-spacing-3 text-center rounded-radius-md border text-body-sm font-semibold transition-all ${
              decision === 'APPROVE'
                ? 'border-brand-primary bg-badge-success-subtle text-badge-success-fg shadow-sm'
                : 'border-border-default bg-surface-primary text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            ✓ Approve for Counter Verification
          </button>
          <button
            type="button"
            onClick={() => setDecision('REJECT')}
            className={`p-spacing-3 text-center rounded-radius-md border text-body-sm font-semibold transition-all ${
              decision === 'REJECT'
                ? 'border-badge-danger-fg bg-badge-danger-subtle text-badge-danger-fg shadow-sm'
                : 'border-border-default bg-surface-primary text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            ✕ Reject Application
          </button>
        </div>

        {/* Mandatory Rejection Reason (FR-04) */}
        {decision === 'REJECT' && (
          <div className="space-y-1">
            <label className="block text-body-sm font-semibold text-badge-danger-fg">
              Rejection Reason (Required per FR-04)
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide specific reason (e.g. Unreachable guarantor after 3 attempts or unverified address in Banex environs)."
              className="w-full px-spacing-3 py-spacing-2 text-body-sm rounded-radius-md border border-badge-danger-fg bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-badge-danger-fg"
              required
            />
            <p className="text-caption text-text-muted">
              Note: Rejecting this application will immediately release the reserved unit back to general store inventory.
            </p>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-spacing-3 pt-spacing-2 border-t border-border-default">
          <button
            type="submit"
            disabled={submitting}
            className={`w-full sm:w-auto px-spacing-6 py-spacing-2 text-body-sm font-semibold rounded-radius-md text-text-inverse transition-colors ${
              decision === 'APPROVE'
                ? 'bg-brand-primary hover:bg-brand-hover active:bg-brand-active'
                : 'bg-badge-danger-fg hover:opacity-90'
            }`}
          >
            {submitting ? 'Recording Decision...' : decision === 'APPROVE' ? 'Approve Application' : 'Reject Application'}
          </button>

          <Link
            href="/admin"
            className="text-body-sm text-text-secondary hover:text-text-primary hover:underline"
          >
            Cancel and Return
          </Link>
        </div>
      </form>
    </div>
  );
}
