'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface ContractData {
  applicationId: string;
  agreementId?: string;
  customerName: string;
  customerPhone: string;
  deviceName: string;
  lockedPriceNaira: number;
  remainingAmountNaira: number;
  status: string;
}

export default function RecordSettlementPaymentPage() {
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

  async function handleRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!contract) return;

    if (numericAmount <= 0) {
      setErrorMsg('Settlement amount must be greater than zero.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/worker/record-settlement', {
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
        setErrorMsg(json.error?.message || 'Failed to record settlement payment.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg(`Settlement payment of ₦${numericAmount.toLocaleString()} recorded. Remaining balance: ₦${json.data.application.remainingAmountNaira.toLocaleString()}.`);
      setSubmitting(false);
      setTimeout(() => {
        router.push('/worker');
      }, 2500);
    } catch {
      setErrorMsg('Network error recording settlement payment.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-spacing-12 text-center text-text-muted">Loading defaulted contract...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-spacing-6">
      {/* Breadcrumb Navigation */}
      <nav className="text-body-sm text-text-muted">
        <Link href="/worker" className="hover:text-text-primary">Worker Dashboard</Link>
        <span className="mx-spacing-2">/</span>
        <span className="text-text-primary font-medium">Record Settlement Payment</span>
      </nav>

      {/* Screen Title */}
      <div className="pb-spacing-3 border-b border-border-default">
        <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
          Record Default Settlement Payment
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Debt Recovery Terminal. Record recovery payments received for defaulted flexi-pay contracts (FR-08).
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

      {/* Defaulted Contract Summary */}
      <div className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm p-spacing-5 space-y-spacing-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-2 pb-spacing-3 border-b border-border-subtle">
          <div>
            <div className="text-title-sm font-bold text-text-primary">{contract?.customerName}</div>
            <div className="text-caption text-text-muted">{contract?.customerPhone} • {contract?.deviceName}</div>
          </div>
          <span className="px-spacing-2 py-0.5 rounded-radius-sm text-caption font-semibold bg-badge-danger-subtle text-badge-danger-fg self-start sm:self-auto">
            Defaulted Contract
          </span>
        </div>

        <div className="grid grid-cols-2 gap-spacing-3">
          <div className="bg-surface-secondary p-spacing-3 rounded-radius-md">
            <span className="text-caption text-text-muted block">Locked Price</span>
            <span className="text-body-md font-bold text-text-primary">₦{contract?.lockedPriceNaira.toLocaleString()}</span>
          </div>
          <div className="bg-surface-secondary p-spacing-3 rounded-radius-md">
            <span className="text-caption text-text-muted block">Outstanding Debt Balance</span>
            <span className="text-body-md font-bold text-badge-danger-fg">₦{contract?.remainingAmountNaira.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Settlement Payment Form */}
      <form onSubmit={handleRecord} className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm p-spacing-5 space-y-spacing-5">
        <h2 className="text-title-sm font-bold text-text-primary">
          Settlement Collection Details
        </h2>

        {/* Payment Amount Input */}
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1">
            Settlement Amount Received (₦)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-text-muted font-bold">₦</span>
            <input
              type="number"
              min="1"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full pl-8 pr-spacing-3 py-spacing-2 text-body-md font-semibold rounded-radius-md border border-border-default bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
              required
            />
          </div>
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
              💵 Cash Recovery
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
              📱 Bank Transfer / Direct Recovery
            </button>
          </div>
        </div>

        {/* Settlement Notes */}
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1">
            Recovery / Settlement Notes (Required)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record payment arrangement terms, remaining obligation, and customer acknowledgments."
            className="w-full px-spacing-3 py-spacing-2 text-body-sm rounded-radius-md border border-border-default bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
            required
          />
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-spacing-3 pt-spacing-2 border-t border-border-default">
          <button
            type="submit"
            disabled={submitting || numericAmount <= 0}
            className="w-full sm:w-auto px-spacing-6 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active disabled:bg-surface-disabled disabled:text-text-disabled transition-colors"
          >
            {submitting ? 'Recording Settlement...' : 'Record Settlement Recovery'}
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
