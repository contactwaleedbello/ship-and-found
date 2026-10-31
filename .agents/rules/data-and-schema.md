# data-and-schema

Source: PRD Section 5.1, plus Sections 1.5, 3.3 (FR-01, FR-03, FR-06, FR-08, FR-10, FR-11), 3.4, 5.2, 5.3, 7.11, 7.12, 8.2, 8.5, 9.3, 9.6, 15.1, BR-09, BR-19

## Single job

This file is the authoritative specification for `prisma/schema.prisma`, database migration rules, multi-table transaction boundaries, referential integrity (`ON DELETE RESTRICT`), database indexes, and column-level data storage. Encryption algorithms and masking formats live in `security-baseline.md`.

## The one rule

If a table, column, or relationship is not in PRD Section 5.1 and not documented in the schema reconciliation tables below, it does not exist in `prisma/schema.prisma`. Do not invent tables or columns, because unapproved schema changes break Version 2 compatibility (`version-2-data.md`) and NDPA data minimization (`ndpa-compliance.md`). Stop and ask if a feature appears to need a missing column.

## PRD 5.1 reconciliation and the 16 cross-section additions

In earlier PRD drafts, 16 fields/tables required by Sections 1–17 were missing from Section 5.1. In Consolidated PRD v1.3 (`Context files/DG Tech Store PRD.md` lines 537–679), 15 of these 16 were merged directly into Section 5.1, and item 7 (`last_expiry_cron_at` and `last_default_cron_at`) replaces the single `last_cron_heartbeat_at` column on `Settings` per `cron.md` and `build-plan.md` Day 0 decision 20:

| # | Field or Table | Model | Required by | Status in Consolidated PRD v1.3 Section 5.1 |
|---|---|---|---|---|
| 1 | `otp_verified_at` | `User` | PRD 9.3, FR-03 | Present in PRD 5.1 `User` |
| 2 | `locked_until` | `User` | PRD 7.11, 9.3 | Present in PRD 5.1 `User` |
| 3 | `guarantor_name` | `CustomerProfile` | PRD 1.5, 5.2 | Present in PRD 5.1 `CustomerProfile` |
| 4 | `guarantor_phone` | `CustomerProfile` | PRD 1.5, 5.2 | Present in PRD 5.1 `CustomerProfile` |
| 5 | `reserved_count` | `Inventory` | PRD 3.3 FR-01 | Present in PRD 5.1 `Inventory` |
| 6 | `Settings` | `Settings` (table) | PRD 8.5 | Present in PRD 5.1 `Settings` |
| 7 | `last_expiry_cron_at`, `last_default_cron_at` | `Settings` | PRD 7.12, 15.1, `cron.md` | **Replaces** single `last_cron_heartbeat_at` per `build-plan.md` decision 20 so expiry and default heartbeats do not overwrite each other |
| 8 | `expires_at` | `PartPaymentApplication` | PRD 3.3 FR-03, 3.4 | Present in PRD 5.1 `PartPaymentApplication` |
| 9 | `customer_accepted_at` | `Agreement` | PRD 3.3 FR-06 | Present in PRD 5.1 `Agreement` |
| 10 | `acceptance_otp_verified` | `Agreement` | PRD 3.3 FR-06 | Present in PRD 5.1 `Agreement` |
| 11 | `verifier_ip` | `DownPaymentTransaction` | BR-19, PRD 9.3 | Present in PRD 5.1 `DownPaymentTransaction` |
| 12 | `SettlementLog` | `SettlementLog` (table) | PRD 3.3 FR-08 | Present in PRD 5.1 `SettlementLog` |
| 13 | `ConsentRecord` | `ConsentRecord` (table) | PRD 5.3, 16.2 | Present in PRD 5.1 `ConsentRecord` |
| 14 | `decision_reason` | `DataDeletionRequest` | PRD 3.3 FR-10 | Present in PRD 5.1 `DataDeletionRequest` |
| 15 | `anonymized_fields` | `DataDeletionRequest` | PRD 3.3 FR-10 | Present in PRD 5.1 `DataDeletionRequest` |
| 16 | `ip_address` | `AuditLog` | BR-19, PRD 9.3 | Present in PRD 5.1 `AuditLog` |

