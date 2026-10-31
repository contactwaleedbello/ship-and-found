import bcrypt from 'bcryptjs';

import { SEEDED_DEVICES } from '../lib/catalog-data';
import { computeBlindIndex, encryptField } from '../lib/crypto';
import { prisma } from '../lib/db';

/**
 * Database seed script for Development and Preview environments.
 * Source: PRD Sections 13.3, 16.1 and `.agents/rules/build-plan.md` (Seed data specification):
 * - Default Settings rows (freshness_window = 24, down_payment_min = 70, down_payment_max = 80, window_days = 30, expiry_hours = 24)
 * - Staff & test accounts: 1 Owner, 1 Co-owner, 2 Store Workers, and 3 Customers (including the Ahmed persona)
 * - 25 devices across 5 brands, 3 categories, and 3 performance tiers with Inventory and Price rows
 * - AuditLog row per seeded staff account
 */
export async function runSeed(): Promise<void> {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_PRODUCTION_SEED !== 'true'
  ) {
    throw new Error(
      'Refusing to run prisma/seed.ts in production without ALLOW_PRODUCTION_SEED=true'
    );
  }

  await prisma.$transaction(async (tx) => {
    const defaultSettings = [
      { key: 'freshness_window', value: '24' },
      { key: 'down_payment_min', value: '70' },
      { key: 'down_payment_max', value: '80' },
      { key: 'window_days', value: '30' },
      { key: 'expiry_hours', value: '24' },
      { key: 'exchange_rate_multiplier', value: '1.0000' },
    ];

    for (const s of defaultSettings) {
      await tx.settings.upsert({
        where: { setting_key: s.key },
        update: {
          setting_value: s.value,
          last_expiry_cron_at: new Date(),
          last_default_cron_at: new Date(),
        },
        create: {
          setting_key: s.key,
          setting_value: s.value,
          last_expiry_cron_at: new Date(),
          last_default_cron_at: new Date(),
        },
      });
    }

    const passwordHash = await bcrypt.hash('ShopAtf03!Temp2026', 12);

    const accounts = [
      {
        id: 'user-owner-01',
        phone: '+2348030000001',
        role: 'OWNER' as const,
        fullName: 'Alhaji Musa Danjuma (Owner)',
        nin: '10000000001',
      },
      {
        id: 'user-coowner-01',
        phone: '+2348030000002',
        role: 'CO_OWNER' as const,
        fullName: 'Hajiya Zainab Bello (Co-owner)',
        nin: '10000000002',
      },
      {
        id: 'user-worker-01',
        phone: '+2348030000003',
        role: 'STORE_WORKER' as const,
        fullName: 'Ibrahim Sadiq (Store Worker 1)',
        nin: '10000000003',
      },
      {
        id: 'user-worker-02',
        phone: '+2348030000004',
        role: 'STORE_WORKER' as const,
        fullName: 'Chidinma Okafor (Store Worker 2)',
        nin: '10000000004',
      },
      {
        id: 'user-customer-ahmed',
        phone: '+2348031234567',
        role: 'CUSTOMER' as const,
        fullName: 'Ahmed Abdullahi',
        nin: '12345678901',
      },
      {
        id: 'user-customer-02',
        phone: '+2348031234568',
        role: 'CUSTOMER' as const,
        fullName: 'Amina Yusuf',
        nin: '23456789012',
      },
      {
        id: 'user-customer-03',
        phone: '+2348031234569',
        role: 'CUSTOMER' as const,
        fullName: 'Tunde Bakare',
        nin: '34567890123',
      },
    ];

    for (const account of accounts) {
      await tx.user.upsert({
        where: { phone_number: account.phone },
        update: {
          role: account.role,
          account_status: 'ACTIVE',
          otp_verified_at: new Date(),
        },
        create: {
          user_id: account.id,
          phone_number: account.phone,
          password_hash: passwordHash,
          role: account.role,
          account_status: 'ACTIVE',
          otp_verified_at: new Date(),
        },
      });

      if (account.role === 'CUSTOMER') {
        await tx.customerProfile.upsert({
          where: { user_id: account.id },
          update: {
            full_name: account.fullName,
          },
          create: {
            user_id: account.id,
            full_name: account.fullName,
            nin: encryptField(account.nin, 'NIN'),
            nin_hash: computeBlindIndex(account.nin, 'NIN'),
            phone_number: encryptField(account.phone, 'PHONE'),
            phone_hash: computeBlindIndex(account.phone, 'PHONE'),
            personal_details: 'Banex Plaza Environs, Wuse 2, Abuja',
            guarantor_name: 'Mallam Suleiman Danjuma',
            guarantor_phone: '+2348039998877',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actor_id: account.id,
          action: 'SEED_ACCOUNT_CREATED',
          entity_type: 'User',
          entity_id: account.id,
          ip_address: '127.0.0.1',
          metadata: JSON.stringify({
            role: account.role,
            forcedPasswordChangeOnFirstLogin: account.role !== 'CUSTOMER',
          }),
        },
      });
    }

    for (const item of SEEDED_DEVICES) {
      await tx.device.upsert({
        where: { device_id: item.id },
        update: {
          brand: item.brand,
          model: item.model,
          category: item.category,
          performance_tier: item.performanceTier,
          battery_life_spec: item.batteryLifeSpec,
        },
        create: {
          device_id: item.id,
          brand: item.brand,
          model: item.model,
          category: item.category,
          performance_tier: item.performanceTier,
          battery_life_spec: item.batteryLifeSpec,
        },
      });

      await tx.inventory.upsert({
        where: { device_id: item.id },
        update: {
          stock_count: item.stockCount,
          reserved_count: item.reservedCount,
          base_price: item.basePriceNaira,
          inventory_status: 'APPROVED',
        },
        create: {
          device_id: item.id,
          stock_count: item.stockCount,
          reserved_count: item.reservedCount,
          base_price: item.basePriceNaira,
          inventory_status: 'APPROVED',
          approved_by_owner_id: 'user-owner-01',
        },
      });

      const lastUpdatedAt = item.isPriceFresh
        ? new Date()
        : new Date(Date.now() - 36 * 60 * 60 * 1000);

      await tx.price.upsert({
        where: { device_id: item.id },
        update: {
          exchange_rate_multiplier: 1.0,
          dynamic_price: item.dynamicPriceNaira,
          last_updated_at: lastUpdatedAt,
        },
        create: {
          device_id: item.id,
          exchange_rate_multiplier: 1.0,
          dynamic_price: item.dynamicPriceNaira,
          last_updated_at: lastUpdatedAt,
        },
      });
    }
  });
}

if (require.main === module) {
  runSeed()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error: unknown) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
