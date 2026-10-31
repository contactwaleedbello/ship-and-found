# third-party

Source: PRD Sections 8.4, 8.1, 8.3, 6, 5.3, Appendix G

## Single job

This file is the whitelist of external network services Version 1 may communicate with, the exact routes allowed to call each service, and the PII data-flow boundary for each service. Package versions live in `stack.md`; secret names live in `env-and-secrets.md`. Any outbound HTTP call or client script reaching a domain not listed here is a bug.

## Approved external services

### 1. SMS provider — Termii or Africa's Talking (`build-plan.md` Day 0 decision 2)

- **Scope:** Outbound SMS delivery for the 4 OTP triggers in `notification-matrix.md` only (registration, forgot-password reset, agreement acceptance, and Store Worker in-person resend). No marketing, reminder, or status SMS (`PRD 6`, `11`).
- **Calling routes (server-side only):**
  - `POST /api/auth/register`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/accept-agreement-otp`
  - `POST /api/worker/otp-resend`
  *(Note: `POST /api/auth/verify-otp` and `POST /api/auth/reset-password` verify codes against our database; they do not call the SMS provider.)*
- **Data flow boundary:** Send only the recipient `phone_number` and the rendered OTP SMS body from `message-templates.md`. Never send `NIN`, `full_name`, `guarantor_name`, device details, or contract amounts to the SMS provider, because NDPA data minimization (`ndpa-compliance.md`) restricts third-party transmission to the minimum fields needed for delivery.
- **Failure handling:** Do not add an automated retry queue (`stack.md`). If the SMS provider fails or the customer has no network, the customer uses the in-person Store Worker OTP resend fallback at Shop ATF 03 (`failure-modes.md` 7.8).

### 2. Managed PostgreSQL — Neon or Supabase (`build-plan.md` Day 0 decision 4)

- **Scope:** Primary relational database hosting with automated daily snapshots and 5-minute Point-in-Time Recovery (`PRD 8.4`, `17.1`).
- **Calling routes:** Server-side services called by API routes, Server Components, and cron routes via the `lib/db.ts` Prisma singleton over TLS (`DATABASE_URL`).
- **Data flow boundary:** Stores all application models in `data-and-schema.md`. `NIN` and `phone_number` must be encrypted with AES-256-GCM (`lib/crypto.ts`) in the application layer **before** Prisma writes them to PostgreSQL so the database host never holds cleartext NIN or phone numbers at rest (`PRD 5.3`).
- **Topology:** Single primary database connection pool in Version 1; no read replicas.

### 3. Sentry — error tracking (`PRD 8.1`, `8.4`, `15.1`)

- **Scope:** Runtime 5xx exception and cron failure capture via `@sentry/nextjs` (`monitoring.md`).
- **Calling boundary:** Initialized once on server and client startup; sends error envelopes to `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`.
- **Data flow boundary:** Send scrubbed stack traces, route path, HTTP method, status code, `correlationId`, and release SHA only. Strip all PII (`NIN`, `phone_number`, `full_name`, `personal_details`, `guarantor_name`, `guarantor_phone`, passwords, OTPs, request bodies, and user identity scope) inside `beforeSend` and `beforeBreadcrumb` (`security-baseline.md`).
- **Disabled Sentry features:** Do not enable Sentry Session Replay, Profiling, or Sentry Crons (`monitoring.md`).

### 4. Vercel and Vercel Cron — hosting and job scheduling (`PRD 8.1`, `8.4`, `14.3`)

- **Scope:** Next.js application hosting and scheduled inbound HTTP `GET` triggers configured in `vercel.json`.
- **Inbound cron routes (`cron.md`):**
  - `GET /api/cron/expire-applications`
  - `GET /api/cron/default-contracts`
  - `GET /api/cron/check-expiry-heartbeat`
  - `GET /api/cron/check-default-heartbeat`
- **Data flow boundary:** Authenticated via `CRON_SECRET` header (`env-and-secrets.md`). No Vercel Analytics or Vercel Speed Insights scripts may be injected into the client (`monitoring.md`).

### 5. `wa.me` — client-side WhatsApp deep link (`PRD 8.1`, `11`, `2.3.7`)

- **Scope:** Client-side URL link (`https://wa.me/<phone>?text=<encodedTemplate>`) that opens the native WhatsApp app or WhatsApp Web with a prefilled message from `message-templates.md`.
- **Where used:**
  1. **Store Worker Dashboard (`Reminder Checklist`, `Payments to Verify`, `Final Approval` confirmation):** Sends manual WhatsApp messages (`A.1 T-7` through `A.1 T+1`, `A.2`, `A.5`, `A.6`) to the customer's phone. If `wa.me` fails or WhatsApp is not installed, the Worker copies the rendered template to the clipboard and clicks `Mark as Sent` (`FR-07`).
  2. **Public / Customer (`Device Detail` and `Apply for Part-Payment` when out of stock or stale price):** Opens `Confirm Current Price via WhatsApp` (`Template A.3`) addressed to the Shop ATF 03 WhatsApp number, with fallback text `"Call Shop ATF 03 or visit in person."` (`FR-12`).
- **Data flow boundary:** Zero server-side HTTP calls to WhatsApp or Meta. The server never calls the WhatsApp Business API, Meta Graph API, or Twilio (`out-of-scope.md`).

### 6. File storage — Supabase Storage or AWS S3 (`build-plan.md` Day 0 decision 3 — Version 2 only)

- **Scope:** Reserved for Version 2 receipt uploads (`PRD 8.1`, `8.4`).
- **Version 1 rule:** Zero calls, zero SDK installed, and zero upload routes built in Version 1, because receipt upload was explicitly cut in PRD Section 6 to protect the 1-week delivery timeline (`out-of-scope.md`).

## Services strictly forbidden in Version 1 (`PRD 6`, `8.4`)

Do not write any `fetch` call, SDK import, webhook route, or `<script>` tag for any of the following, because each is excluded from Version 1 scope (`out-of-scope.md`):

- **Payment gateways** (Paystack, Flutterwave, Monnify, Stripe, Remita) — all payments are verified manually by a Store Worker at Shop ATF 03 (`BR-06`).
- **Server-side WhatsApp APIs** (WhatsApp Business Cloud API, Twilio, Termii WhatsApp) — all WhatsApp messages are manual human sends (`PRD 6`).
- **External NIN verification or credit bureau APIs** (NIMC, Mono, Okra, CRC Credit Bureau) — NIN is validated for 11 digits and reviewed manually by the Owner (`PRD 6`).
- **Email and push notification services** (Resend, SendGrid, Postmark, Firebase FCM, OneSignal) — User model has no email field (`PRD Structural Assumptions`).
- **Third-party analytics, session replay, or chat widgets** (Google Analytics, PostHog, Mixpanel, Hotjar, Intercom, Crisp) — banned by `PRD 15.2` and `out-of-scope.md`.
- **Remote device locking / MDM APIs** — Version 1 uses an administrative database flag only (`BR-09`).

## Constraints

- **One integration method per approved service** (`stack.md`).
- **All outbound HTTP requests execute on the server** inside `lib/services/*` (except Sentry browser error reporting and user-clicked `wa.me` navigation links), so API keys and raw PII never touch the browser network tab.
- **Cross-border data transfer check (`ndpa-compliance.md`):** Do not send personal data (`NIN`, `full_name`, `guarantor_name`, `guarantor_phone`, `personal_details`) to any external service outside our encrypted PostgreSQL database.
