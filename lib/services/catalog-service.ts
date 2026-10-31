import { z } from 'zod';

import { SEEDED_DEVICES } from '@/lib/catalog-data';
import {
  BALANCE_WINDOW_DAYS,
  CONTRACT_INTEREST_RATE,
  CONTRACT_LATE_FEE_NAIRA,
  DOWN_PAYMENT_MAX_PERCENT,
  DOWN_PAYMENT_MIN_PERCENT,
  UX_STRINGS,
} from '@/lib/constants';
import { AppError } from '@/lib/errors';
import type { CalculatorResultDto, DeviceCardDto } from '@/lib/types';

/**
 * Catalog and Part-Payment Calculator service.
 * Source: PRD Sections 3.3 (FR-01, FR-02, FR-12), 4.1 (BR-02, BR-03, BR-04) and `.agents/rules/api-contracts.md`.
 */

export const deviceFilterSchema = z.object({
  brand: z.string().trim().optional(),
  category: z.string().trim().optional(),
  performance_tier: z.string().trim().optional(),
  battery_life: z.string().trim().optional(),
});

export type DeviceFilterInput = z.infer<typeof deviceFilterSchema>;

export const calculatorInputSchema = z.object({
  deviceId: z.string().trim().min(1, 'Select a valid device.'),
  downPaymentPercent: z
    .number({ invalid_type_error: 'Enter a numeric down-payment percentage.' })
    .min(
      DOWN_PAYMENT_MIN_PERCENT,
      `Down payment must be between ${DOWN_PAYMENT_MIN_PERCENT}% and ${DOWN_PAYMENT_MAX_PERCENT}% of the locked price.`
    )
    .max(
      DOWN_PAYMENT_MAX_PERCENT,
      `Down payment must be between ${DOWN_PAYMENT_MIN_PERCENT}% and ${DOWN_PAYMENT_MAX_PERCENT}% of the locked price.`
    ),
});

export type CalculatorInput = z.infer<typeof calculatorInputSchema>;

function parseMinBatteryHours(batteryFilter: string | undefined): number | null {
  if (!batteryFilter) return null;
  const numeric = Number.parseInt(batteryFilter.replace(/\D/g, ''), 10);
  return Number.isNaN(numeric) ? null : numeric;
}

export const catalogDevices = SEEDED_DEVICES;

export function listDevices(filters: DeviceFilterInput = {}): DeviceCardDto[] {
  const brandFilter = filters.brand?.toLowerCase();
  const categoryFilter = filters.category?.toLowerCase();
  const tierFilter = filters.performance_tier?.toLowerCase();
  const minBatteryHours = parseMinBatteryHours(filters.battery_life);

  return SEEDED_DEVICES.filter((device) => {
    if (brandFilter && device.brand.toLowerCase() !== brandFilter) {
      return false;
    }
    if (categoryFilter && device.category.toLowerCase() !== categoryFilter) {
      return false;
    }
    if (tierFilter && device.performanceTier.toLowerCase() !== tierFilter) {
      return false;
    }
    if (minBatteryHours !== null && device.batteryLifeHours < minBatteryHours) {
      return false;
    }
    return true;
  });
}

export function getDeviceById(deviceId: string): DeviceCardDto | null {
  const found = SEEDED_DEVICES.find((item) => item.id === deviceId);
  return found ?? null;
}

export function calculatePartPayment(input: CalculatorInput): CalculatorResultDto {
  const parsed = calculatorInputSchema.parse(input);
  const device = getDeviceById(parsed.deviceId);

  if (!device) {
    throw new AppError('NOT_FOUND', 404, UX_STRINGS.NOT_FOUND);
  }

  const downPaymentAmountNaira = Math.round(
    (device.dynamicPriceNaira * parsed.downPaymentPercent) / 100
  );
  const remainingBalanceNaira = device.dynamicPriceNaira - downPaymentAmountNaira;

  return {
    deviceId: device.id,
    deviceName: device.name,
    lockedPriceEstimateNaira: device.dynamicPriceNaira,
    downPaymentPercent: parsed.downPaymentPercent,
    downPaymentAmountNaira,
    remainingBalanceNaira,
    completionWindowDays: BALANCE_WINDOW_DAYS,
    interestRatePercent: CONTRACT_INTEREST_RATE,
    lateFeesNaira: CONTRACT_LATE_FEE_NAIRA,
    disclaimer: UX_STRINGS.CALCULATOR_DISCLAIMER,
  };
}