## Rejected field in PRD 5.1

| Field | Appears in | Excluded by | Action and reason |
|---|---|---|---|
| `receipt_image_url` on `DownPaymentTransaction` | PRD 5.1 line 624 & PRD 3.2 | PRD Section 6 (`Receipt upload` cut to protect 1-week timeline) | Keep column nullable (`String?`) in `prisma/schema.prisma` only if strict PRD 5.1 parity is desired for Version 2, or omit per Day 0 review, **never** read or write it in Version 1, and **never** build receipt upload UI or endpoints (`out-of-scope.md`). |

## Concrete column types and PRD 5.1 gap resolutions

To prevent precision bugs or query failures, use these rules for the 7 schema details where PRD 5.1 prose is terse:

1. **Purchase block storage (`BR-09`):** Do not add a `is_purchase_blocked` column. Derive the block at application submission by querying whether the customer (matched by `customer_id`, `nin`, or `phone_number`) has any `Agreement` with `agreement_status = 'Defaulted'` (since `Resolved` contracts change `agreement_status` to `'Resolved'`). Why: avoids state desynchronization between `Agreement.agreement_status` and a separate boolean flag.
2. **Encrypted NIN and phone exact-match lookup (`BR-09`, Login, Duplicate check):** Because AES-256-GCM uses a random IV per encryption (`security-baseline.md`), `WHERE nin = ?` or `WHERE phone_number = ?` cannot match ciphertext directly. On Day 0 (see `Unresolved before build` item 2), confirm whether to add deterministic HMAC-SHA256 blind-index columns (`nin_hash`, `phone_hash` keyed with `NIN_ENCRYPTION_KEY` / `PHONE_ENCRYPTION_KEY`) or keep `User.phone_number` normalized for auth lookup while `CustomerProfile.phone_number` and `CustomerProfile.nin` are AES-256-GCM encrypted. Do not write `prisma/schema.prisma` on Day 1 until this Day 0 item is confirmed.
3. **Money and percentage field types:**
   - All Naira monetary columns (`Inventory.base_price`, `Price.dynamic_price`, `PartPaymentApplication.locked_price`, `PartPaymentApplication.down_payment_amount`, `PartPaymentApplication.remaining_amount`, `Agreement.locked_price`, `DownPaymentTransaction.amount`, `BalancePaymentTransaction.amount`) use integer whole Naira (`Int` in Prisma, representing whole `₦`, e.g., `300000` for `₦300,000`), because Nigerian device prices and part-payments at Shop ATF 03 are whole Naira amounts and IEEE-754 floats lose precision (`code-conventions.md`). Also note: `Agreement` requires `remaining_amount` (or computing `locked_price - down_payment_amount - SUM(verified balance/settlement payments)` inside the transaction) to support `message-templates.md` `[Amount]` and `FR-08` overpayment checks.
   - `Price.exchange_rate_multiplier` and `PartPaymentApplication.down_payment_percent` use `Decimal` (`@db.Decimal(10, 4)`) or integer basis points (confirm on Day 0) so fractional multipliers (e.g., `1.1500`) and percentages (`70.0` to `80.0` per `PRD 13.1` unit test `69.9` vs `70.0`) never suffer float rounding.
