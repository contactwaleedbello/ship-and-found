# security-baseline

Source: PRD Sections 9.3, 5.3, 7.11, 8.5, 9.6, 11, 13.4, 3.3 FR-06, BR-19 plus universal security patterns

## Single job

This file is the concrete security enforcement specification for Version 1: password hashing, AES-256-GCM field encryption, session cookie mechanics, CSRF double-submit cookies, input validation, XSS/SQLi prevention, rate-limit thresholds, OTP mechanics, 24-hour password-reset lock, IP logging, NIN masking, the authoritative PII scrubbing list, and HTTP security headers. Log formatting lives in `observability-baseline.md`; role permissions live in `permission-matrix.md`.

## Password hashing

- **Algorithm and cost:** `bcryptjs` with **cost factor 12** (`PRD 9.3`), because cost 12 resists offline GPU cracking if database snapshots are ever exposed.
- **Password length:** Minimum **8 characters**, maximum **128 characters** (no arbitrary composition rules), because NIST SP 800-63B favors length over complexity while the 128-character cap prevents bcrypt DoS CPU exhaustion on long inputs.
- **Temporary seeded staff passwords (`PRD 16.1`):** Issued in person at Shop ATF 03 and flagged for forced password change on first login, with an `AuditLog` entry written at issue and at change.

## Field encryption at rest (`NIN` and `phone_number`)

- **Cipher:** **AES-256-GCM** implemented in `lib/crypto.ts` using Node's built-in `node:crypto` module (`PRD 5.3`, `9.3`). Never use `AES-CBC` or `AES-ECB`, because GCM provides authenticated encryption (confidentiality + integrity tag) that detects ciphertext tampering.
- **IV and auth tag:** Generate a fresh **12-byte (96-bit) cryptographically random IV** via `crypto.randomBytes(12)` for every encryption operation and store the 16-byte authentication tag alongside the ciphertext using the serialized format:
  `v1:<iv_base64>:<authTag_base64>:<ciphertext_base64>`
  Why: the `v1:` version prefix allows the off-hours key rotation script (`PRD 8.5`) to identify which rows are encrypted with the old key vs the new key (`v2:`) idempotently.
- **Separate 256-bit keys:** Encrypt NIN with `NIN_ENCRYPTION_KEY` and phone numbers with `PHONE_ENCRYPTION_KEY` (`env-and-secrets.md`), because key separation limits blast radius if one key is ever rotated or compromised.

## Session mechanics (`PRD 9.3`, `13.4`)

- **Storage:** Database session table via NextAuth v4 `@auth/prisma-adapter` (`stack.md`), because server-side database rows allow instant invalidation of all sessions when a user resets their password (`PRD 7.11`) or when an Owner suspends a Worker account (`PRD 14.5`).
- **Cookie attributes:** `HttpOnly; Secure; SameSite=Lax; Path=/` (in `development` on `http://localhost`, `Secure` is relaxed automatically by NextAuth), preventing `document.cookie` theft via XSS and cross-site session riding.
- **Session fixation prevention (`PRD 13.4`):** Always regenerate a new session token upon login and delete any prior anonymous/unauthenticated session token.
- **Timeouts:** Idle timeout **24 hours**, absolute timeout **7 days** (confirm on Day 0 per `Unresolved before build` item 4).
- **Session revocation:**
  - `POST /api/auth/logout` deletes the current session row from the database.
  - `POST /api/auth/reset-password` and password change delete **all** session rows for that `user_id` (`PRD 7.11`).
  - Every login, logout, password reset, and account lock/unlock writes an `AuditLog` row.

## CSRF protection (`PRD 9.3`, `13.4`)

- **Double-submit cookie pattern:** On session creation or login, issue a cryptographically random 32-byte hex CSRF token in a cookie (`HttpOnly=false; Secure; SameSite=Lax; Path=/`) and rotate it on every login.
- **Verification:** Client JavaScript reads the cookie and sends the value in the `X-CSRF-Token` request header on every `POST`, `PUT`, `PATCH`, and `DELETE` call. `withApiGuard` (`api-design.md`) compares the cookie and header using `crypto.timingSafeEqual`. On mismatch or missing header, reject with `403 Forbidden` (`code: "CSRF_FAILED"`). `GET`, `HEAD`, and `OPTIONS` are exempt because they are read-only.

