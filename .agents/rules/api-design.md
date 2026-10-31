# api-design

Source: PRD Sections 8.3, 9.3, 10, 9.6, 14.2, 3.3 FR-08 plus `stack.md`

## Single job

This file defines the wire-level contract that every API route in `api-contracts.md` must follow: authentication and role-check execution, request and response envelopes, error envelope, HTTP status codes, IDOR 404 rule, idempotency, pagination, CSRF, and rate-limit headers. `api-contracts.md` defines *which* endpoints exist; this file defines *how* every endpoint behaves.

## Auth pattern

- **Session cookie issued by NextAuth v4 (`stack.md`)** backed by the Prisma database session adapter (`security-baseline.md`), because database sessions allow immediate server-side revocation on logout and on the 24-hour password-reset lock (`PRD 7.11`). No JWT Bearer tokens or API keys for user-facing routes.
- **Cron endpoints (`/api/cron/*`) authenticate exclusively via the `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret: <CRON_SECRET>` header (`cron.md`)**, because Vercel Cron invokes routes without a user session.
- **Every non-cron route requires a valid server session except the explicit public routes:**
  - `GET /api/devices`
  - `GET /api/devices/:id`
  - `POST /api/calculator`
  - `GET /api/health`
  - `POST /api/auth/register`
  - `POST /api/auth/verify-otp`
  - `POST /api/auth/login`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`

## Role check and middleware pattern (Next.js 14 App Router)

Because NextAuth v4 uses database sessions via Prisma (which runs on the Node.js runtime, not the Edge runtime) and Next.js `middleware.ts` cannot pass in-memory objects to Route Handlers:

1. **Edge `middleware.ts` handles:** security headers (`security-baseline.md`), correlation ID injection (`x-correlation-id`), coarse cookie-presence redirect for unauthenticated browser page requests, and IP-based public rate limiting.
2. **Every API Route Handler wraps its logic in a shared Node.js server helper `withApiGuard(options, handler)` in `lib/auth/api-guard.ts`** that executes before any handler logic runs:
   - Calls NextAuth `getServerSession(authOptions)` against the database session table and checks `User.account_status` and `User.locked_until` (`security-baseline.md`).
   - Checks the session user's `role` against the route's allowed roles from `permission-matrix.md`. If a route is not in the role map or the user's role is not permitted, returns `403 Forbidden` immediately (default-deny).
   - Verifies the double-submit CSRF token (`X-CSRF-Token` header matches CSRF cookie) on `POST`, `PUT`, `PATCH`, and `DELETE` (`security-baseline.md`).
   - Passes the verified `{ userId, role, customerId, ipAddress, correlationId }` context object into the handler so handlers never read role or user ID from request body, query params, or client headers.

## Request shape

- **Method and path** must match `api-contracts.md` exactly. No URL versioning (`/api/...`, not `/api/v1/...`), because Version 1 has a single first-party web client deployed atomically with the API.
- **Request body is JSON (`Content-Type: application/json`)** for `POST`, `PUT`, and `PATCH`. Reject non-JSON bodies with `400`.
- **No request body on `GET` or `DELETE`**, because HTTP proxies and Vercel CDN layers strip or reject bodies on `GET`.
- **Query parameters are scalar strings** (or a single comma-separated string for multi-value filters like `brand=HP,Dell`), because nested query objects create ambiguous parsing.
- **JSON field names are `camelCase` on the wire** (even though Prisma maps to `snake_case` columns in PostgreSQL per `data-and-schema.md`), keeping TypeScript frontend and API payloads uniform.
- **Strict Zod validation on every route:** Every route defines a `.strict()` Zod schema for body, path params, and query params so unknown fields are rejected (`400 VALIDATION_ERROR`) rather than silently stripped (`security-baseline.md`).

## Response shape

### Success responses

Single resource or action response (`200 OK` or `201 Created`):

```json
{
  "data": {
    "applicationId": "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    "applicationStatus": "Application Pending",
    "lockedPrice": 300000,
    "downPaymentAmount": 220000,
    "remainingAmount": 80000,
    "expiresAt": "2026-11-01T18:00:00.000Z"
  }
}
```

Paginated list response (`200 OK`):

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 120,
    "totalPages": 3
  }
}
```