4. **Status field types:** Use PostgreSQL/Prisma `String` validated at the application boundary by TypeScript string-literal union types and Zod enums from `state-transitions.md`, or Prisma `enum` types (confirm on Day 0). Why: `String` with Zod validation avoids `ALTER TYPE` migration locks if a status label is refined.
5. **Approver IP storage (`BR-19`):** Store the verifier IP in both `DownPaymentTransaction.verifier_ip` and the verification `AuditLog.ip_address`. Store the final approver IP in the final-approval `AuditLog.ip_address` (`action = 'FINAL_APPROVAL'`, `entity_id = application_id`). Compare the two inside the final-approval transaction without adding a duplicate column to `Agreement`.
6. **Daily reconciliation log (`BR-19`, `PRD 7.3`):** Record in `AuditLog` with `action = 'RECONCILIATION_DAILY'` and `entity_type = 'Reconciliation'`, avoiding a separate table.
7. **Auth session, OTP verification, and `InventoryApproval` (`build-plan.md` decision 18):**
   - `@auth/prisma-adapter` (`stack.md`) requires a database `Session` table, and OTP verification (`PRD 9.3`) requires storing the active OTP hash, expiry, and attempt count. Confirm on Day 0 whether OTP state is stored on `User` / `Agreement` or in an `OtpToken` table, and how `Inventory` pending worker updates (`build-plan.md` decision 18: `InventoryApproval` table vs `Inventory.inventory_status = 'PENDING_APPROVAL'` staging columns) are stored.

## Migration rules (`BR-20`, `PRD 14.4`)

- **Additive migrations only** in Version 1: new tables, new nullable columns, or new indexes.
- **No column drops, no table drops, no renames, and no type narrowing**, because Vercel instant rollback (`PRD 14.4`) reverts application code while the database keeps the latest migration; destructive migrations break rolled-back code.
- **All `FOREIGN KEY` constraints (`ON DELETE RESTRICT`) and `AuditLog` insert-only database grants must be created in the initial Day 1 migration before `prisma db seed` runs**, because adding constraints after seed risks rejecting existing rows.
- **Migration timeout:** Every migration must complete in under 10 minutes (`PRD 14.2`); if a migration exceeds 10 minutes during deploy, abort and roll back.
- **Naming and citation:** Give every migration a descriptive snake_case name (e.g., `20261101_initial_schema`) and cite `PRD 5.1` or the addition row number from this file in the PR description.

## Transaction boundaries (`PRD 8.2`, `9.6`)

Every multi-table write must execute inside a single `prisma.$transaction(async (tx) => { ... })` call inside `lib/services/*`. Partial commits are shipping bugs because they corrupt stock reservations or financial balances:

