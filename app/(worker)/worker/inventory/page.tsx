'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import type { DeviceCardDto, InventoryApprovalDto } from '@/lib/types';

export default function WorkerInventoryPage() {
  const [devices, setDevices] = useState<DeviceCardDto[]>([]);
  const [proposals, setProposals] = useState<InventoryApprovalDto[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [proposedStock, setProposedStock] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [devRes, queueRes] = await Promise.all([
          fetch('/api/devices').then((r) => r.json()),
          fetch('/api/worker/queues').then((r) => r.json()),
        ]);

        setDevices(devRes.data || []);
        if (devRes.data?.[0]) {
          setSelectedDevice(devRes.data[0].id);
        }
        setProposals(queueRes.data?.inventoryUpdates || []);
      } catch {
        setErrorMsg('Failed to load catalog devices or proposals.');
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const stockNum = parseInt(proposedStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setErrorMsg('Enter a valid non-negative stock count.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Provide a reason for the inventory change.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/worker/inventory-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice,
          proposedStockCount: stockNum,
          reason,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error?.message || 'Failed to submit inventory proposal.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg('Inventory update proposal submitted for Owner approval (FR-13).');
      setProposals((prev) => [json.data, ...prev]);
      setProposedStock('');
      setReason('');
      setSubmitting(false);
    } catch {
      setErrorMsg('Network error submitting inventory proposal.');
      setSubmitting(false);
    }
  }

  const currentDev = devices.find((d) => d.id === selectedDevice);

  return (
    <div className="space-y-spacing-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-3 pb-spacing-4 border-b border-border-default">
        <div>
          <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
            Inventory Adjustments
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Submit stock count corrections and incoming shipments for Owner review and approval (FR-13).
          </p>
        </div>
        <Link
          href="/worker"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-spacing-6">
        {/* Proposal Submission Form */}
        <div className="lg:col-span-1 bg-surface-primary p-spacing-5 rounded-radius-lg border border-border-default shadow-sm space-y-spacing-4">
          <h2 className="text-title-sm font-bold text-text-primary">
            Submit Stock Proposal
          </h2>

          <form onSubmit={handleSubmit} className="space-y-spacing-4">
            <div>
              <label className="block text-caption font-semibold text-text-secondary mb-1">
                Select Catalog Device
              </label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full px-spacing-3 py-spacing-2 text-body-sm rounded-radius-md border border-border-default bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.stockCount} in stock)
                  </option>
                ))}
              </select>
            </div>

            {currentDev && (
              <div className="bg-surface-secondary p-spacing-3 rounded-radius-md text-caption text-text-secondary space-y-1">
                <div>Current Total Stock: <strong className="text-text-primary">{currentDev.stockCount} units</strong></div>
                <div>Currently Reserved: <strong className="text-text-primary">{currentDev.reservedCount} units</strong></div>
                <div>Available for Sale: <strong className="text-text-primary">{currentDev.availableStock} units</strong></div>
              </div>
            )}

            <div>
              <label className="block text-caption font-semibold text-text-secondary mb-1">
                New Total Physical Stock Count
              </label>
              <input
                type="number"
                min="0"
                value={proposedStock}
                onChange={(e) => setProposedStock(e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-spacing-3 py-spacing-2 text-body-sm rounded-radius-md border border-border-default bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
                required
              />
            </div>

            <div>
              <label className="block text-caption font-semibold text-text-secondary mb-1">
                Reason for Adjustment
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Received new shipment of 3 units at Shop ATF 03 counter"
                className="w-full px-spacing-3 py-spacing-2 text-body-sm rounded-radius-md border border-border-default bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active disabled:bg-surface-disabled transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Proposal for Approval'}
            </button>
          </form>
        </div>

        {/* Proposals History */}
        <div className="lg:col-span-2 bg-surface-primary rounded-radius-lg border border-border-default shadow-sm overflow-hidden">
          <div className="p-spacing-4 border-b border-border-default">
            <h2 className="text-title-sm font-bold text-text-primary">
              Recent Inventory Proposals
            </h2>
            <p className="text-caption text-text-secondary">
              Review history and decision statuses from store owner.
            </p>
          </div>

          {loading ? (
            <div className="p-spacing-8 text-center text-text-muted">Loading proposals...</div>
          ) : proposals.length === 0 ? (
            <div className="p-spacing-8 text-center text-text-muted text-body-sm">
              No inventory proposals submitted yet.
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {proposals.map((item) => (
                <div key={item.id} className="p-spacing-4 space-y-1 hover:bg-surface-secondary transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary text-body-sm">
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
                    Proposed Stock: <strong className="text-text-primary">{item.proposedStockCount} units</strong> (from {item.currentStockCount})
                  </div>
                  <div className="text-caption text-text-muted">
                    Reason: {item.reason} • Submitted by: {item.submittedByName || 'Worker'}
                  </div>
                  {item.decisionNotes && (
                    <div className="text-caption font-medium text-brand-primary">
                      Owner Decision Notes: {item.decisionNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
