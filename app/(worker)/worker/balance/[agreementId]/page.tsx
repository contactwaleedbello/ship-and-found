'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { UX_STRINGS } from '@/lib/constants';

interface ContractData {
  applicationId: string;
  agreementId?: string;
  customerName: string;
  customerPhone: string;
  deviceName: string;
  lockedPriceNaira: number;
  downPaymentAmountNaira: number;
  remainingAmountNaira: number;
  status: string;
  dueDate?: string | null;
}

export default function RecordBalancePaymentPage() {
  const params = useParams();
  const router = useRouter();
  const agreementId = params['agreementId'] as string;

  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [amountInput, setAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadContract() {
      try {
        const res = await fetch(`/api/applications/${agreementId}`);
        if (!res.ok) {
          setErrorMsg('Contract agreement not found.');
          setLoading(false);
          return;
        }
        const json = await res.json();
        setContract(json.data);
      } catch {
        setErrorMsg('Network error loading contract details.');
      } finally {
        setLoading(false);
      }
    }
    void loadContract();
  }, [agreementId]);

  const numericAmount = parseFloat(amountInput) || 0;
  const isOverpayment = contract ? numericAmount > contract.remainingAmountNaira : false;
  const newBalanceEstimate = contract ? Math.max(0, contract.remainingAmountNaira - numericAmount) : 0;

  async function handleRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!contract) return;

    if (isOverpayment) {
      setErrorMsg(UX_STRINGS.OVERPAYMENT_BLOCKED);
      return;
    }

    if (numericAmount <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/worker/record-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId: contract.agreementId || contract.applicationId,
          amountNaira: numericAmount,
          paymentMethod,
          notes,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error?.message || 'Failed to record payment.');
        setSubmitting(false);
        return;
      }

      if (json.data.isCompleted) {
        setSuccessMsg(`Final payment of ₦${numericAmount.toLocaleString()} recorded! Contract is now COMPLETED.`);
      } else {
        setSuccessMsg(`Payment of ₦${numericAmount.toLocaleString()} recorded. New remaining balance: ₦${json.data.application.remainingAmountNaira.toLocaleString()}.`);
      }

      setSubmitting(false);
      setTimeout(() => {
        router.push('/worker');
      }, 2500);
    } catch {
      setErrorMsg('Network error recording balance payment.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-spacing-12 text-center text-text-muted">Loading agreement for balance payment...</div>;
  }

  if (!contract && errorMsg) {
    return (
      <div className="bg-surface-primary p-spacing-6 rounded-radius-lg border border-border-default space-y-4">
        <div className="text-body-md text-badge-danger-fg">{errorMsg}</div>
        <Link href="/worker" className="text-brand-primary font-semibold hover:underline">
          ← Back to Worker Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-spacing-6">
      {/* Breadcrumb Navigation */}
      <nav className="text-body-sm text-text-muted">
        <Link href="/worker" className="hover:text-text-primary">Worker Dashboard</Link>
        <span className="mx-spacing-2">/</span>
        <span className="text-text-primary font-medium">Record Balance Payment</span>
      </nav>

      {/* Screen Title */}
      <div className="pb-spacing-3 border-b border-border-default">
        <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
          Record Balance Payment
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Shop ATF 03 Counter Terminal. Collect customer balance installments with strict overpayment protection (FR-08).
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

      {/* Contract & Balance Status Card */}
      <div className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm p-spacing-5 space-y-spacing-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-2 pb-spacing-3 border-b border-border-subtle">
          <div>
            <div className="text-title-sm font-bold text-text-primary">{contract?.customerName}</div>
            <div className="text-caption text-text-muted">{contract?.customerPhone} • {contract?.deviceName}</div>
          </div>
          <span className="px-spacing-2 py-0.5 rounded-radius-sm text-caption font-semibold bg-badge-success-subtle text-badge-success-fg self-start sm:self-auto">
            {contract?.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-spacing-3">
          <div className="bg-surface-secondary p-spacing-3 rounded-radius-md">
            <span className="text-caption text-text-muted block">Locked Price</span>
            <span className="text-body-md font-bold text-text-primary">₦{contract?.lockedPriceNaira.toLocaleString()}</span>
          </div>
          <div className="bg-surface-secondary p-spacing-3 rounded-radius-md">
            <span className="text-caption text-text-muted block">Current Balance</span>
            <span className="text-body-md font-bold text-brand-primary">₦{contract?.remainingAmountNaira.toLocaleString()}</span>
          </div>
          <div className="bg-surface-secondary p-spacing-3 rounded-radius-md col-span-2 sm:col-span-1">
            <span className="text-caption text-text-muted block">Balance Due Date</span>
            <span className="text-body-sm font-medium text-text-primary">
              {contract?.dueDate ? new Date(contract.dueDate).toLocaleDateString() : 'Within 30 Days'}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Recording Form */}
      <form onSubmit={handleRecord} className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm p-spacing-5 space-y-spacing-5">
        <h2 className="text-title-sm font-bold text-text-primary">
          Payment Details
        </h2>

        {/* Payment Amount Input */}
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1">
            Payment Amount Received (₦)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-text-muted font-bold">₦</span>
            <input
              type="number"
              min="1"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="e.g. 25000"
              className={`w-full pl-8 pr-spacing-3 py-spacing-2 text-body-md font-semibold rounded-radius-md border bg-surface-primary text-text-primary focus:outline-none focus:ring-2 ${
                isOverpayment
                  ? 'border-badge-danger-fg focus:ring-badge-danger-fg'
                  : 'border-border-default focus:ring-focus'
              }`}
              required
            />
          </div>

          {/* Quick Pay Buttons */}
          {contract && contract.remainingAmountNaira > 0 && (
            <div className="flex items-center gap-spacing-2 mt-spacing-2">
              <span className="text-caption text-text-muted">Quick Amount:</span>
              <button
                type="button"
                onClick={() => setAmountInput(contract.remainingAmountNaira.toString())}
                className="text-caption font-semibold px-spacing-2 py-0.5 rounded-radius-sm bg-badge-neutral-subtle text-text-primary hover:bg-surface-secondary"
              >
                Pay Full Balance (₦{contract.remainingAmountNaira.toLocaleString()})
              </button>
            </div>
          )}

          {/* FR-08 Overpayment Warning */}
          {isOverpayment && (
            <div className="mt-spacing-2 text-caption font-bold text-badge-danger-fg flex items-center gap-1">
              ⚠️ {UX_STRINGS.OVERPAYMENT_BLOCKED} Maximum acceptable amount is ₦{contract?.remainingAmountNaira.toLocaleString()}.
            </div>
          )}

          {!isOverpayment && numericAmount > 0 && (
            <div className="mt-spacing-2 text-caption text-text-secondary">
              Remaining balance after this payment: <strong className="text-text-primary">₦{newBalanceEstimate.toLocaleString()}</strong>
              {newBalanceEstimate === 0 && <span className="ml-2 font-bold text-badge-success-fg">🎉 Fully completes contract!</span>}
            </div>
          )}
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-spacing-2">
            Payment Method
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

        {/* Notes / Reference */}
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1">
            Receipt / Transaction Reference (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. POS Ref #883921 or Counter Receipt #204"
            className="w-full px-spacing-3 py-spacing-2 text-body-sm rounded-radius-md border border-border-default bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-spacing-3 pt-spacing-2 border-t border-border-default">
          <button
            type="submit"
            disabled={submitting || isOverpayment || numericAmount <= 0}
            className="w-full sm:w-auto px-spacing-6 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active disabled:bg-surface-disabled disabled:text-text-disabled transition-colors"
          >
            {submitting ? 'Recording Payment...' : 'Record Payment & Issue Receipt'}
          </button>

          <Link
            href="/worker"
            className="text-body-sm text-text-secondary hover:text-text-primary hover:underline"
          >
            Cancel and Return
          </Link>
        </div>
      </form>
    </div>
  );
}