| Domain event | Operations inside one `prisma.$transaction` | Why atomic |
|---|---|---|
| Application submission | Read current `Price.dynamic_price` and `Inventory` (`stock_count - reserved_count >= 1` with atomic conditional update `WHERE stock_count - reserved_count >= 1`), increment `Inventory.reserved_count` by 1, insert `PartPaymentApplication` (`locked_price`, `expires_at = NOW() + 24h`, `application_status = 'Application Pending'`), insert pending `Agreement`, insert `AuditLog`. | Prevents double-booking the last unit (`PRD 13.1`) or locking a stale price |
| Application expiry (cron) | Conditional update `PartPaymentApplication` (`WHERE application_status = 'Application Pending' AND expires_at < NOW()` -> `'Expired'`), decrement `Inventory.reserved_count` by 1, insert `AuditLog`. | Ensures stock is never released without expiring the application |
| Application rejection | Conditional update `PartPaymentApplication` (`WHERE application_status = 'Application Pending'` -> `'Rejected'`, set `rejection_reason`, `reviewed_by`), decrement `Inventory.reserved_count` by 1, insert `AuditLog`. | Releases stock reservation atomically with rejection |
| Approve for verification | Conditional update `PartPaymentApplication` (`WHERE application_status = 'Application Pending'` -> `'Awaiting Down Payment Verification'`, set `reviewed_by`, `approved_at`), insert `AuditLog`. | Prevents approving an already-expired or rejected application |
| Down payment verification | Insert `DownPaymentTransaction` (with `verifier_ip` and `verification_checkbox = true`), update `PartPaymentApplication.application_status` to `'Awaiting Customer Acceptance'`, insert `AuditLog` (with `ip_address`). | Guarantees payment log, status change, and audit IP are never split |
| Agreement acceptance | Verify OTP, update `Agreement` (`customer_accepted_at = NOW()`, `acceptance_otp_verified = true`), update `PartPaymentApplication.application_status` to `'Awaiting Final Approval'`, upsert `ConsentRecord` if needed, insert `AuditLog`. | Prevents advancing to final approval without verified OTP proof |
| Final approval & activation | Validate inside transaction: (a) `DownPaymentTransaction` exists with `verification_checkbox = true`, (b) `Agreement.customer_accepted_at IS NOT NULL` and `acceptance_otp_verified = true`, (c) `approverUserId !== DownPaymentTransaction.recorded_by_worker_id` (`BR-13`). Update `PartPaymentApplication.application_status` and `Agreement.agreement_status` to `'Active Flexi-Pay Contract'`, set `Agreement.device_serial` and `Agreement.due_date` (`19:59 WAT` on day 30 = `18:59:00 UTC`), decrement `Inventory.stock_count` and `Inventory.reserved_count` by 1, insert `AuditLog` with approver `ip_address`. If approver `ip_address === verifier_ip`, record IP collision alert in `AuditLog`. | Enforces the core 3-way activation invariant (`AGENTS.md`) and prevents concurrent double-approval (`PRD 13.1`) |
| Balance payment | Lock `Agreement` row, compute remaining balance, reject with `OVERPAYMENT_BLOCKED` if `amount > remainingBalance` (`FR-08`), insert `BalancePaymentTransaction`, if `remainingBalance - amount === 0` update `Agreement.agreement_status` and `PartPaymentApplication.application_status` to `'Completed'`, insert `AuditLog`. | Prevents two simultaneous balance payments from overpaying (`PRD 13.1`) |
| Settlement payment | Lock Defaulted `Agreement` row, compute remaining balance, reject if `amount > remainingBalance`, insert `BalancePaymentTransaction` and `SettlementLog`, insert `AuditLog`. (Status stays `Defaulted` until Owner marks `Resolved` per `FR-09`.) | Keeps settlement ledger and balance calculation consistent |
| Default transition (cron) | Conditional update `Agreement` and `PartPaymentApplication` (`WHERE agreement_status = 'Active Flexi-Pay Contract' AND due_date < NOW()` -> `'Defaulted'`), insert `AuditLog`. | Idempotent batch transition (`cron.md`) |
| Resolve default | Verify inside transaction that remaining balance equals `0` (`FR-09`), update `Agreement.agreement_status` and `PartPaymentApplication.application_status` to `'Resolved'`, insert `AuditLog`. | Prevents resolving a default with an unpaid balance |
| Deletion decision | Update `DataDeletionRequest` (`decision`, `decision_reason`, `anonymized_fields`, `anonymized_at`, `reviewer_id`), if approved anonymize `CustomerProfile` identifying fields and `User.phone_number` to pseudonymous ID, insert `AuditLog` (never update existing `AuditLog` rows). | Ensures anonymization and audit record succeed or roll back together |
| Exchange rate update | Update `Price.exchange_rate_multiplier`, `Price.dynamic_price`, and `Price.last_updated_at` for all devices, update `Settings`, insert `AuditLog`. | Ensures all device prices reflect the new multiplier simultaneously |

## Referential integrity rules

