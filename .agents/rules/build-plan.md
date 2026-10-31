# build-plan

Source: PRD Sections 12, 13, 14, 16.1, Appendix G

## Single job

This file is the Day 0 through Day 5 execution sequence for the 1-week build: the Day 0 decision table (with owners and fallbacks), daily scope, daily acceptance gates, daily 18:00 WAT slip rules, the 5-item cut order, the seed data specification, parallelization boundaries, and rollback rules.

## How to use this file

- **Gate on Day 0 decisions:** Do not start Day 1 foundation coding until Day 0 decisions `1, 2, 3, 4, 18, 19, 20, 21` (plus schema/stack decisions in `data-and-schema.md` and `stack.md`) are recorded as resolved.
- **Tests ship with the feature on the same day:** Every day's acceptance gate requires unit and integration tests for that day's scope to pass (`PRD 12`, `13.1`). There is no separate test phase at the end of the week.
- **Daily Preview deploy:** Every day ends with a working deployment to Vercel Preview (`PRD 12`).

## Day 0 decisions (21 core decisions + PRD Appendix G mapping)

If the primary Owner for a decision is unreachable on Day 0, the Fallback Owner makes the call and records it in the governing rule file and `working-agreements.md`:

| # | Day 0 decision | Governing rule file | Primary owner | Fallback owner | Default / pinned direction if fallback invoked |
|---|---|---|---|---|---|
| 1 | Testing framework (`Vitest` vs `Jest`) and CI test DB strategy | `stack.md`, `code-conventions.md` | Product Lead | Engineer | `Vitest` + local/CI test PostgreSQL container |
| 2 | SMS provider (`Termii` vs `Africa's Talking` — `Appendix G` #1) | `third-party.md`, `stack.md` | Owner | Product Lead | `Termii` REST API via native `fetch` |
| 3 | File storage provider for Version 2 (`Supabase Storage` vs `AWS S3`) | `third-party.md` | Owner | Product Lead | Recorded for Version 2 only; zero SDK installed in Version 1 |
| 4 | Managed PostgreSQL host (`Neon` vs `Supabase`) & PG version (15/16/17) | `stack.md`, `third-party.md` | Owner | Product Lead | Managed PG 16 with 5-minute PITR and 90-day retention (`PRD 17.1`) |
| 5 | Post-contract personal data retention period (`Appendix G` #2) | `ndpa-compliance.md` | Owner | Product Lead (with legal review) | Retain while contract active/defaulted + statutory financial retention window |
| 6 | Custody mechanism for pseudonymous ID mapping (`Appendix G` #5) | `ndpa-compliance.md` | Owner | Product Lead | Offline encrypted mapping held by Owner; no extra DB table in V1 |
| 7 | IP address retention period in `AuditLog` and `DownPaymentTransaction` | `ndpa-compliance.md` | Owner | Product Lead | Retained permanently in immutable `AuditLog` for `BR-19` fraud audit |
| 8 | Whether `Customer` can view own NIN after submission | `permission-matrix.md`, `ndpa-compliance.md` | Owner | Product Lead | Masked (`*******1234`) or omitted on Customer views |
| 9 | WhatsApp consent revocation handling (`ConsentRecord.revoked_at`) | `ndpa-compliance.md` | Owner | Product Lead | Contractual balance reminders continue under contract-performance basis or phone call |
| 10 | Deletion during `Defaulted` contract legal confirmation | `ndpa-compliance.md`, `edge-cases.md` | Owner | Product Lead (with legal review) | Strictly reject with `"retention required"` per `FR-10` |
| 11 | Rate-limit counter storage under Nigerian CGNAT (`200/min IP`, `30/min user`, `5/min OTP/login`, `10/hr OTP`) | `security-baseline.md`, `non-functional.md` | Product Lead | Engineer | Enforce exact `PRD 9.3` limits |
| 12 | Uptime monitoring window (`09:00–20:15 WAT` Mon–Sat) | `non-functional.md`, `monitoring.md` | Product Lead | Engineer | Confirmed `09:00–20:15 WAT` (`PRD 9.2`) |
| 13 | Binding RPO (`5-minute PITR` per `PRD 17.1`, `17.2`) | `non-functional.md` | Product Lead | Engineer | Confirmed `5-minute PITR` (`PRD 17.1`) |
| 14 | Backup retention (`90 days` per `PRD 17.1`) | `non-functional.md` | Product Lead | Engineer | Confirmed `90 days` (`PRD 17.1`) |
| 15 | WCAG 2.1 AA audit scope for Worker/Owner flows | `accessibility-baseline.md`, `non-functional.md` | Product Lead | Engineer | Same code rules on all flows; formal manual screen-reader sign-off on Customer flows |
| 16 | Customer notification SLA after a security/payment incident | `non-functional.md` | Owner | Product Lead | Within 24 hours of containment; written post-mortem within 72 hours (`PRD 17.3`) |
| 17 | Escalation after `T+1` overdue WhatsApp reminder | `notification-matrix.md`, `message-templates.md` | Owner | Product Lead | Manual offline Shop ATF 03 management follow-up; also provide Shop WhatsApp number & `[Store Contact]` |
| 18 | Pending Worker inventory updates storage (`InventoryApproval` vs `Inventory` staging columns) | `data-and-schema.md`, `api-contracts.md` | Product Lead | Engineer | Resolve before Day 1 `prisma/schema.prisma` migration |
| 19 | Cron HTTP method (`GET` per Vercel Cron requirement) | `cron.md`, `api-contracts.md` | Product Lead | Engineer | Pinned to `GET` in both `cron.md` and `api-contracts.md` |
| 20 | Dual heartbeat fields (`last_expiry_cron_at`, `last_default_cron_at`) in `Settings` | `cron.md`, `data-and-schema.md` | Product Lead | Engineer | Pinned to 2 fields in `data-and-schema.md` addition #7 |
| 21 | Health endpoint (`GET /api/health`) inclusion | `monitoring.md`, `api-contracts.md` | Product Lead | Engineer | Pinned in `api-contracts.md` and built on Day 1 |

**Additional `PRD Appendix G` items resolved alongside the 21 decisions above:**
- `Appendix G #3` (Down payment minimum per category vs global): Global `70%–80%` across all categories per `BR-02`.
- `Appendix G #4` (Physical tag format at Shop ATF 03): Written paper/sticker tag on device box showing `Application ID`, `Customer Name`, and `Expires At` (`edge-cases.md` row 6).
- `Appendix G #6` (Worker permission reset runbook): Owner sets `User.account_status = 'SUSPENDED'` per `PRD 14.5`, blocking new verifications and logging in `AuditLog`.
- `Appendix G #7` (Maximum pending applications per customer): `1` active/pending application per customer + device within 24h (`PRD 9.2`), or `1` pending application total per customer (confirm on Day 0).

## Day-by-day execution plan (`PRD 12`)

### Day 1: Foundation
- **Scope:**
  - Initialize Next.js 14 App Router, TypeScript strict config (`code-conventions.md`), Tailwind v3, and ESLint/Prettier (`stack.md`).
  - Build `lib/env.ts` (`env-and-secrets.md`), `lib/logger.ts` (`observability-baseline.md`), `lib/errors.ts` (`api-design.md`), `lib/crypto.ts` (`security-baseline.md`), and `lib/db.ts`.
  - Provision PostgreSQL and create initial additive migration (`prisma/schema.prisma`) with all tables, `ON DELETE RESTRICT` foreign keys, required indexes, `AuditLog` insert-only grants, and `Settings` with both heartbeat fields (`data-and-schema.md`).
  - Seed default `Settings` (`freshness_window = 24`, `down_payment_min = 70`, `down_payment_max = 80`, `window_days = 30`, `expiry_hours = 24` per `PRD 16.1`).
  - Implement all auth routes and screens: `Register`, `OTP Verification`, `Login`, `Logout`, `Forgot Password`, `Reset Password` (with 24-hour account lock and session invalidation per `security-baseline.md`).
  - Implement `middleware.ts` (security headers, correlation ID) and `withApiGuard` (`Visitor`, `Customer`, `Store Worker`, `Owner`, `Co-owner`, CSRF check, IDOR `404` rule).
  - Implement `GET /api/health` (`monitoring.md`).
  - Write unit and integration tests for auth, role guards, CSRF, and 24-hour password-reset lock (`PRD 13.1`, `13.4`).
  - Deploy to Vercel Preview.
- **Acceptance gate:** All auth flows pass end-to-end in Preview; Worker receives `403` on `/api/admin/*`; Customer receives `404` on another customer's resource; `AuditLog` records auth events and rejects `UPDATE`/`DELETE`; `GET /api/health` returns `200`; all Day 1 tests pass.
- **18:00 WAT slip rule:** If Day 1 runs past `18:00 WAT`, cut the standalone `Success Metrics` page (Cut Order #1) from Day 5 and simplify `Audit Log` to a raw table view (Cut Order #2). Do not cut auth, schema, or role guards.

### Day 2: Public Inventory, Pricing, and Calculator
- **Scope:**
  - Build `GET /api/devices`, `GET /api/devices/:id`, and `POST /api/calculator` (`api-contracts.md`).
  - Build `Home / Inventory Listing` (`/`) with filters (`brand`, `category`, `performance_tier`, `battery_life`) and equal visual/accessible weight for battery life and price (`FR-01`, `accessibility-baseline.md`).
  - Build `Device Detail` (`/devices/[id]`) with specs, stock status, dynamic price (`base_price * exchange_rate_multiplier`), calculator (`FR-02` with disclaimer), and `Confirm Current Price via WhatsApp` (`Template A.3` + fallback per `FR-12`).
  - Build `Inventory Update` (`/worker/inventory`), `Inventory Approvals` (`/admin/inventory-approvals`), and `Exchange Rate Settings` (`/admin/exchange-rate`) (`FR-13`).
  - Render exact `B.1` and `B.2` empty, loading, and error states (`ux-states.md`).
  - Run `prisma db seed` for staff accounts and 25 devices (`PRD 16.1` below).
  - Write unit and integration tests for stock math, price freshness, calculator math, and equal-weight battery/price rendering.
  - Deploy to Vercel Preview.
- **Acceptance gate:** Home renders 25 seeded devices with working filters; Device Detail and Calculator match `FR-01` and `FR-02`; battery life and price share identical font size and weight on every card; all Day 2 tests pass.
- **18:00 WAT slip rule:** Defer `performance_tier` and `battery_life` filter dropdowns to Day 3 (Cut Order #5) while keeping `brand` and `category` filters and battery-life card display intact.
- **Two-engineer parallelization:** Engineer A builds `Home`, `Device Detail`, and `FR-13` pricing/inventory screens; Engineer B builds `Calculator`, API routes, and the 25-device seed script. Merge to Preview at end of day.

### Day 3: Part-Payment Application Submission and Expiry Cron
- **Scope:**
  - Build `Apply for Part-Payment` (`/apply/[deviceId]`) with inline on-blur validation and exact `B.3` error strings (`ux-states.md`): `^\d{11}$` NIN, Nigerian phone format, `70%–80%` down payment (`BR-02`), and live price-change confirmation notice (`FR-03`). (No OTP at submission.)
  - Build `POST /api/applications`, `GET /api/applications/mine`, `GET /api/applications/:id` with atomic price lock, `Inventory.reserved_count += 1`, 24-hour `expires_at`, pending `Agreement` creation, `AuditLog` write, `BR-09` purchase block check, and 24-hour duplicate application check (`data-and-schema.md`).
  - Build `Application Status` (`/applications/[id]`) and `My Applications` (`/applications`) with 24-hour countdown and `B.4` status copy (`ux-states.md`).
  - Build `GET /api/cron/expire-applications` and `GET /api/cron/check-expiry-heartbeat` (`cron.md`).
  - Write unit, integration, and concurrency tests (including simultaneous applications for the last unit in stock per `PRD 13.1`).
  - Deploy to Vercel Preview.
- **Acceptance gate:** Inline validation catches invalid NIN, phone, and 69.9% / 80.1% down payments; valid submission writes all records in one transaction; expiry cron releases reservation and price lock; last-unit concurrency test passes (`1 succeeds, 1 returns Out of Stock`); all Day 3 tests pass.
- **18:00 WAT slip rule:** Defer `Agreement Acceptance` OTP UI wiring to Day 4 morning (`PRD 12`).
- **Two-engineer parallelization:** Engineer A builds `Apply` form, `Application Status`, and submission service; Engineer B builds `expire-applications` cron, heartbeat checker, and concurrency tests.

### Day 4: Review, Worker Verification, OTP Agreement Acceptance, and Final Approval Activation
- **Scope:**
  - Build `Owner Dashboard` (`/admin`) queues and `Review Application` (`/admin/applications/[id]/review`) showing customer details, decrypted NIN (logging `NIN_ACCESS`), guarantor details, and `Approve for verification` / `Reject` (with required reason) actions (`FR-04`).
  - Build `Worker Dashboard` (`/worker`) queues and `Verify Down Payment` (`/worker/verify/[applicationId]`) recording `DownPaymentTransaction` with `verifier_ip` and mandatory `verification_checkbox` (`FR-05`, `BR-06`, `BR-19`), plus manual WhatsApp `Template A.6` and `A.5` send/log helpers (`FR-07`).
  - Build `Agreement Acceptance` (`/applications/[id]/accept`) with `POST /api/auth/accept-agreement-otp` and `POST /api/applications/:id/accept-agreement` recording `customer_accepted_at` and `acceptance_otp_verified = true` (`FR-06`, `BR-17`).
  - Build `Final Approval` (`/admin/applications/[id]/final-approve`) and `POST /api/admin/applications/:id/final-approve` enforcing all 3 activation checks (`DownPaymentTransaction` verified, `customer_accepted_at` with OTP verified, and `approverUserId !== verifierUserId` per `BR-13`) inside one transaction, recording `device_serial` (`BR-08`), setting 30-day `due_date` (`19:59 WAT` day 30), logging approver IP, raising the `BR-19` IP collision alert if IPs match, and triggering `Template A.2` WhatsApp confirmation.
  - Write unit, integration, and concurrency tests (same-user block, missing OTP acceptance block, simultaneous final approvals by same user and different users per `PRD 13.1`).
  - Deploy to Vercel Preview.
- **Acceptance gate:** Full lifecycle from `Application Pending` -> `Awaiting Down Payment Verification` -> `Awaiting Customer Acceptance` -> `Awaiting Final Approval` -> `Active Flexi-Pay Contract` passes in Preview; same-user final approval returns `400`; IP collision raises Owner banner; all Day 4 tests pass.
- **18:00 WAT slip rule:** Cut standalone `Reserved Units` UI (Cut Order #3) to a simplified text table or defer to Version 1.1 while keeping physical shop tagging mandatory.

### Day 5: Balance & Settlement Payments, Reminders, Default Cron, Deletions, UAT, and Launch
- **Scope:**
  - Build `Contract Detail` (`/contracts/[id]`), `Record Balance Payment` (`/worker/balance/[agreementId]`), and `Record Settlement Payment` (`/worker/settlement/[agreementId]`) enforcing the `FR-08` overpayment block (`"Amount exceeds remaining balance."`), partial payment recalculation (`BR-14`), and automatic `Completed` transition when `remaining_amount == 0`.
  - Build `Reminder Checklist` (`/worker/reminders`) for `T-7`, `T-3`, `T-1`, `T-0`, `T+1` with `wa.me` link, clipboard copy fallback, and `Mark as Sent` logging to `WhatsAppReminderLog` (`FR-07`).
  - Build `GET /api/cron/default-contracts` (`20:00 WAT` daily) and `GET /api/cron/check-default-heartbeat` (`20:15 WAT` daily), `Defaulted Contracts` (`/admin/defaults`), and `POST /api/admin/defaults/:id/resolve` (`FR-09`, `cron.md`).
  - Build `Account Settings` (`/settings`) formal deletion request and `Deletion Requests` (`/admin/deletion-requests`) review and `UPDATE` anonymization (`FR-10`, `ndpa-compliance.md`).
  - Build simplified numerical `Success Metrics` (`/admin/metrics`), raw-table `Audit Log` (`/admin/audit`), and text-label `Reserved Units` (`/worker/reserved`) (`PRD 12`).
  - **Day 5 Morning UAT at Shop ATF 03 (`PRD 12`, `13.2`):** Run full UAT with Owner, one Store Worker, and the Ahmed persona across all journeys and all 26 edge cases in `edge-cases.md`.
  - **Day 5 Afternoon Production Deploy:** Merge to `main`, run additive Prisma migrations, create Sentry release, and run production smoke tests (`PRD 14.2`). Do not start a production deploy after `22:00 WAT` (if past `22:00 WAT`, deploy Day 6 morning).
- **Acceptance gate:** Ahmed journey (`Register` -> `Completed`), Worker flows, Owner flows (including default resolution and deletion review), all 26 edge cases, and all automated unit/integration/concurrency/security/accessibility tests pass.

## Fixed 5-item cut order for schedule slips (`PRD 12`)

If any day slips past `18:00 WAT`, cut items in this exact order—never cut core auth, application submission, verification, OTP acceptance, final approval, payment recording, default cron, deletion anonymization, health check, or `AuditLog` database writes:

1. **Standalone `Success Metrics` page** (defer to Version 1.1; Owner reads counts from queues/DB).
2. **`Audit Log` UI page** (simplify to raw table or Owner queries `AuditLog` via read-only SQL/Prisma Studio; `AuditLog` database writes are **never** cut).
3. **`Reserved Units` dedicated UI screen** (defer to Version 1.1; Worker sees reserved badge on inventory and applies physical tag in Shop ATF 03).
4. **`Reminder Checklist` dedicated UI screen** (Worker triggers manual WhatsApp reminders directly from `Contract Detail` / active contracts list while still logging to `WhatsAppReminderLog`).
5. **`Performance tier` and `Battery life` filter controls on Home** (defer those 2 filter controls to Version 1.1 while keeping `Brand` and `Category` filters and equal-weight battery life display on every card).

## Seed data specification (`PRD 13.3`, `16.1`)

`prisma/seed.ts` (run in `Development` and `Preview` only; blocked in `Production` unless an explicit initial-launch flag is passed) must create:
- **Staff and test users:** `1 Owner`, `1 Co-owner`, `2 Store Workers`, and `3 Customers` (including the `Ahmed` persona). Staff accounts use temporary passwords flagged for forced change on first login, with an `AuditLog` row per account (`PRD 16.1`).
- **25 devices** spanning **5 brands** (e.g., HP, Dell, Lenovo, Samsung, Apple), **3 categories** (`smartphone`, `laptop`, `tablet`), **3 performance tiers** (`entry`, `mid`, `high`), and a realistic range of `battery_life_spec` values and Naira `base_price` values (`PRD 16.1`).
- **Stock edge cases:** Include at least `1` device with `stock_count = 0` (to test Out of Stock block) and at least `1` device with `stock_count = 1, reserved_count = 0` (to test the last-unit concurrency race).
- **Defaulted contract for Day 5 UAT (`PRD 13.3`):** Include (or generate via Day 5 morning test script) `1 Defaulted` contract so Owner default settlement and `Mark Resolved` can be verified during UAT.

## Parallelization and rollback rules (`PRD 12`, `14.4`)

- **Parallelization:** Never parallelize Day 1 (shared schema/auth foundation), Day 4 (tightly coupled 3-step approval transaction), or Day 5 (UAT and launch). With 2 engineers, parallelize Day 2 and Day 3 only.
- **UAT failure & rollback:** Any Day 5 UAT failure on auth, application submission, verification, OTP acceptance, final approval, balance/settlement payment, or default cron blocks production launch until fixed (extending to Day 6 if needed—a late ship is better than a broken financial system). If a production smoke test fails after deploy, trigger Vercel instant rollback (`PRD 14.4`); because all migrations are additive (`BR-20`), rolled-back application code continues to run safely.
