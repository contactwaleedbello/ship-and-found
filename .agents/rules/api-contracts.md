# api-contracts

Source: PRD Sections 8.3, 8.5, 11, 7.8, 2.2.2, 3.3, 5.1, 10, 14.3, 15.1

## Single job

This file is the complete inventory of API endpoints for DG Tech Store Version 1: HTTP method, URL path, permitted roles, and domain effect. Wire envelopes, status codes, pagination, CSRF, and IDOR rules live in `api-design.md`; fine-grained permission rules live in `permission-matrix.md`. If an endpoint is not listed here, do not build it; stop and ask (`working-agreements.md`).

## Active Version 1 endpoints (42 endpoints across 13 route groups)

Format: `METHOD /api/... | Allowed role(s) | Domain effect and governing rules`

### 1. Authentication (7 endpoints)

- `POST /api/auth/register` | Public (`Visitor`) | Create `User` (`Customer`) and initial `ConsentRecord` (`PRD 13.1`), send 6-digit registration SMS OTP (`notification-matrix.md`), write `AuditLog`.
- `POST /api/auth/verify-otp` | Public (`Visitor`) | Verify 6-digit registration OTP (max 3 attempts, 10m expiry per `security-baseline.md`), set `User.otp_verified_at = NOW()`, write `AuditLog`.
- `POST /api/auth/login` | Public (`All`) | Authenticate with phone and password (`bcryptjs` cost 12), reject if `locked_until > NOW()` (`PRD 7.11`), regenerate session token (`PRD 13.4`), issue database session cookie + CSRF cookie, write `AuditLog`.
- `POST /api/auth/logout` | Authenticated (`Customer`, `Store Worker`, `Owner`, `Co-owner`) | Delete current database session row, clear cookies, write `AuditLog`.
- `POST /api/auth/forgot-password` | Public (`All`) | Generate and send 6-digit password-reset SMS OTP (`PRD 9.3`). No session created.
- `POST /api/auth/reset-password` | Public (`All`) | Verify reset OTP, update `password_hash`, set `User.locked_until = NOW() + 24 hours` (`PRD 7.11`, `9.3`), delete all existing sessions for that `user_id`, write `AuditLog`.
- `POST /api/auth/accept-agreement-otp` | `Customer` | Generate and send 6-digit SMS OTP for agreement acceptance (`FR-06`, `PRD 8.3`, `11`).

### 2. Inventory and Pricing (3 endpoints — public read)

- `GET /api/devices` | Public (`All`) | List devices filtered by `brand`, `category`, `performance_tier`, `battery_life`. Returns `available_stock` (`stock_count - reserved_count`), `dynamic_price`, `battery_life_spec`, and `is_price_fresh` per device (`FR-01`).
- `GET /api/devices/:id` | Public (`All`) | Return single device specifications, `available_stock`, `dynamic_price`, and `is_price_fresh` (`FR-01`, `FR-12`).
- `POST /api/calculator` | Public (`All`) | Compute `downPaymentAmount`, `remainingBalance`, and 30-day completion window for a `deviceId` and `downPaymentPercent` (`70%–80%`). Read-only; no database writes (`FR-02`).

### 3. Applications (4 endpoints)

- `POST /api/applications` | `Customer` | Atomic submission (`data-and-schema.md`): validate NIN (`^\d{11}$`), Nigerian phone, `70%–80%` down payment (`BR-02`), stock `>= 1`, fresh price (`BR-05`), no `Defaulted` purchase block (`BR-09`), no 24h duplicate (`PRD 9.2`). Lock price, increment `reserved_count`, set `expires_at = NOW() + 24h`, create `PartPaymentApplication` and pending `Agreement`, write `AuditLog`.
- `GET /api/applications/mine` | `Customer` | List the authenticated customer's own applications (`screen-inventory.md` `My Applications`).
- `GET /api/applications/:id` | `Customer` (owner only; returns `404` if owned by another customer per `PRD 13.4`), `Store Worker`, `Owner`, `Co-owner` | Return single application detail (with NIN masked for `Store Worker` and decrypted with `NIN_ACCESS` audit log for `Owner`/`Co-owner` per `permission-matrix.md`).
- `POST /api/applications/:id/accept-agreement` | `Customer` (owner only) | Verify 6-digit agreement OTP and atomically set `Agreement.customer_accepted_at = NOW()`, `acceptance_otp_verified = true`, `application_status = 'Awaiting Final Approval'`, and write `AuditLog` (`FR-06`, `state-transitions.md`).

### 4. Owner / Co-owner Application Approvals (4 endpoints)