- **Every foreign key uses `ON DELETE RESTRICT`** (no `CASCADE`, no `SET NULL`, no `NO ACTION`), because financial, contract, device, and audit records must never be deleted when a parent record is touched.
- **No `DELETE` queries on business tables** (`User`, `CustomerProfile`, `Device`, `Inventory`, `Price`, `PartPaymentApplication`, `Agreement`, `DownPaymentTransaction`, `BalancePaymentTransaction`, `SettlementLog`, `WhatsAppReminderLog`, `ConsentRecord`, `AuditLog`, `DataDeletionRequest`). Only `Session` / `OtpToken` rows may be deleted on logout or session invalidation (`security-baseline.md`).
- **NDPA right-to-erasure is implemented via `UPDATE` (anonymization) on `CustomerProfile` and `User`**, never via `DELETE` (`ndpa-compliance.md`).
- **`AuditLog` is insert-only at the PostgreSQL permission level:** The initial migration must `REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "AuditLog" FROM <app_db_user>` (`BR-12`, `ndpa-compliance.md`).

## Indexing rules

Create only the indexes below in the initial migration, because each backs a required Version 1 query while avoiding write-amplification overhead:

1. **All foreign key columns** (`CustomerProfile.user_id`, `Inventory.device_id`, `Price.device_id`, `PartPaymentApplication.customer_id`, `PartPaymentApplication.device_id`, `Agreement.application_id`, `DownPaymentTransaction.application_id`, `BalancePaymentTransaction.agreement_id`, `SettlementLog.agreement_id`, `SettlementLog.transaction_id`, `WhatsAppReminderLog.agreement_id`, `ConsentRecord.customer_id`, `DataDeletionRequest.customer_id`) — required for joins and fast `ON DELETE RESTRICT` checks.
2. **Queue and filter status columns:** `PartPaymentApplication(application_status)`, `Agreement(agreement_status)`, `User(role, account_status)`, `Device(brand, category, performance_tier)` — backs public filter queries and Worker/Owner queue views.
3. **Cron scan columns:** `PartPaymentApplication(application_status, expires_at)` and `Agreement(agreement_status, due_date)` — backs the 5-minute expiry cron and 20:00 WAT default cron (`cron.md`).
4. **AuditLog lookup columns:** `AuditLog(actor_id)`, `AuditLog(entity_type, entity_id)`, `AuditLog(timestamp DESC)` — backs the paginated Owner Audit Log screen and IP collision checks.
5. **WhatsAppReminderLog lookup:** `WhatsAppReminderLog(agreement_id, trigger_type)` — backs the Worker Reminder Checklist screen.

## Unresolved before build

Track in `working-agreements.md` and resolve on Day 0 (`build-plan.md`) before writing `prisma/schema.prisma`:

1. **Purchase block lookup (`AGENTS.md` Q2, `data-and-schema` gap 1 & 2):** Confirm deriving purchase block from `Agreement.agreement_status = 'Defaulted'` plus deterministic HMAC-SHA256 blind-index columns (`nin_hash`, `phone_hash`) so encrypted NIN and phone can be matched in SQL.
2. **Money and percentage Prisma column types (`data-and-schema` gap 3):** Confirm `Int` (whole Naira) for money and `Decimal(10,4)` for `exchange_rate_multiplier` and `down_payment_percent`, plus adding `remaining_amount` on `Agreement` (or computing it dynamically from transactions).
3. **Status column type (`data-and-schema` gap 4):** Confirm PostgreSQL `TEXT` + Zod enum validation vs PostgreSQL native `ENUM`.
4. **Auth `Session` and OTP storage tables (`stack.md`, `security-baseline.md`):** Confirm adding the NextAuth `Session` table and OTP fields/table required by `@auth/prisma-adapter` and `PRD 9.3`.
5. **`InventoryApproval` storage (`build-plan.md` Day 0 decision 18 / `AGENTS.md` Q11):** Confirm whether Worker inventory submissions use a dedicated `InventoryApproval` table or staging columns on `Inventory` (`inventory_status = 'PENDING_APPROVAL'`).
6. **`Settings` table layout (`build-plan.md` Day 0 decision 20 / `AGENTS.md` Q42):** Confirm whether `last_expiry_cron_at` and `last_default_cron_at` are dedicated timestamp columns on `Settings` or `setting_key` rows in `Settings`.
