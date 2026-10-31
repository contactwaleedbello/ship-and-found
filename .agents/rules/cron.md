# cron

Source: PRD Sections 8.3, 9.2, 14.3, 15.1, 4.1 BR-03

## Single job

This file defines the 4 scheduled `GET` cron endpoints, their exact `vercel.json` UTC schedules and WAT equivalents, their `CRON_SECRET` authentication, their conditional-update idempotency, their dual heartbeat fields in `Settings`, and the manual catch-up runbook.

## Schedules and `vercel.json` configuration

West Africa Time (`WAT`) is `UTC+1` year-round because Nigeria does not observe daylight saving time. All database timestamps are stored in `UTC`, and Vercel Cron expressions in `vercel.json` run in `UTC`:

| # | Cron endpoint | Purpose | WAT schedule | `vercel.json` UTC cron expression | Timeout budget |
|---|---|---|---|---|---|
| 1 | `GET /api/cron/expire-applications` | Expire pending applications past 24h | Every 5 minutes | `*/5 * * * *` | `< 4 minutes` |
| 2 | `GET /api/cron/default-contracts` | Default active contracts past `19:59 WAT` on day 30 | `20:00 WAT` daily | `0 19 * * *` | `< 1 minute` |
| 3 | `GET /api/cron/check-expiry-heartbeat` | Verify `last_expiry_cron_at` is within 15 minutes | Every 5 minutes | `*/5 * * * *` | `< 10 seconds` |
| 4 | `GET /api/cron/check-default-heartbeat` | Verify `last_default_cron_at` is within 24h 15m | `20:15 WAT` daily | `15 19 * * *` | `< 10 seconds` |

*(Note: If the chosen Vercel plan restricts the number of cron entries in `vercel.json`, `Owner Dashboard` also evaluates the two heartbeat timestamps on every dashboard load per `monitoring.md` so stale heartbeats are always surfaced even if a checker cron itself fails to fire.)*

## Authentication (`CRON_SECRET`)

- Every `/api/cron/*` route uses HTTP **`GET`** (`build-plan.md` Day 0 decision 19), because Vercel Cron invokes scheduled routes with `GET`.
- Authenticate by comparing the incoming `Authorization: Bearer <CRON_SECRET>` header (set automatically by Vercel Cron when `CRON_SECRET` is configured) or `x-cron-secret: <CRON_SECRET>` header (for manual Owner catch-up) against `env.CRON_SECRET` using `crypto.timingSafeEqual`.
- If missing or invalid, return `401 Unauthorized` with an empty body immediately. Never use user session authentication on cron routes.

## Endpoint specifications