- `GET /api/admin/applications` | `Owner`, `Co-owner` | List applications filtered by queue (`New Applications`, `Awaiting Final Approval`, etc.), paginated at 50 rows (`api-design.md`). NIN omitted on list view (`permission-matrix.md`).
- `POST /api/admin/applications/:id/approve-for-verification` | `Owner`, `Co-owner` | Transition `Application Pending -> Awaiting Down Payment Verification`, set `reviewed_by` and `approved_at`, write `AuditLog` (`FR-04`, `state-transitions.md`).
- `POST /api/admin/applications/:id/reject` | `Owner`, `Co-owner` | Require `rejection_reason`; transition `Application Pending -> Rejected`, decrement `Inventory.reserved_count`, release price lock, write `AuditLog` (`FR-04`, `state-transitions.md`).
- `POST /api/admin/applications/:id/final-approve` | `Owner`, `Co-owner` | Inside one transaction (`state-transitions.md` #7): validate Worker verification exists, customer OTP acceptance exists, `approverUserId !== verifierUserId` (`BR-13`), and `device_serial` provided (`BR-08`). Activate contract (`Active Flexi-Pay Contract`), set `due_date` (`19:59 WAT` day 30), decrement `stock_count` and `reserved_count`, log approver IP, and trigger IP collision alert if `approver_ip === verifier_ip` (`BR-19`).

### 5. Store Worker Payments & OTP Fallback (5 endpoints)

- `GET /api/worker/payments-to-verify` | `Store Worker` | List applications in `Awaiting Down Payment Verification` queue (`FR-05`).
- `POST /api/worker/down-payment` | `Store Worker` | Record `DownPaymentTransaction` with `verifier_ip` and `verification_checkbox = true`, transition application to `Awaiting Customer Acceptance`, write `AuditLog` (`FR-05`, `BR-06`, `BR-19`).
- `POST /api/worker/balance-payment` | `Store Worker` | Record `BalancePaymentTransaction` on an `Active Flexi-Pay Contract`. Block overpayment (`amount > remaining_amount`) with `400 OVERPAYMENT_BLOCKED` (`"Amount exceeds remaining balance."`). Transition to `Completed` if `remaining_amount` reaches `0`, write `AuditLog` (`FR-08`).
- `POST /api/worker/settlement-payment` | `Store Worker` | Record `BalancePaymentTransaction` and `SettlementLog` on a `Defaulted` contract, blocking overpayment, and write `AuditLog` (`FR-08`).
- `POST /api/worker/otp-resend` | `Store Worker` | Trigger in-person SMS OTP resend for a customer at Shop ATF 03 and write `AuditLog` (`PRD 7.8`, `8.3`).

### 6. Store Worker Reminders (2 endpoints)

- `GET /api/worker/reminders` | `Store Worker` | Return checklist of due manual WhatsApp notifications (`T-7`, `T-3`, `T-1`, `T-0`, `T+1`, plus pending `A.2`, `A.5`, `A.6` sends) with pre-rendered templates from `message-templates.md` (`FR-07`).
- `POST /api/worker/reminders/mark-sent` *(also alias `POST /api/worker/reminders/:id/mark-sent` where `:id` is `agreement_id` for strict PRD 8.3 path compatibility)* | `Store Worker` | Accept `{ agreementId, triggerType, messageContent }`, insert `WhatsAppReminderLog` row (`sent_by`, `sent_at = NOW()`), and write `AuditLog` (`FR-07`). *Why alias both paths:* PRD 8.3 wrote `:id/mark-sent` even though `WhatsAppReminderLog` rows are created on send; supporting `:id` as `agreement_id` (or body params) satisfies both PRD 8.3 and the schema (`AGENTS.md` Q12).

### 7. Inventory Updates and Approvals (4 endpoints)

- `POST /api/worker/inventory` | `Store Worker` | Submit proposed `stock_count` and/or `base_price` update for Owner approval (`FR-13`).
- `GET /api/admin/inventory-approvals` | `Owner`, `Co-owner` | List pending Store Worker inventory updates (`FR-13`).
- `POST /api/admin/inventory-approvals/:id/approve` | `Owner`, `Co-owner` | Apply approved `stock_count` / `base_price` to `Inventory`, recalculate `Price.dynamic_price` and `last_updated_at`, write `AuditLog` (`FR-13`).
- `POST /api/admin/inventory-approvals/:id/reject` | `Owner`, `Co-owner` | Reject proposed inventory change and write `AuditLog` (`FR-13`).
*(Note: Requires resolving `build-plan.md` Day 0 decision 18 on whether pending updates use an `InventoryApproval` table or staging fields on `Inventory`.)*

### 8. Exchange Rate (1 endpoint)

- `POST /api/admin/exchange-rate` | `Owner`, `Co-owner` | Update `exchange_rate_multiplier` and recalculate `Price.dynamic_price` and `last_updated_at` for all devices inside one transaction, writing `AuditLog` (`FR-13`, `data-and-schema.md`).

### 9. Defaults (2 endpoints)

- `GET /api/admin/defaults` | `Owner`, `Co-owner` | List `Defaulted` contracts with device serial, remaining balance, and settlement logs (`FR-09`).
- `POST /api/admin/defaults/:id/resolve` | `Owner`, `Co-owner` | Verify `remaining_amount == 0` inside transaction, transition contract to `Resolved` (lifting `BR-09` purchase block), and write `AuditLog` (`FR-09`, `state-transitions.md`).

### 10. NDPA Data Deletion (3 endpoints)

- `POST /api/customer/deletion-request` | `Customer` | Create formal `DataDeletionRequest` from `Account Settings` and write `AuditLog` (`FR-10`).
- `GET /api/admin/deletion-requests` | `Owner`, `Co-owner` | List deletion requests for review (`FR-10`).
- `POST /api/admin/deletion-requests/:id/decide` | `Owner`, `Co-owner` | Reject if customer has an `Active Flexi-Pay Contract` or `Defaulted` contract (`reason: "retention required"`); otherwise record decision, anonymize `CustomerProfile` / `User` via `UPDATE`, and write `AuditLog` (`FR-10`, `ndpa-compliance.md`).

### 11. Audit and Metrics (2 endpoints)

- `GET /api/admin/audit` | `Owner`, `Co-owner` | Return paginated `AuditLog` rows (50 rows/page, `< 1s` P95 per `non-functional.md`) with filters for `actor_id`, `action`, `entity_type`, and date range (`FR-11`).
- `GET /api/admin/metrics` | `Owner`, `Co-owner` | Compute and return the 5 Success Metrics (`success-metrics.md`), returning `"Not available"` for Repeat Browsing Rate.

### 12. Scheduled Cron Jobs (4 `GET` endpoints — `cron.md`, `build-plan.md` decision 19)

*(Normative correction: PRD 8.3 originally listed 2 `POST` cron routes, but Vercel Cron invokes scheduled routes via HTTP `GET` and PRD 14.3 requires 15-minute heartbeat checker jobs. Per `cron.md` and `build-plan.md` decision 19, all 4 cron routes use `GET` and authenticate via the `CRON_SECRET` header.)*

- `GET /api/cron/expire-applications` | `CRON_SECRET` header | Runs every 5 minutes (`*/5 * * * *`). Transitions overdue `Application Pending` rows to `Expired`, releases stock reservation and price lock, writes `AuditLog`, and updates `Settings.last_expiry_cron_at` (`cron.md`).
- `GET /api/cron/default-contracts` | `CRON_SECRET` header | Runs daily at `20:00 WAT` (`0 19 * * *` UTC). Transitions overdue `Active Flexi-Pay Contract` rows (`due_date < NOW()`) to `Defaulted`, applies default flag and purchase block, writes `AuditLog`, and updates `Settings.last_default_cron_at` (`cron.md`, `BR-03`).
- `GET /api/cron/check-expiry-heartbeat` | `CRON_SECRET` header | Checks that `Settings.last_expiry_cron_at` is within 15 minutes of `NOW()`; raises Owner/Co-owner in-app alert if stale (`cron.md`).
- `GET /api/cron/check-default-heartbeat` | `CRON_SECRET` header | Runs daily at `20:15 WAT` (`15 19 * * *` UTC). Checks that `Settings.last_default_cron_at` is within 24 hours + 15 minutes of `NOW()`; raises Owner/Co-owner in-app alert if stale (`cron.md`).

### 13. System Health (1 endpoint — `monitoring.md`, `build-plan.md` decision 21)

- `GET /api/health` | Public (`None`) | Executes `SELECT 1` with a 2-second timeout and returns `200` `{"status":"ok","db":"ok","timestamp":"<ISO8601>"}` or `503` `{"status":"degraded","db":"unreachable","timestamp":"<ISO8601>"}` (`monitoring.md`, `build-plan.md` Day 1 scope).

## Unresolved before build (read/action endpoints omitted from PRD 8.3 — `AGENTS.md` Q13)

Because Next.js 14 Server Components (`app/(customer)/contracts/[id]/page.tsx`, `app/(worker)/worker/reserved/page.tsx`, etc.) can read data on the server via `lib/services/*`, confirm on Day 0 whether the following UI reads and the Owner password-reset unlock (`PRD 7.11`) are handled via Server Component service calls or by adding these explicit API routes:

1. `GET /api/contracts/mine` and `GET /api/contracts/:id` — for `Contract Detail` (remaining balance, 30-day countdown, agreement text, payment history).
2. `GET /api/worker/reserved-units` and `POST /api/worker/reserved-units/:id/acknowledge` — for the `Reserved Units` screen (`screen-inventory.md` #19).
3. `POST /api/admin/users/:id/unlock` — for Owner/Co-owner in-person unlock of a 24-hour password-reset-locked account (`PRD 7.11`, `14.5`).