## Input validation, output encoding, and SQL injection prevention (`PRD 13.4`)

- **Server-side Zod validation (`.strict()`) on every route (`api-design.md`):** Rejects unknown fields and malformed types before any service or database call runs, because client-side validation can be bypassed with `curl`.
- **XSS prevention:** Rely on React's default JSX output escaping. `dangerouslySetInnerHTML`, `eval()`, and manual HTML string concatenation are strictly banned (`code-conventions.md`).
- **SQL injection prevention:** Use parameterized Prisma Client queries exclusively. `prisma.$queryRawUnsafe` and `prisma.$executeRawUnsafe` are banned.

## Rate limits (`PRD 9.3`, `13.4`)

Enforce the exact thresholds pinned in Consolidated PRD v1.3 Section 9.3 and Section 13.4:

| Scope | Limit | Keyed by | Exceeded response | Reason |
|---|---|---|---|---|
| Public endpoints (`GET /api/devices`, `POST /api/calculator`) | **200 requests / minute** | Client IP (`x-forwarded-for` first hop) | `429` + `Retry-After` header (`ux-states.md` rate limit string) | Accommodates multiple shoppers behind Nigerian mobile CGNAT while blocking scrapers |
| Authenticated endpoints | **30 requests / minute** | `session.userId` | `429` + `Retry-After` header | Prevents automated abuse by a logged-in account |
| OTP and Login endpoints (`/api/auth/login`, `/api/auth/*otp*`, `/api/auth/forgot-password`) | **5 requests / minute** | `phone_number` / `userId` (fallback IP) | `429` + `Retry-After` header | Blocks rapid credential stuffing and OTP brute-forcing (`PRD 9.3`) |
| OTP generation per phone (`PRD 9.3`) | **10 OTP requests / hour** | Normalized `phone_number` | `429` + `Retry-After` header | Prevents SMS wallet draining and harassment of a phone number |
| Login failed-attempt lockout | **5 failed attempts / 15 minutes** | Normalized `phone_number` | Lock login for 15 minutes + write `AuditLog` | Stops password guessing attacks |

Rate-limit `429` responses are logged at `warn` level (`observability-baseline.md`) and never sent to Sentry.

## OTP mechanics (`PRD 9.3`, `11`, `7.8`)

- **Format and lifetime:** Exactly **6 numeric digits** (`crypto.randomInt(100000, 1000000)`), valid for **10 minutes** from generation. Never use `Math.random()`.
- **Attempt limit:** Maximum **3 verification attempts** per issued OTP (`PRD 9.3`). Increment attempt count on each failure; on the 3rd failure, invalidate the OTP immediately so the user must request a new OTP (`ux-states.md` B.6).
- **Storage and comparison:** Store only a SHA-256 HMAC of the OTP in the database, never cleartext, and compare using `crypto.timingSafeEqual` so timing side-channels cannot leak digits.
- **When OTP is required (`AGENTS.md`, `business-rules.md`):**
  1. Registration (`POST /api/auth/register` -> `POST /api/auth/verify-otp`).
  2. Forgot-password reset (`POST /api/auth/forgot-password` -> `POST /api/auth/reset-password`).
  3. Agreement acceptance (`POST /api/auth/accept-agreement-otp` -> `POST /api/applications/:id/accept-agreement`).
  4. Store Worker in-person resend fallback (`POST /api/worker/otp-resend`, logged in `AuditLog` per `PRD 7.8`).
  - **Never** require OTP at login or at application submission (`FR-03`).

## Password reset 24-hour account lock (`PRD 7.11`, `9.3`)

When a user completes `POST /api/auth/reset-password`:
1. Set `User.locked_until = NOW() + 24 hours` and `User.account_status = 'LOCKED_PASSWORD_RESET'`.
2. Delete all active sessions for that `user_id`.
3. Write an `AuditLog` row (`action = 'PASSWORD_RESET_LOCK'`).
4. Block login and any authenticated action while `locked_until > NOW()`, unless an `Owner` or `Co-owner` verifies the customer's identity in person at Shop ATF 03 and unlocks the account (which clears `locked_until` and writes an `AuditLog` row per `PRD 7.11` and `14.5`).
Why: prevents a thief with a stolen phone and SIM from resetting the password via SMS OTP and immediately submitting a fraudulent part-payment application.