**Exception:** `GET /api/health` returns the flat object `{"status":"ok","db":"ok","timestamp":"<ISO8601>"}` (or `503` `{"status":"degraded","db":"unreachable","timestamp":"<ISO8601>"}`) as specified in `monitoring.md`.

### Error envelope

Every non-2xx response (except `401` on cron endpoints which returns an empty body per `cron.md`) uses this exact envelope so the client UI can render the exact string from `ux-states.md`:

```json
{
  "error": {
    "code": "OVERPAYMENT_BLOCKED",
    "message": "Amount exceeds remaining balance.",
    "details": {
      "amount": ["Amount exceeds remaining balance."]
    }
  }
}
```

- `code`: machine-readable `SCREAMING_SNAKE_CASE` string.
- `message`: exact user-facing string from `ux-states.md` or `functional-requirements.md`. Never include stack traces, SQL/Prisma error codes, or file paths (`security-baseline.md`).
- `details`: optional map of `fieldName -> string[]` included only on `400 VALIDATION_ERROR` responses to power inline field errors (`accessibility-baseline.md`).

## 12 HTTP status codes

Use only these 12 status codes across all routes so client error handling is deterministic:

| Status | Error code | When to use | Reason |
|---|---|---|---|
| `200 OK` | — | Successful `GET`, state-transition `POST`, update, or idempotent replay | Standard success response |
| `201 Created` | — | `POST /api/auth/register`, `POST /api/applications`, `POST /api/customer/deletion-request`, payment record creation | Signals a new primary resource was created |
| `400 Bad Request` | `VALIDATION_ERROR`, `SAME_USER_FORBIDDEN`, `OVERPAYMENT_BLOCKED`, `MISSING_ACCEPTANCE`, `INVALID_STATE_TRANSITION`, `OTP_INVALID`, `OTP_EXPIRED` | Zod validation failure, business rule violation (`BR-02`, `BR-13`, `FR-06`, `FR-08`), or invalid OTP | Request syntax or business invariant failed |
| `401 Unauthorized` | `UNAUTHENTICATED` | Missing or expired session cookie, invalid credentials on login, or invalid `CRON_SECRET` | Caller must authenticate (`ux-states.md` redirects to Login) |
| `403 Forbidden` | `FORBIDDEN`, `CSRF_FAILED`, `ACCOUNT_LOCKED`, `PURCHASE_BLOCKED` | Authenticated user lacks role (`permission-matrix.md`), CSRF token mismatch, 24h password-reset lock (`PRD 7.11`), or defaulted customer purchase block (`BR-09`) | Identity is known but action is prohibited |
| `404 Not Found` | `NOT_FOUND` | Resource does not exist OR a Customer requests another Customer's application/contract/payment (IDOR protection) | Prevents resource existence enumeration |
| `405 Method Not Allowed` | `METHOD_NOT_ALLOWED` | HTTP verb not supported by the route (e.g. `POST` to a `GET` cron endpoint) | Enforces strict method contracts |
| `409 Conflict` | `OUT_OF_STOCK`, `STALE_PRICE`, `PRICE_CHANGED`, `DUPLICATE_APPLICATION`, `CONCURRENT_MODIFICATION`, `PHONE_ALREADY_REGISTERED` | Concurrency race on last stock unit, stale price, price changed since form load, duplicate pending application within 24h (`PRD 9.2`), or concurrent final approval (`PRD 13.1`) | Resource state conflicts with request |
| `422 Unprocessable Entity` | `RETENTION_REQUIRED` | Deletion request rejected because customer has an Active or Defaulted contract (`FR-10`), or resolve attempted when `remaining_amount > 0` | Semantically valid request blocked by domain lifecycle |
| `429 Too Many Requests` | `RATE_LIMIT_EXCEEDED`, `OTP_LOCKED` | Rate limit exceeded or 3 failed OTP attempts / 5 failed login attempts (`security-baseline.md`) | Throttles brute force; must include `Retry-After` header |
| `500 Internal Server Error` | `INTERNAL_ERROR` | Unhandled server or database exception | Masked generic message; full error sent to Sentry |
| `503 Service Unavailable` | `SERVICE_UNAVAILABLE` | `GET /api/health` when Postgres check fails or times out (>2s), or SMS gateway unreachable without fallback | Signals infrastructure degradation to uptime monitor |

