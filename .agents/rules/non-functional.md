# non-functional

Source: PRD Sections 9.1 through 9.6, 13.1, 17.1 through 17.3

## Single job

This file defines the measurable non-functional acceptance criteria (performance latencies, uptime window, browser/viewport targets, concurrency test invariants, backup/recovery RPO & RTO, and incident response SLAs) that every feature must satisfy to ship. Concrete security mechanics live in `security-baseline.md`; concrete WCAG rules live in `accessibility-baseline.md`.

## Performance targets (`PRD 9.1`)

| Target area | Requirement | How it is enforced and why |
|---|---|---|
| `Home / Inventory Listing` and `Device Detail` First Contentful Paint (FCP) | **< 1.8 seconds** on a 3G mid-range Android device | Server Components by default, zero decorative images/scripts, and self-hosted/system fonts (`code-conventions.md`). Measured during Day 5 UAT (`PRD 13.2`). |
| OTP screens (`OTP Verification`, `Agreement Acceptance`) | **< 3.0 seconds** response time (`PRD 9.1`) | Keep SMS gateway HTTP timeout at 2.5s so the UI returns promptly and displays the `"Trouble receiving OTP?"` fallback if cellular delivery lags (`PRD 7.8`). |
| API read endpoints (`GET`) | **P95 < 500ms** | Backed by the foreign-key, status, and filter indexes in `data-and-schema.md`. |
| API transactional write endpoints (`POST`) | **P95 < 1,000ms (1 second)** | Keep external calls (such as SMS sending) outside the `prisma.$transaction` block so database locks are held for milliseconds only. |
| Inventory listing scale | Renders up to **500 devices** without pagination degradation; paginate above 500 | Prevents slow DOM rendering as Shop ATF 03 catalog grows. |
| Audit log and admin queue pagination | **50 rows per page**, query time **< 1,000ms (1 second)** | Enforced via `?page=1&pageSize=50` in `api-design.md` and `AuditLog(timestamp DESC)` index in `data-and-schema.md`. |

## Reliability and availability (`PRD 9.2`)

- **Uptime target:** **99% availability during `09:00` to `20:15 WAT` Monday through Saturday** (`PRD 9.2`). Why `20:15 WAT`: Shop ATF 03 business hours end at `20:00 WAT`, and the 15-minute extension covers the `20:00 WAT` default cron plus its `20:15 WAT` heartbeat check (`cron.md`).
- **Cron schedules and heartbeats:** Pending expiry cron runs every 5 minutes; default cron runs daily at `20:00 WAT` (`19:00 UTC`); heartbeat checks verify execution within 15 minutes (`cron.md`).
- **Application submission idempotency (`PRD 9.2`):** Reject any new application where the same customer (`phone_number` / `customer_id`) and `device_id` already has a pending application submitted within the last 24 hours (`api-design.md` `409 DUPLICATE_APPLICATION`).
- **Transactional atomicity:** Every multi-table write runs inside a single Prisma ACID transaction that rolls back completely on any error (`data-and-schema.md`).

## Security and accessibility acceptance pointers (`PRD 9.3`, `9.4`)

- **Security acceptance (`PRD 9.3`, `13.4`):** Every route must pass the 7 security tests in `PRD 13.4` (XSS escaping, SQLi parameterization, IDOR `404` on cross-customer `/api/applications/:id`, session token regeneration on login, CSRF rejection on missing token, rate limits `200/min IP` public / `30/min user` authenticated / `5/min user` OTP & login / `10/hr phone` OTP, and 24-hour password-reset lock). Full enforcement rules are in `security-baseline.md`.
- **Accessibility acceptance (`PRD 9.4`, `13.2`):** Customer flows must pass WCAG 2.1 AA automated (`axe-core`) and manual keyboard/screen-reader/400%-zoom checks. Full implementation rules are in `accessibility-baseline.md`.

## Browser and viewport support (`PRD 9.5`)

- **Supported mobile browsers:** Last 2 major versions of Chrome on Android and Safari on iOS.
- **Supported desktop browsers:** Last 2 major versions of Chrome, Firefox, Safari, and Edge.
- **Explicitly unsupported:** Internet Explorer, Opera Mini (extreme proxy mode), and browsers without ES2020 support, because modern Web Crypto and Next.js 14 bundles require ES2020+.
- **Viewport optimization targets:**
  - **Customer and Visitor flows:** Mobile-first, optimized from **`360px` width** upward (`PRD 9.5`) and reflowing cleanly at `320px` CSS width for 400% zoom (`accessibility-baseline.md`).
  - **Store Worker, Owner, and Co-owner flows:** Desktop-first, optimized from **`1024px` width** upward (`PRD 9.5`) for multi-column queues and audit tables at Shop ATF 03.