## IP extraction and collision detection (`BR-19`, `PRD 7.13`)

- Extract client IP exclusively from the first address in the Vercel-managed `x-forwarded-for` header (or `x-real-ip`), never from a custom client header, to prevent IP spoofing.
- Record the IP in `DownPaymentTransaction.verifier_ip` (and `AuditLog.ip_address`) at down-payment verification, and in `AuditLog.ip_address` at final approval.
- Inside the final-approval transaction (`state-transitions.md`), if `approverIp === verifierIp`, create the non-dismissible Owner/Co-owner IP collision alert (`notification-matrix.md`).

## NIN masking (`PRD 9.3`, `10`)

- **Owner and Co-owner:** Receive decrypted 11-digit NIN only on single-record detail endpoints (`Review Application`, `Deletion Requests`), never on bulk list endpoints (`permission-matrix.md`). Every full-NIN read writes an `AuditLog` entry (`action = 'NIN_ACCESS'` per `ndpa-compliance.md`).
- **Store Worker:** Never receives the full NIN over the network. The API route masks the NIN on the server before JSON serialization (e.g., `*******1234` showing only the last 4 digits; confirm exact mask pattern on Day 0 per `Unresolved before build` item 1).
- **Customer:** Does not receive raw NIN back after submission unless confirmed on Day 0 (`permission-matrix.md`).

## Authoritative PII and secret scrubbing list

The fields below must be stripped by `lib/logger.ts` and by Sentry's `beforeSend` and `beforeBreadcrumb` hooks before any log line, error response, or Sentry payload leaves the server or browser:

- `nin`, `phoneNumber`, `phone_number`, `fullName`, `full_name`, `personalDetails`, `personal_details`, `guarantorName`, `guarantor_name`, `guarantorPhone`, `guarantor_phone`, `password`, `passwordHash`, `password_hash`, `otp`, `token`, `csrfToken`, `cookie`, `authorization`, and all environment secrets in `env-and-secrets.md`.

## Security headers (`middleware.ts`)

Set these headers on every HTTP response in `middleware.ts` to harden browser defenses:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy-Report-Only`: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.ingest.sentry.io https://*.sentry.io; frame-ancestors 'none';` (Report-only in Version 1 so Next.js 14 inline hydration scripts and Sentry ingest work without false blocks; tighten to nonce-based enforcing CSP in Version 1.1).

## Dependency audit

Run `npm audit --audit-level=high` in CI on every PR. Any `high` or `critical` vulnerability blocks merge until patched or mitigated; `moderate` vulnerabilities are logged in `working-agreements.md` for remediation within 14 days.

## Unresolved before build

Track in `working-agreements.md` and resolve on Day 0 (`build-plan.md`):

1. **NIN mask format for Store Worker (`AGENTS.md` Q22, Q51):** Confirm `*******1234` (7 asterisks + last 4 digits) vs full mask `***********`.
2. **Rate-limit backing store on Vercel (`AGENTS.md` Q14, Q60):** Confirm Postgres table vs sliding-window counter for the PRD 9.3 rate limits (`200/min IP`, `30/min user`, `5/min OTP/login`, `10/hr OTP`).
3. **OTP lockout UI string after 3 failed attempts (`AGENTS.md` Q28, Q53):** Confirm exact string to add to `ux-states.md` B.6.
4. **Session idle (24h) and absolute (7d) timeouts (`AGENTS.md` Q54):** Confirm with Product Lead on Day 0.
5. **Key rotation script location and batch size (`AGENTS.md` Q55):** Confirm `scripts/rotate-keys.ts` batch size (e.g., 100 rows per transaction) for off-hours rotation (`PRD 8.5`).
6. **`bcryptjs` cost 12 vs 11 on Vercel Hobby/Pro CPU (`AGENTS.md` Q56):** Keep cost 12 per `PRD 9.3`; only drop to 11 with a written Day 0 decision if login P95 exceeds 1,000ms (`non-functional.md`).
