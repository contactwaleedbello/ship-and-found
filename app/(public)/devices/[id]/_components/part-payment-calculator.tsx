'use client';

import { useState, type ReactNode } from 'react';

import {
  BALANCE_WINDOW_DAYS,
  DOWN_PAYMENT_MAX_PERCENT,
  DOWN_PAYMENT_MIN_PERCENT,
  UX_STRINGS,
} from '@/lib/constants';

/**
 * Interactive Part-Payment Calculator (`FR-02`, `BR-02`, `BR-03`, `BR-04`).
 * Source:
 * - `.agents/rules/screen-inventory.md` Row #2 (Device Detail calculator)
 * - `.agents/rules/functional-requirements.md` FR-02
 * - `.agents/rules/ux-states.md` B.2 (Calculator disclaimer verbatim)
 */

interface PartPaymentCalculatorProps {
  deviceId: string;
  deviceName: string;
  dynamicPriceNaira: number;
}

function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

export function PartPaymentCalculator({
  deviceId,
  deviceName,
  dynamicPriceNaira,
}: PartPaymentCalculatorProps): ReactNode {
  const [percentInput, setPercentInput] = useState<string>(String(DOWN_PAYMENT_MIN_PERCENT));
  const [validationError, setValidationError] = useState<string | null>(null);

  const parsedPercent = Number.parseFloat(percentInput);
  const clampedPercent = Number.isNaN(parsedPercent)
    ? DOWN_PAYMENT_MIN_PERCENT
    : Math.min(DOWN_PAYMENT_MAX_PERCENT, Math.max(DOWN_PAYMENT_MIN_PERCENT, parsedPercent));

  const downPaymentAmountNaira = Math.round((dynamicPriceNaira * clampedPercent) / 100);
  const remainingBalanceNaira = dynamicPriceNaira - downPaymentAmountNaira;

  function validatePercent(raw: string): void {
    const num = Number.parseFloat(raw);
    if (
      Number.isNaN(num) ||
      num < DOWN_PAYMENT_MIN_PERCENT ||
      num > DOWN_PAYMENT_MAX_PERCENT
    ) {
      setValidationError(
        `Down payment must be between ${DOWN_PAYMENT_MIN_PERCENT}% and ${DOWN_PAYMENT_MAX_PERCENT}% of the locked price.`
      );
    } else {
      setValidationError(null);
    }
  }

  return (
    <section
      aria-labelledby="calculator-heading"
      className="bg-surface-container border border-outline-variant rounded-card p-card-pad flex flex-col gap-gap-v-md"
      data-device-id={deviceId}
    >
      <div className="flex flex-col gap-gap-v-xs">
        <h2 id="calculator-heading" className="type-headline-small text-surface-on">
          Flexi-Pay Part-Payment Calculator
        </h2>
        <p className="type-body-medium text-surface-on-variant">
          Estimate your {DOWN_PAYMENT_MIN_PERCENT}%–{DOWN_PAYMENT_MAX_PERCENT}% upfront down payment and{' '}
          {BALANCE_WINDOW_DAYS}-day balance for {deviceName}.
        </p>
      </div>

      <div className="flex flex-col gap-gap-v-xs">
        <label htmlFor="down-payment-percent" className="type-label-large text-surface-on">
          Down-Payment Percentage ({DOWN_PAYMENT_MIN_PERCENT}% to {DOWN_PAYMENT_MAX_PERCENT}%)
        </label>
        <div className="flex flex-wrap items-center gap-gap-h-md">
          <input
            id="down-payment-percent"
            type="number"
            min={DOWN_PAYMENT_MIN_PERCENT}
            max={DOWN_PAYMENT_MAX_PERCENT}
            step={1}
            value={percentInput}
            onChange={(event) => {
              setPercentInput(event.target.value);
              if (validationError) {
                validatePercent(event.target.value);
              }
            }}
            onBlur={(event) => validatePercent(event.target.value)}
            aria-invalid={validationError ? 'true' : 'false'}
            aria-describedby="calculator-disclaimer down-payment-error"
            className="bg-surface text-surface-on border border-outline rounded-input px-input-px py-input-py type-body-large"
          />
          <div className="flex items-center gap-gap-h-xs">
            {[70, 75, 80].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setPercentInput(String(preset));
                  setValidationError(null);
                }}
                className="bg-secondary-container text-secondary-on-container rounded-chip px-pad-sm py-pad-xs type-label-medium"
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>
        {validationError ? (
          <p id="down-payment-error" role="alert" className="type-body-small text-error">
            {validationError}
          </p>
        ) : null}
      </div>

      <dl className="grid grid-cols-1 gap-gap-v-sm sm:grid-cols-3">
        <div className="bg-surface-low border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
          <dt className="type-label-medium text-surface-on-variant">
            Down Payment ({clampedPercent}%)
          </dt>
          <dd className="type-title-large text-surface-on">
            {formatNaira(downPaymentAmountNaira)}
          </dd>
        </div>

        <div className="bg-surface-low border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
          <dt className="type-label-medium text-surface-on-variant">
            Remaining Balance ({100 - clampedPercent}%)
          </dt>
          <dd className="type-title-large text-surface-on">
            {formatNaira(remainingBalanceNaira)}
          </dd>
        </div>

        <div className="bg-surface-low border border-outline-variant rounded-card p-pad-sm flex flex-col gap-gap-v-xs">
          <dt className="type-label-medium text-surface-on-variant">Completion Window</dt>
          <dd className="type-title-large text-surface-on">
            {BALANCE_WINDOW_DAYS} Days (0% Interest)
          </dd>
        </div>
      </dl>

      <p
        id="calculator-disclaimer"
        className="bg-info-container text-info-on-container rounded-card p-pad-sm type-body-small"
      >
        {UX_STRINGS.CALCULATOR_DISCLAIMER}
      </p>
    </section>
  );
}