## Concurrency invariants and required automated tests (`PRD 9.6`, `13.1`)

The 4 concurrency races below must be prevented by database-level conditional updates / row locks inside `prisma.$transaction` and verified by automated concurrency tests in `tests/concurrency/`:

1. **Last-unit double application (`PRD 13.1`):** Two customers submit an application simultaneously for a device with `available_stock == 1`. Exactly one transaction succeeds (`201 Created`); the second fails with `409 OUT_OF_STOCK` (`"Out of Stock. Confirm Current Price via WhatsApp."`).
2. **Same-user double final approval (`PRD 13.1`):** An Owner clicks `Approve` simultaneously in two browser tabs on the same `Awaiting Final Approval` application. The first succeeds (`200 OK`); the second returns `400` because `application_status` is no longer `'Awaiting Final Approval'`.
3. **Different-user simultaneous final approval (`PRD 13.1`):** Owner and Co-owner click `Approve` simultaneously on the same application. The first succeeds; the second returns `409` / `400` with `"Approved by another user."` (`edge-cases.md` row 5).
4. **Simultaneous balance payments exceeding remaining balance (`PRD 13.1`):** Two Store Workers record balance payments simultaneously that together exceed `Agreement.remaining_amount`. The first succeeds; the second is blocked inside the transaction with `400 OVERPAYMENT_BLOCKED` (`"Amount exceeds remaining balance."`).

## Backup and disaster recovery (`PRD 17.1`, `17.2`)

Consolidated PRD v1.3 Sections 17.1 and 17.2 pin these exact values so backup retention covers the full 30-day contract window plus dispute resolution:

- **Recovery Point Objective (RPO):** **5 minutes** via managed PostgreSQL Point-in-Time Recovery (PITR) (`PRD 17.1`, `17.2`), supplemented by automated daily snapshots encrypted at rest.
- **Backup retention:** **90 days** (`PRD 17.1`).
- **Recovery Time Objective (RTO):** **4 hours** for full database and application restore (`PRD 17.2`).
- **Post-restore verification runbook (`PRD 17.2`):** Triggered by Owner or Product Lead:
  1. Restore the complete database including `AuditLog` (never partially restore `AuditLog`).
  2. Verify row counts on `User`, `PartPaymentApplication`, `Agreement`, and `DownPaymentTransaction` against pre-incident metrics plus expected writes.
  3. Spot-check the 10 most recent `DownPaymentTransaction` and `BalancePaymentTransaction` rows against `WhatsAppReminderLog` and `AuditLog` references before reopening traffic.

## Incident response (`PRD 17.3`)

For any incident affecting a payment record, contract status, personal data, or authentication flow:
1. **Incident Lead:** Owner or Product Lead.
2. **Execution steps:** Contain -> Restore (per 17.2 above) -> Verify -> Notify affected customers via in-platform banner and manual WhatsApp -> Log in `AuditLog` with `action = 'INCIDENT'`.
3. **Post-mortem SLA:** Publish a written root-cause summary within **72 hours** and add the preventive rule to `business-rules.md` or `failure-modes.md`.

## Unresolved before build

Track in `working-agreements.md` and resolve on Day 0 (`build-plan.md`):

1. **Rate-limit storage implementation under Nigerian CGNAT (`build-plan.md` decision 11 / `AGENTS.md` Q14):** PRD v1.3 raised the public IP limit from 20/min to **200/min** and OTP to **10/hr per phone** + **5/min per user**. Confirm rate-limiter storage mechanism on Day 0.
2. **Uptime monitoring window configuration (`build-plan.md` decision 12 / `AGENTS.md` Q15):** Confirm configuring the uptime check for `09:00–20:15 WAT` Monday–Saturday (`PRD 9.2`).
3. **Managed Postgres plan confirmation for 5-minute PITR and 90-day retention (`build-plan.md` decisions 4, 13, 14 / `AGENTS.md` Q16, Q17):** Ensure the chosen Neon or Supabase plan supports 90-day backup retention and 5-minute PITR on Day 0.
4. **WCAG formal audit scope for Worker/Owner screens (`build-plan.md` decision 15 / `AGENTS.md` Q18):** Confirm whether Worker/Owner screens require manual screen-reader sign-off in addition to automated `axe-core` checks.
5. **Customer notification SLA after a security/payment incident (`build-plan.md` decision 16 / `AGENTS.md` Q19):** PRD 17.3 sets 72 hours for the written post-mortem; confirm the target timeframe (e.g., within 24 hours of containment) for notifying affected customers.
