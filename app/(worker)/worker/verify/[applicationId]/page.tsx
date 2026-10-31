'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { buildWhatsAppDeepLink } from '@/lib/templates';

interface ApplicationData {
  applicationId: string;
  customerName: string;
  customerPhone: string;
  customerNinMasked: string;
  guarantorName: string;
  guarantorPhone: string;
  deviceName: string;
  lockedPriceNaira: number;
  downPaymentPercent: number;
  downPaymentAmountNaira: number;
  remainingAmountNaira: number;
  status: string;
  downPaymentVerifiedAt?: string | null;
}

export default function VerifyDownPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params['applicationId'] as string;

  const [app, setApp] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [attestationChecked, setAttestationChecked] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/applications/${applicationId}`);
        if (!res.ok) {
          setErrorMsg('Failed to load application data. Refresh or check ID.');
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

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!attestationChecked) {
      setErrorMsg('You must confirm physical receipt of down payment before verifying (BR-06).');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/worker/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          paymentMethod,
          attestationChecked,
          notes,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error?.message || 'Verification failed. Try again.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg(`Down payment of ₦${app?.downPaymentAmountNaira.toLocaleString()} successfully verified via ${paymentMethod}! Application status advanced to ${json.data.application.status}.`);
      setSubmitting(false);

      setTimeout(() => {
        router.push('/worker');
      }, 2000);
    } catch {
      setErrorMsg('Could not record down payment. Check connection.');
      setSubmitting(false);
    }
  }

  async function handleResendOtp() {
    setOtpNotice('Dispatching fresh OTP to customer...');
    try {
      const res = await fetch('/api/worker/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });
      const json = await res.json();
      if (res.ok) {
        setOtpNotice(`New OTP dispatched! Test code: ${json.data.otpHint}`);
      } else {
        setOtpNotice(json.error?.message || 'Failed to dispatch OTP.');
      }
    } catch {
      setOtpNotice('Network error dispatching OTP.');
    }
  }

  if (loading) {
    return (
      <div className="p-spacing-12 text-center text-text-muted">
        Loading application details for verification...
      </div>
    );
  }

  if (!app && errorMsg) {
    return (
      <div className="bg-surface-primary p-spacing-6 rounded-radius-lg border border-border-default space-y-4">
        <div className="text-body-md text-badge-danger-fg">{errorMsg}</div>
        <Link href="/worker" className="text-brand-primary font-semibold hover:underline">
          ← Back to Worker Dashboard
        </Link>
      </div>
    );
  }

  const downPaymentReceivedWaLink = app
    ? buildWhatsAppDeepLink(
        app.customerPhone,
        `Hello ${app.customerName}, your down payment of ₦${app.downPaymentAmountNaira.toLocaleString()} for the ${app.deviceName} has been received and verified at DG Tech Store (Shop ATF 03). Thank you!`
      )
    : '#';

  return (
    <div className="max-w-3xl mx-auto space-y-spacing-6">
      {/* Breadcrumb Navigation */}
      <nav className="text-body-sm text-text-muted">
        <Link href="/worker" className="hover:text-text-primary">Worker Dashboard</Link>
        <span className="mx-spacing-2">/</span>
        <span className="text-text-primary font-medium">Verify Down Payment</span>
      </nav>

      {/* Screen Header */}
      <div className="pb-spacing-3 border-b border-border-default">
        <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
          Verify In-Store Down Payment
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Counter Verification at Shop ATF 03. Confirm cash or transfer receipt and record verifier attestation (BR-06).
        </p>
      </div>

      {/* Error / Success Alerts */}
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

      {/* Customer & Device Information Summary */}
      <div className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm p-spacing-5 space-y-spacing-4">
        <h2 className="text-title-sm font-bold text-text-primary">
          Customer & Order Specification
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-4 text-body-sm">
          <div>
            <span className="text-text-muted block text-caption">Customer Full Name</span>
            <span className="font-semibold text-text-primary">{app?.customerName}</span>
          </div>
          <div>
            <span className="text-text-muted block text-caption">Phone Number</span>
            <span className="font-semibold text-text-primary">{app?.customerPhone}</span>
          </div>
          <div>
            <span className="text-text-muted block text-caption">National Identity Number (NIN)</span>
            <span className="font-mono text-text-primary">{app?.customerNinMasked}</span>
          </div>
          <div>
            <span className="text-text-muted block text-caption">Guarantor Name & Phone</span>
            <span className="text-text-primary">{app?.guarantorName} ({app?.guarantorPhone})</span>
          </div>
          <div className="sm:col-span-2 pt-spacing-2 border-t border-border-subtle">
            <span className="text-text-muted block text-caption">Reserved Device</span>
            <span className="font-bold text-text-primary text-body-md">{app?.deviceName}</span>
          </div>
        </div>

        {/* Pricing & Down Payment Breakdown */}
        <div className="bg-surface-secondary p-spacing-4 rounded-radius-md grid grid-cols-3 gap-spacing-2 text-center">
          <div>
            <div className="text-caption text-text-muted">Locked Total</div>
            <div className="text-body-md font-bold text-text-primary">
              ₦{app?.lockedPriceNaira.toLocaleString()}
            </div>
          </div>
          <div className="border-x border-border-default">
            <div className="text-caption text-badge-warning-fg font-semibold">
              Down Payment ({app?.downPaymentPercent}%)
            </div>
            <div className="text-body-md font-bold text-brand-primary">
              ₦{app?.downPaymentAmountNaira.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-caption text-text-muted">Remaining Balance</div>
            <div className="text-body-md font-bold text-text-secondary">
              ₦{app?.remainingAmountNaira.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Form */}
      <form onSubmit={handleVerify} className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm p-spacing-5 space-y-spacing-5">
        <h2 className="text-title-sm font-bold text-text-primary">
          Counter Payment Verification
        </h2>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-spacing-2">
            Payment Method Received
          </label>
          <div className="grid grid-cols-2 gap-spacing-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`p-spacing-3 text-center rounded-radius-md border text-body-sm font-semibold transition-all ${
                paymentMethod === 'CASH'
                  ? 'border-brand-primary bg-surface-secondary text-brand-primary shadow-sm'
                  : 'border-border-default bg-surface-primary text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              💵 Cash at Counter
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('TRANSFER')}
              className={`p-spacing-3 text-center rounded-radius-md border text-body-sm font-semibold transition-all ${
                paymentMethod === 'TRANSFER'
                  ? 'border-brand-primary bg-surface-secondary text-brand-primary shadow-sm'
                  : 'border-border-default bg-surface-primary text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              📱 Bank Transfer / POS
            </button>
          </div>
        </div>

        {/* Counter Staff Notes */}
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1">
            Verification Reference / Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Stanbic IBTC POS Ref #49921 or Counter Cash Envelope #12"
            className="w-full px-spacing-3 py-spacing-2 text-body-sm rounded-radius-md border border-border-default bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
          />
        </div>

        {/* Mandatory BR-06 Attestation Checkbox */}
        <div className="p-spacing-4 rounded-radius-md bg-badge-warning-subtle border border-badge-warning-subtle">
          <label className="flex items-start gap-spacing-3 cursor-pointer">
            <input
              type="checkbox"
              checked={attestationChecked}
              onChange={(e) => setAttestationChecked(e.target.checked)}
              className="mt-1 h-4 w-4 rounded-radius-sm border-border-default text-brand-primary focus:ring-focus"
            />
            <span className="text-body-sm font-medium text-text-primary">
              <strong className="text-badge-warning-fg font-bold block mb-0.5">Mandatory Verifier Attestation (BR-06)</strong>
              I attest under penalty of shop policy that I have physically counted the cash or verified the confirmed credit alert for exactly ₦{app?.downPaymentAmountNaira.toLocaleString()} at Shop ATF 03 counter.
            </span>
          </label>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-spacing-3 pt-spacing-2 border-t border-border-default">
          <button
            type="submit"
            disabled={submitting || !attestationChecked}
            className="w-full sm:w-auto px-spacing-6 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active disabled:bg-surface-disabled disabled:text-text-disabled transition-colors"
          >
            {submitting ? 'Recording Verification...' : 'Confirm & Record Down Payment'}
          </button>

          <Link
            href="/worker"
            className="text-body-sm text-text-secondary hover:text-text-primary hover:underline"
          >
            Cancel and Return
          </Link>
        </div>
      </form>

      {/* Customer Assistance Helpers: WhatsApp & In-Person OTP */}
      <div className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm p-spacing-5 space-y-spacing-3">
        <h3 className="text-body-md font-bold text-text-primary">
          In-Store Customer Assistance
        </h3>
        <p className="text-body-sm text-text-secondary">
          If the customer is experiencing SMS delivery delays on their phone while at the counter, or requests immediate WhatsApp confirmation.
        </p>

        <div className="flex flex-wrap items-center gap-spacing-3 pt-spacing-1">
          <button
            type="button"
            onClick={handleResendOtp}
            className="px-spacing-4 py-spacing-2 text-body-sm font-medium rounded-radius-md border border-border-default bg-surface-secondary text-text-primary hover:bg-surface-tertiary transition-colors"
          >
            🔄 Dispatch OTP In-Person (PRD 7.8)
          </button>

          <a
            href={downPaymentReceivedWaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-spacing-4 py-spacing-2 text-body-sm font-medium rounded-radius-md border border-border-default bg-surface-secondary text-text-primary hover:bg-surface-tertiary transition-colors inline-flex items-center gap-spacing-2"
          >
            💬 Open WhatsApp Acknowledgment
          </a>
        </div>

        {otpNotice && (
          <div className="text-caption font-semibold text-brand-primary p-spacing-2 rounded-radius-sm bg-surface-secondary">
            {otpNotice}
          </div>
        )}
      </div>
    </div>
  );
}
