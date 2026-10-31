'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import type { DeviceCardDto } from '@/lib/types';

export default function ExchangeRateSettingsPage() {
  const [multiplier, setMultiplier] = useState<string>('1.0000');
  const [sampleDevices, setSampleDevices] = useState<DeviceCardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSampleDevices() {
      try {
        const res = await fetch('/api/devices');
        if (res.ok) {
          const json = await res.json();
          setSampleDevices(json.data.slice(0, 6));
        }
      } catch {
        setErrorMsg('Failed to load sample devices.');
      } finally {
        setLoading(false);
      }
    }
    void loadSampleDevices();
  }, []);

  const numericMultiplier = parseFloat(multiplier) || 1.0;

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (numericMultiplier < 0.5 || numericMultiplier > 5.0) {
      setErrorMsg('Multiplier must be between 0.5000 and 5.0000.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/exchange-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rateMultiplier: numericMultiplier }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error?.message || 'Failed to update multiplier.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg(`Global exchange multiplier updated to ${numericMultiplier.toFixed(4)}! ${json.data.devicesUpdatedCount} catalog devices dynamically recalculated.`);
      setSubmitting(false);
    } catch {
      setErrorMsg('Network error updating exchange multiplier.');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-spacing-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-3 pb-spacing-4 border-b border-border-default">
        <div>
          <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
            Exchange Rate & Dynamic Multiplier Settings
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Global pricing controller for Shop ATF 03 (FR-13). Multiplier adjusts dynamic Naira prices automatically across the entire device catalog.
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

      {/* Multiplier Configuration Form */}
      <form onSubmit={handleUpdate} className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm p-spacing-5 space-y-spacing-5">
        <h2 className="text-title-sm font-bold text-text-primary">
          Global Pricing Multiplier
        </h2>

        <div className="max-w-md">
          <label className="block text-body-sm font-semibold text-text-primary mb-1">
            Exchange Multiplier (Decimal 10,4)
          </label>
          <div className="flex items-center gap-spacing-3">
            <input
              type="number"
              step="0.0001"
              min="0.5"
              max="5.0"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
              className="flex-1 px-spacing-3 py-spacing-2 text-title-sm font-bold font-mono rounded-radius-md border border-border-default bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-spacing-5 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active disabled:bg-surface-disabled transition-colors whitespace-nowrap"
            >
              {submitting ? 'Updating...' : 'Save & Recalculate'}
            </button>
          </div>
          <p className="text-caption text-text-muted mt-1">
            Example: A multiplier of 1.15 represents a 15% upward rate adjustment reflecting current parallel market rates in Abuja.
          </p>
        </div>

        {/* Live Dynamic Price Preview Table */}
        <div className="pt-spacing-4 border-t border-border-subtle">
          <div className="flex items-center justify-between mb-spacing-3">
            <div>
              <h3 className="text-body-md font-bold text-text-primary">
                Live Pricing Impact Preview
              </h3>
              <p className="text-caption text-text-secondary">
                Preview of catalog prices under active multiplier {numericMultiplier.toFixed(4)}. Equal visual weight preserved (FR-01).
              </p>
            </div>
            <span className="text-caption font-semibold px-spacing-2 py-0.5 rounded-radius-sm bg-badge-neutral-subtle text-badge-neutral-fg">
              Real-time Preview
            </span>
          </div>

          {loading ? (
            <div className="p-spacing-8 text-center text-text-muted">Loading preview devices...</div>
          ) : (
            <div className="overflow-x-auto rounded-radius-md border border-border-default">
              <table className="w-full text-left text-body-sm">
                <thead className="bg-surface-secondary border-b border-border-default text-caption font-semibold text-text-secondary">
                  <tr>
                    <th className="p-spacing-3">Device Name</th>
                    <th className="p-spacing-3">Battery Spec (FR-01)</th>
                    <th className="p-spacing-3">Base Price (₦)</th>
                    <th className="p-spacing-3">Multiplier</th>
                    <th className="p-spacing-3">Dynamic Price (FR-01)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {sampleDevices.map((dev) => {
                    const newDynamic = Math.round(dev.basePriceNaira * numericMultiplier);
                    return (
                      <tr key={dev.id} className="hover:bg-surface-secondary transition-colors">
                        <td className="p-spacing-3 font-semibold text-text-primary">{dev.name}</td>
                        <td className="p-spacing-3">
                          <span className="text-body-sm font-bold text-text-primary px-spacing-2 py-0.5 rounded-radius-sm bg-surface-secondary">
                            ⚡ {dev.batteryLifeSpec}
                          </span>
                        </td>
                        <td className="p-spacing-3 text-text-secondary">₦{dev.basePriceNaira.toLocaleString()}</td>
                        <td className="p-spacing-3 font-mono text-caption text-text-muted">× {numericMultiplier.toFixed(4)}</td>
                        <td className="p-spacing-3">
                          <span className="text-body-sm font-bold text-brand-primary">
                            ₦{newDynamic.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