### 1. `GET /api/cron/expire-applications`
- **Selection query:** Find all `PartPaymentApplication` rows where `application_status = 'Application Pending'` AND `expires_at < NOW()`.
- **Per-application atomic transaction (`data-and-schema.md`):**
  1. Conditional update: `UPDATE PartPaymentApplication SET application_status = 'Expired' WHERE application_id = :id AND application_status = 'Application Pending' AND expires_at < NOW()`. If `count == 0`, skip (already processed by a concurrent request).
  2. Decrement `Inventory.reserved_count` by `1` (releasing stock reservation and price lock per `BR-18`, `state-transitions.md` #2).
  3. Insert `AuditLog` (`action = 'APPLICATION_EXPIRED'`, `actor_id = 'SYSTEM_CRON'`, `entity_id = application_id`).
- **Heartbeat write:** After all overdue applications finish processing without unhandled errors, update `Settings.last_expiry_cron_at = NOW()`. If any application transaction throws an unhandled error, log at `error` level, report to Sentry (`observability-baseline.md`), and **do not** update `last_expiry_cron_at` so the 15-minute heartbeat alert fires.

### 2. `GET /api/cron/default-contracts`
- **Selection query:** Find all `Agreement` rows where `agreement_status = 'Active Flexi-Pay Contract'` AND `due_date < NOW()` AND `remaining_amount > 0` (where `due_date` was stored at activation as `18:59:00 UTC` = `19:59:00 WAT` on day 30 per `BR-03`).
- **Per-contract atomic transaction (`data-and-schema.md`):**
  1. Conditional update: `UPDATE Agreement SET agreement_status = 'Defaulted' WHERE agreement_id = :id AND agreement_status = 'Active Flexi-Pay Contract' AND due_date < NOW()`. If `count == 0`, skip.
  2. Update parent `PartPaymentApplication.application_status = 'Defaulted'`. (This applies the administrative default flag on `Agreement.device_serial` and activates the `BR-09` platform purchase block keyed on customer NIN and phone.)
  3. Insert `AuditLog` (`action = 'CONTRACT_DEFAULTED'`, `actor_id = 'SYSTEM_CRON'`, `entity_id = agreement_id`).
- **Heartbeat write:** After all overdue contracts are processed, update `Settings.last_default_cron_at = NOW()`. On failure, do not update `last_default_cron_at`.

### 3. `GET /api/cron/check-expiry-heartbeat`
- Reads `Settings.last_expiry_cron_at`.
- If `last_expiry_cron_at IS NULL` or `NOW() - last_expiry_cron_at > 15 minutes`, logs a `warn`/`error` event, captures a Sentry cron-health warning (`PRD 14.3`), and activates the non-dismissible Owner/Co-owner dashboard banner (`"Cron has not run in 15 minutes. Check system health."` per `ux-states.md` B.8).
- Clears automatically as soon as a subsequent `expire-applications` run updates `last_expiry_cron_at` within the 15-minute window.

### 4. `GET /api/cron/check-default-heartbeat`
- Runs at `20:15 WAT` (`19:15 UTC`), 15 minutes after the scheduled `20:00 WAT` default cron (`PRD 9.2`, `14.3`).
- Reads `Settings.last_default_cron_at`.
- If `last_default_cron_at IS NULL` or `NOW() - last_default_cron_at > 24 hours + 15 minutes`, logs an `error` event, captures a Sentry alert, and activates the Owner/Co-owner cron health warning banner (`ux-states.md` B.8) until `default-contracts` succeeds.

## Why two heartbeat fields are required (`Settings.last_expiry_cron_at` and `Settings.last_default_cron_at`)

PRD Section 5.1 originally listed a single `last_cron_heartbeat_at` field. If both the 5-minute expiry cron and the daily `20:00 WAT` default cron wrote to one timestamp column, the 5-minute expiry cron would overwrite the timestamp at `20:05 WAT`, hiding a failed `20:00 WAT` default cron from the `20:15 WAT` checker. Storing two distinct timestamps (`build-plan.md` Day 0 decision 20, `data-and-schema.md` addition #7) prevents masking a silent default-cron failure.

## Boundary conditions

- **Exact 24-hour pending expiry:** An application created at `14:00:00 UTC` on Day 1 has `expires_at = 14:00:00 UTC` on Day 2. A cron run at `13:59:59 UTC` leaves it `Application Pending`; the cron run at `14:00:01 UTC` transitions it to `Expired`.
- **Exact `19:59 WAT` day-30 default boundary (`BR-03`, `PRD 13.1`):** A contract activated on Day 0 has `due_date` set to `19:59:00 WAT` (`18:59:00 UTC`) on Day 30. The `20:00:00 WAT` (`19:00:00 UTC`) daily cron finds `due_date < NOW()` and transitions it to `Defaulted`.

## Manual catch-up runbook (when a cron heartbeat alert fires)

Version 1 has no background retry queue (`stack.md`). When the cron heartbeat alert banner appears on `Owner Dashboard`:

1. **Inspect `Audit Log` (`/admin/audit`):** Check whether any `APPLICATION_EXPIRED` or `CONTRACT_DEFAULTED` rows were written during the missed window.
2. **Trigger the endpoint manually from a terminal** using `curl -X GET https://<domain>/api/cron/<endpoint> -H "Authorization: Bearer $CRON_SECRET"` (never put `CRON_SECRET` in a URL query string per `env-and-secrets.md`). Because transitions use conditional `WHERE` updates on stored timestamps, re-running is 100% idempotent and safe.
3. **Verify recovery:** Confirm `GET /api/health` is `200 OK`, confirm `last_expiry_cron_at` / `last_default_cron_at` updated, confirm the dashboard warning banner cleared, and record an `AuditLog` entry (`action = 'MANUAL_CRON_CATCHUP'`).

## Unresolved before build (resolved in Day 0 decisions)

1. **Two heartbeat fields in `Settings` (`AGENTS.md` Q42):** Approved in `build-plan.md` Day 0 decision 20 and `data-and-schema.md` addition #7.
2. **`GET` method for cron endpoints in `api-contracts.md` (`AGENTS.md` Q43):** Approved in `build-plan.md` Day 0 decision 19 and updated in `api-contracts.md`.
3. **Manual catch-up vs automated retry (`AGENTS.md` Q44):** Confirmed as manual catch-up only for Version 1 (`stack.md` bans background queue libraries).
