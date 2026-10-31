# observability-baseline

Source: PRD Sections 15.1, 7.12, 9.2, 14.3, 9.1 plus universal structured-logging patterns

## Single job

This file defines the wire format for application logs (`lib/logger.ts`), the 4 log levels, correlation ID propagation, error capture boundaries between logs and Sentry, third-party call logging, and how health/heartbeat writes are formatted. `monitoring.md` defines what thresholds trigger alerts; `security-baseline.md` defines the PII scrubbing list; this file defines the structure of every emitted telemetry event.

## Log format

Every log line written by the application must be a single-line serialized JSON object emitted through `lib/logger.ts` so Vercel logs can be filtered by field without regex parsing. No free-form text logs, no multi-line logs, and no direct `console.log` calls outside `lib/logger.ts`.

Required and optional fields on every log line:

```json
{
  "timestamp": "2026-10-31T19:00:00.000Z",
  "level": "info",
  "message": "Application submitted",
  "correlationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "service": "dg-tech-store",
  "environment": "production",
  "route": "/api/applications",
  "method": "POST",
  "statusCode": 201,
  "durationMs": 142,
  "userId": "u_123",
  "applicationId": "app_456",
  "contractId": null,
  "error": null
}
```

- **Always required:** `timestamp` (ISO 8601 UTC), `level`, `message`, `correlationId`, `service`, `environment`.
- **Required on HTTP route logs:** `route`, `method`, `statusCode`, `durationMs`.
- **Allowed domain identifiers (when present):** `userId`, `applicationId`, `contractId`, `deviceId`, `requestId`.

## Four log levels and when to use each

| Level | When to use | Sent to Sentry? | Reason |
|---|---|---|---|
| `debug` | Local development diagnostic detail only (disabled in `preview` and `production`) | No | Prevents high-volume noise in Vercel logs |
| `info` | Normal request completion, cron start/completion, heartbeat write, outbound SMS call metadata | No | Provides operational request trace without alerting |
| `warn` | Handled client/business rejections worth operational visibility: `403` role mismatch, `409` concurrency conflict, `429` rate limit hit, OTP lockout, IP collision detected | No | Tracks suspicious or degraded patterns without polluting 5xx error budgets |
| `error` | Unhandled exceptions, `500`/`503` responses, database transaction failures, failed cron runs, SMS provider HTTP 5xx/timeout | Yes (`Sentry.captureException`) | Triggers error rate tracking and Sentry stack-trace capture |

## Banned fields and practices in logs

- **Never log any field on the PII or secret scrubbing list in `security-baseline.md` and `env-and-secrets.md`:** NIN, phone number, full name, personal details, guarantor name, guarantor phone, password, OTP code, session token, CSRF token, or any environment secret (`DATABASE_URL`, `SMS_API_KEY`, encryption keys, `CRON_SECRET`), because Vercel logs are plaintext and NDPA (`ndpa-compliance.md`) forbids cleartext PII in application logs.
- **Never log raw request bodies or response bodies**, because request bodies on auth and application routes contain passwords, NINs, and phone numbers.
- **Never interpolate user-supplied strings directly into `message`**; pass safe identifiers in structured fields only, preventing log injection and accidental PII leakage.

## Correlation ID propagation

1. `middleware.ts` reads the incoming `x-correlation-id` header if it is a valid UUID; otherwise it generates a new UUID via `crypto.randomUUID()`.
2. The correlation ID is attached to the request headers, included in every `lib/logger.ts` line for that request, stored in `AuditLog.metadata.correlationId` when an audit row is written, attached as a tag (`correlation_id`) on any Sentry event for that request, and returned to the client in the `x-correlation-id` response header.
3. Why: allows an engineer or Owner investigating a failed request or AuditLog row to trace the exact execution across Vercel logs, Postgres `AuditLog`, and Sentry.

## Error capture convention and frontend boundary

- **Server boundary (`lib/errors.ts`):** Only `5xx` unhandled errors and cron/infrastructure failures are sent to `Sentry.captureException`. Expected `4xx` errors (`AppError`, `ZodError`, `401`, `403`, `404`, `409`, `422`, `429`) are never reported to Sentry so genuine bugs are not buried under user validation errors.
- **Frontend boundary (`app/error.tsx` and `app/global-error.tsx`):** Client components never call `console.log` or `console.error` in production. Uncaught React render errors are caught by `error.tsx`, reported to Sentry via the browser SDK (`beforeSend` scrubs PII per `security-baseline.md`), and render the global error string `"Something went wrong on our end. Try again."` (`ux-states.md`).

## Health endpoint wire contract and heartbeat write pattern

- **Health endpoint (`GET /api/health`):** Follows the wire contract in `monitoring.md`:
  - `200 OK`: `{"status":"ok","db":"ok","timestamp":"<ISO8601>"}`
  - `503 Service Unavailable`: `{"status":"degraded","db":"unreachable","timestamp":"<ISO8601>"}` (never include raw Prisma/Postgres error text per `security-baseline.md`).
- **Heartbeat write pattern (`cron.md`):** Cron routes log `info` on start (`"Cron started"`), execute their transactional batch, update `last_expiry_cron_at` or `last_default_cron_at` in `Settings` **only after** all row transitions succeed, and log `info` (`"Cron completed"`, including `processedCount` and `durationMs`). If any unhandled error occurs, do not update the heartbeat field, log `error`, and call `Sentry.captureException`.

## Third-party call logging

Every outbound HTTP call to the SMS provider (`third-party.md`) logs a single structured `info` (or `error` on failure) line containing:
- `provider` (`"termii"` or `"africas_talking"`), `operation` (`"send_otp"`), `httpStatus`, `durationMs`, and `correlationId`.
- **Never** log the recipient `phone_number`, the `otp` code, or the `SMS_API_KEY`.

## Log volume and retention

- **Vercel runtime logs** are ephemeral operational logs whose retention is governed by the Vercel plan (`monitoring.md`).
- **PostgreSQL `AuditLog` (`data-and-schema.md`, `ndpa-compliance.md`)** is the immutable system of record for all security, financial, approval, verification, reminder, and NDPA events. Never rely on Vercel logs in place of an `AuditLog` write.

## Constraints

- All application logging goes through `lib/logger.ts`. Direct `console.*` calls in routes, services, or components are forbidden (`code-conventions.md`).
- Apply the PII scrubber inside `lib/logger.ts` as a defense-in-depth filter before `JSON.stringify` writes to stdout.
- Do not install `pino`, `winston`, `bunyan`, or any external logging library (`stack.md`).

## Unresolved before build

Track in `working-agreements.md` and resolve on Day 0:

1. **`lib/logger.ts` helper API shape** — confirm exact method signatures (`logger.info(message, context)`) before Day 1 foundation (`AGENTS.md` open question 57).
2. **Vercel log retention period** on the chosen Vercel plan (`monitoring.md`; `AGENTS.md` open question 58).
3. **Sentry project structure** — one Sentry project with `environment` tags (`development`, `preview`, `production`) vs separate Sentry DSNs per environment (`AGENTS.md` open question 59).
4. **Rate-limit warning log volume** — confirm whether `429` events are logged per hit or sampled if a bot floods a public route (`AGENTS.md` open question 60).
