'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { UX_STRINGS } from '@/lib/constants';

interface AppActivationData {
  applicationId: string;
  agreementId?: string;
  customerName: string;
  customerPhone: string;
  deviceName: string;
  lockedPriceNaira: number;
  downPaymentAmountNaira: number;
  remainingAmountNaira: number;
  status: string;
  downPaymentVerifiedAt?: string | null;
  downPaymentVerifierId?: string | null;
  downPaymentVerifierIp?: string | null;
  downPaymentMethod?: string | null;
  acceptanceOtpVerified: boolean;
  customerAcceptedAt?: string | null;
}

export default function FinalApprovePage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params['id'] as string;

  const [app, setApp] = useState<AppActivationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceSerial, setDeviceSerial] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [ipCollisionAlert, setIpCollisionAlert] = useState(false);

  // Current session admin persona
  const currentAdminUserId = 'user-owner-dg';

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

  const isSameUserAsVerifier = app?.downPaymentVerifierId === currentAdminUserId;
  const isDownPaymentMissing = !app?.downPaymentVerifiedAt;
  const isOtpMissing = !app?.acceptanceOtpVerified;
  const canActivate = !isSameUserAsVerifier && !isDownPaymentMissing && !isOtpMissing;

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!deviceSerial.trim()) {
      setErrorMsg('Device serial number is mandatory for contract activation (BR-08).');
      return;
    }

    if (!canActivate) {
      setErrorMsg('Cannot activate: activation preconditions failed (BR-13).');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/final-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceSerial,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error?.message || 'Activation failed.');
        setSubmitting(false);
        return;
      }

      if (json.data.ipCollisionAlert) {
        setIpCollisionAlert(true);
      }

      setSuccessMsg(`Contract activated! Serial ${deviceSerial} assigned. 30-day repayment countdown initiated.`);
      setSubmitting(false);

      setTimeout(() => {
        router.push('/admin');
      }, 2500);
    } catch {
      setErrorMsg('Network error activating contract.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-spacing-12 text-center text-text-muted">Loading activation gate...</div>;
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
        <span className="text-text-primary font-medium">Dual-Control Final Approval</span>
      </nav>

      {/* Screen Title */}
      <div className="pb-spacing-3 border-b border-border-default">
        <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
          Dual-Control Final Approval & Contract Activation
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Owner Activation Gate (BR-13). Enforce strict separation of duties between counter verifier and activating owner.
        </p>
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
      {ipCollisionAlert && (
        <div className="p-spacing-4 rounded-radius-md bg-badge-warning-subtle text-badge-warning-fg border border-badge-warning-subtle text-body-sm font-medium">
          ⚠️ Security Audit Alert (BR-19): Verifier IP and Approver IP collision logged to audit trail.
        </div>
      )}

      {/* BR-13 Activation Precondition Checklist */}
      <div className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm p-spacing-5 space-y-spacing-4">
        <h2 className="text-title-sm font-bold text-text-primary">
          Mandatory Precondition Verification (BR-13)
        </h2>

        <div className="space-y-spacing-3">
          {/* Check 1: Down Payment Verification */}
          <div className="p-spacing-3 rounded-radius-md border border-border-subtle flex items-start gap-spacing-3">
            <span className="text-body-md mt-0.5">
              {!isDownPaymentMissing ? '✅' : '❌'}
            </span>
            <div className="text-body-sm">
              <span className="font-bold text-text-primary block">
                Condition 1: Physical Down Payment Verified (BR-06)
              </span>
              {!isDownPaymentMissing ? (
                <span className="text-text-secondary">
                  Verified by <strong className="text-text-primary">{app?.downPaymentVerifierId}</strong> on {app?.downPaymentVerifiedAt ? new Date(app.downPaymentVerifiedAt).toLocaleString() : 'N/A'} via {app?.downPaymentMethod}.
                </span>
              ) : (
                <span className="text-badge-danger-fg font-medium">
                  Down payment has not been verified yet by a store worker.
                </span>
              )}
            </div>
          </div>

          {/* Check 2: Customer Acceptance OTP */}
          <div className="p-spacing-3 rounded-radius-md border border-border-subtle flex items-start gap-spacing-3">
            <span className="text-body-md mt-0.5">
              {!isOtpMissing ? '✅' : '❌'}
            </span>
            <div className="text-body-sm">
              <span className="font-bold text-text-primary block">
                Condition 2: Customer Agreement Accepted with Verified OTP
              </span>
              {!isOtpMissing ? (
                <span className="text-text-secondary">
                  Verified by customer <strong className="text-text-primary">{app?.customerName}</strong> via 6-digit SMS OTP on {app?.customerAcceptedAt ? new Date(app.customerAcceptedAt).toLocaleString() : 'N/A'}.
                </span>
              ) : (
                <span className="text-badge-danger-fg font-medium">
                  Customer has not entered their verified acceptance OTP.
                </span>
              )}
            </div>
          </div>

          {/* Check 3: Dual Control Segregation */}
          <div className="p-spacing-3 rounded-radius-md border border-border-subtle flex items-start gap-spacing-3">
            <span className="text-body-md mt-0.5">
              {!isSameUserAsVerifier ? '✅' : '❌'}
            </span>
            <div className="text-body-sm">
              <span className="font-bold text-text-primary block">
                Condition 3: Independent Approver (Dual Control Segregation)
              </span>
              {!isSameUserAsVerifier ? (
                <span className="text-text-secondary">
                  Approver (<strong className="text-text-primary">{currentAdminUserId}</strong>) is distinct from counter verifier (<strong className="text-text-primary">{app?.downPaymentVerifierId}</strong>). Dual control satisfied.
                </span>
              ) : (
                <span className="text-badge-danger-fg font-bold">
                  {UX_STRINGS.SAME_USER_FINAL_APPROVAL}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contract Activation Form */}
      <form onSubmit={handleActivate} className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm p-spacing-5 space-y-spacing-5">
        <h2 className="text-title-sm font-bold text-text-primary">
          Device Handover & Physical Serial Assignment
        </h2>

        {/* Device & Terms Summary */}
        <div className="bg-surface-secondary p-spacing-4 rounded-radius-md text-body-sm space-y-1">
          <div className="font-bold text-text-primary text-body-md">{app?.deviceName}</div>
          <div className="text-text-secondary">Customer: {app?.customerName} ({app?.customerPhone})</div>
          <div className="text-text-secondary">
            Remaining Balance to Collect: <strong className="text-brand-primary">₦{app?.remainingAmountNaira.toLocaleString()}</strong> within 30 days
          </div>
        </div>

        {/* Mandatory Serial Input (BR-08) */}
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1">
            Physical Device Serial Number / IMEI (Required per BR-08)
          </label>
          <input
            type="text"
            value={deviceSerial}
            onChange={(e) => setDeviceSerial(e.target.value)}
            placeholder="e.g. SN-SAM-A15-994201 or 358941092841920"
            className="w-full px-spacing-3 py-spacing-2 text-body-md font-mono rounded-radius-md border border-border-default bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-focus uppercase"
            required
          />
          <p className="text-caption text-text-muted mt-1">
            Carefully transcribe the exact hardware serial printed on the device carton before handing unit to customer.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-spacing-3 pt-spacing-2 border-t border-border-default">
          <button
            type="submit"
            disabled={submitting || !canActivate || !deviceSerial.trim()}
            className="w-full sm:w-auto px-spacing-6 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active disabled:bg-surface-disabled disabled:text-text-disabled transition-colors"
          >
            {submitting ? 'Activating Contract...' : 'Activate Flexi-Pay Contract'}
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