## IDOR 404 rule

When a `Customer` requests `/api/applications/:id`, `/api/contracts/:id`, or any customer-owned resource where `customer_id !== session.customerId`, query with `WHERE application_id = :id AND customer_id = :sessionCustomerId` and return **`404 Not Found` (`NOT_FOUND`)**, never `403 Forbidden`. Why: returning `403` reveals that the UUID exists and belongs to another customer (`PRD 13.4`, `permission-matrix.md` hard constraint 4).

## Idempotency

- **Application submission duplicate guard (`PRD 9.2`):** Reject `POST /api/applications` with `409 DUPLICATE_APPLICATION` if the same `customer_id` + `device_id` already has an application created within the last 24 hours that is still in an active/pending state.
- **State-changing `POST` endpoints** (payment recording, final approval, status transitions) accept an optional `Idempotency-Key` UUID header and use conditional database updates inside a transaction (`WHERE application_status = '<expected_prior_status>'`) so double-clicks or network retries cannot double-record a payment or double-approve an application (`PRD 13.1`).
- **Cron endpoints** (`GET /api/cron/*`) are naturally idempotent via `WHERE` state predicates (`cron.md`).

## Pagination

- **Audit log (`GET /api/admin/audit`) and admin/worker queues (`applications`, `defaults`, `deletion-requests`, `inventory-approvals`):** Paginate with query params `?page=1&pageSize=50` (default `page=1`, default and maximum `pageSize=50` per `PRD 9.1`).
- **Public inventory (`GET /api/devices`):** Returns up to `500` devices in a single page without degradation (`PRD 9.1`); paginate with `pageSize=500` if inventory exceeds 500.

## CSRF and rate-limit headers

- **CSRF:** Validated on all `POST`, `PUT`, `PATCH`, `DELETE` routes via the double-submit cookie pattern (`X-CSRF-Token` header equals CSRF cookie value per `security-baseline.md`). Mismatch returns `403` with `code: "CSRF_FAILED"`.
- **Rate limit responses (`429`):** Always include `Retry-After: <seconds>` in the HTTP response headers and render `"Too many requests. Wait a moment and try again."` (`ux-states.md`).

## Constraints

- Never read `role`, `userId`, or `customerId` from request body, query params, or headers; always read from the server session in `withApiGuard`.
- Never return a raw database error, Prisma error code, or stack trace in an API response.
- Every multi-table write inside a route's service call runs inside a single `prisma.$transaction` (`data-and-schema.md`).

## Unresolved before build

Track in `working-agreements.md` and resolve on Day 0:

1. **`Idempotency-Key` storage table:** `data-and-schema.md` does not include an `IdempotencyKey` table. Decide on Day 0 whether to rely on conditional state transitions + double-submit UI disable (`ux-states.md`) or add an `IdempotencyKey` table (`AGENTS.md` open question 50).
2. **Path prefix consistency:** `POST /api/customer/deletion-request` uses `/api/customer/*` while `GET /api/applications/mine` uses `/mine`. Keep exact PRD 8.3 paths for Version 1 unless changed on Day 0 (`api-contracts.md`).
3. **CGNAT vs per-IP public rate limit tuning:** PRD 9.3 sets 200 req/min per IP public, 30 req/min per user authenticated, 5 req/min per user on OTP/login. Confirm in-memory vs Redis/Postgres rate-limit counter store on Vercel serverless (`AGENTS.md` open question 14).
