# monitoring

Source: PRD Sections 15.1, 15.2, 15.3, 7.7, 7.10, 7.12, 7.13, 9.2, 14.3, 8.3, 5.3, Appendix B.8

## Single job

This file defines what operational signals are monitored in Version 1, what analytics/tracking is banned (`PRD 15.2`), the in-app Owner/Co-owner alert rules and thresholds, the `GET /api/health` endpoint contract, and Sentry runtime configuration. Structured JSON log formatting lives in `observability-baseline.md`; PII scrubbing fields live in `security-baseline.md`; business metric formulas live in `success-metrics.md`.

## Why alerting is in-app dashboard plus Sentry/Vercel only (`PRD Structural Assumptions`, `15.3`)

The `User` model has no email column (`PRD Structural Assumptions`: `"No email assumed"`), and automated WhatsApp/SMS alerts are excluded by `PRD 6` and `11`. Therefore, all application-level Owner and Co-owner alerts are rendered as **persistent, non-dismissible banners at the top of `Owner Dashboard`** (`ux-states.md` B.8), complemented by Sentry and Vercel dashboard visibility for infrastructure errors.

## What is monitored (`PRD 15.1`)

| Domain area | Signal measured | Source | Target / Alert threshold | Governing reference |
|---|---|---|---|---|
| Availability | Home (`/`) and `GET /api/health` HTTP reachability | Vercel uptime check | `99%` during `09:00–20:15 WAT` Mon–Sat; alert on any 5-minute window with non-`200` response | `non-functional.md` (`PRD 9.2`) |
| Server errors | Unhandled exceptions and HTTP `5xx` responses | `@sentry/nextjs` & Vercel logs | Alert when `5xx` rate exceeds **1% over a 5-minute window** (`PRD 15.3`) | `PRD 15.1`, `15.3` |
| API latency | `P50`, `P95`, `P99` route duration (`durationMs` in structured logs) | Vercel runtime logs (`lib/logger.ts`) | Read endpoints `P95 < 500ms`; transactional write endpoints `P95 < 1,000ms` | `non-functional.md` (`PRD 9.1`) |
| Database health | Query latency and active connection count | Managed PostgreSQL (Neon / Supabase) metrics + `/api/health` | Query `P95 < 500ms`; connection count `< 80%` of plan limit | `PRD 15.1` |
| Cron health | `Settings.last_expiry_cron_at` and `Settings.last_default_cron_at` | `GET /api/cron/check-expiry-heartbeat`, `check-default-heartbeat`, and `Owner Dashboard` load query | Expiry heartbeat older than **15 minutes**; default heartbeat older than **24 hours + 15 minutes** | `cron.md` (`PRD 7.12`, `14.3`) |
| Business metrics | The 5 `Success Metrics` | Computed on request by `GET /api/admin/metrics` | Display only against targets in `success-metrics.md` | `success-metrics.md` (`PRD 1.8`) |

## What is NOT monitored (`PRD 15.2`)

Do not add code, tables, cookies, or third-party scripts for any of the following, because they are explicitly excluded by `PRD 15.2` and `out-of-scope.md`:
- Session replay (including Sentry Replay).
- Heatmaps or scroll tracking.
- A/B testing or feature-flag experimentation.
- Custom event funnels beyond the 5 numerical Success Metrics.
- Per-visitor behavioral tracking cookies.
- Third-party analytics SDKs (`@vercel/analytics`, `@vercel/speed-insights`, Google Analytics, PostHog, Mixpanel).

## In-app Owner and Co-owner dashboard alert rules (`PRD 11`, `15.3`)

Every alert below renders at the top of `Owner Dashboard` (`/admin`) for both `Owner` and `Co-owner`. Banners have no close/dismiss button—they clear only when the underlying condition resolves:

| # | Alert | Trigger condition | Clear condition | Exact banner copy (`ux-states.md` B.8) |
|---|---|---|---|---|
| 1 | Expiry cron heartbeat stale | `last_expiry_cron_at IS NULL` or `NOW() - last_expiry_cron_at > 15 minutes` | Next successful `GET /api/cron/expire-applications` updates `last_expiry_cron_at` | `"Cron has not run in 15 minutes. Check system health."` |
| 2 | Default cron heartbeat stale | `last_default_cron_at IS NULL` or `NOW() - last_default_cron_at > 24 hours 15 minutes` | Next successful `GET /api/cron/default-contracts` updates `last_default_cron_at` | `"Cron has not run in 15 minutes. Check system health."` |
| 3 | IP collision on verify and approve | `DownPaymentTransaction.verifier_ip === finalApprovalAuditLog.ip_address` on an application (`BR-19`) | Owner inspects `Audit Log` and records review acknowledgement in `AuditLog` (`action = 'IP_COLLISION_REVIEWED'`) | `"Same IP performed verification and final approval on this application. Review before further approvals."` |
| 4 | Final approval delayed > 24h | Application is in `Awaiting Final Approval` and `NOW() - Agreement.customer_accepted_at > 24 hours` (`PRD 7.7`) | Owner or Co-owner grants final approval | `Awaiting Final Approval` delay alert banner (`ux-states.md` unresolved #9) |
| 5 | Customer acceptance missing > 24h | Application is in `Awaiting Customer Acceptance` and `NOW() - DownPaymentTransaction.verified_at > 24 hours` (`PRD 7.10`) | Customer completes OTP agreement acceptance | `Awaiting Customer Acceptance` delay alert banner (`ux-states.md` unresolved #9) |
| 6 | Server `5xx` error rate > 1% (`PRD 15.3`) | `5xx` count over last 5 minutes exceeds 1% (tracked in Sentry/logs) | `5xx` rate remains `< 1%` for 15 minutes | Surface in Sentry dashboard and (if in-app counter enabled) on `Owner Dashboard` |

## Health endpoint specification (`GET /api/health`)

Approved by `build-plan.md` Day 0 decision 21 and built on Day 1:

- **Route & Method:** `GET /api/health`
- **Authentication:** Public (`None`), so external uptime monitors can probe it without credentials.
- **Database probe:** Executes `SELECT 1` via Prisma with a strict **2-second timeout**. Does not call SMS providers, Sentry, or `wa.me`, because third-party outages must not cause Vercel to mark our app container unhealthy.
- **Healthy response (`200 OK`):**
  ```json
  {
    "status": "ok",
    "db": "ok",
    "timestamp": "2026-10-31T19:00:00.000Z"
  }
  ```
- **Degraded response (`503 Service Unavailable`):**
  ```json
  {
    "status": "degraded",
    "db": "unreachable",
    "timestamp": "2026-10-31T19:00:00.000Z"
  }
  ```
  *(Security rule: always return the fixed string `"unreachable"` in `db` on failure—never serialize the raw Prisma or PostgreSQL error message into the response body per `security-baseline.md`. Log the actual error server-side via `lib/logger.ts` and `Sentry.captureException`.)*

## Sentry configuration (`@sentry/nextjs`)

- **Error sampling:** `tracesSampleRate: 0` (no performance tracing overhead), **error capture at `100%`** (`sampleRate: 1.0`) for all unhandled exceptions and `5xx` errors (`PRD 15.1`). Never send expected `4xx` errors to Sentry (`observability-baseline.md`).
- **Environment and release tagging:** Set `environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV` (`development`, `preview`, `production`) and `release: process.env.VERCEL_GIT_COMMIT_SHA` so preview UAT errors never trigger production alerts (`PRD 14.2`).
- **Mandatory PII scrubbing (`security-baseline.md`, `PRD 5.3`):** Configure `beforeSend` and `beforeBreadcrumb` to strip all fields on the PII scrubbing list (`NIN`, `phone_number`, `full_name`, `personal_details`, `guarantor_name`, `guarantor_phone`, passwords, OTPs, cookies, headers, and request bodies), and never call `Sentry.setUser()` with PII.

## Unresolved before build

Track in `working-agreements.md` and resolve on Day 0 (`AGENTS.md` Q45–Q49):

1. **Owner check cadence for external Sentry and Vercel dashboards (`AGENTS.md` Q45):** Because Vercel deploy failures and Sentry 5xx alerts live in their respective dashboards unless bridged via webhook, confirm daily Owner/Product Lead check cadence (or whether to record 5xx counts in `Settings` for the in-app banner).
2. **Owner response SLA after an in-app alert banner appears (`AGENTS.md` Q46):** Confirm target response window during business hours (`09:00–20:15 WAT`).
3. **SMS provider health visibility (`AGENTS.md` Q47):** Confirmed not monitored via background probes in Version 1; failed OTP sends log an `error` event to Sentry and rely on the `PRD 7.8` in-person Store Worker OTP resend fallback.
4. **PostgreSQL connection limit threshold (`AGENTS.md` Q48):** Set the `80%` connection warning against the exact connection limit of the Neon or Supabase plan chosen in `build-plan.md` Day 0 decision 4.
5. **Vercel runtime log retention (`AGENTS.md` Q49, Q58):** Governed by the chosen Vercel plan; `AuditLog` in PostgreSQL remains the durable system of record (`ndpa-compliance.md`).
