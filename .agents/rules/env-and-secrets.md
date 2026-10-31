# env-and-secrets

Source: PRD Section 8.5 plus universal secret-management discipline

## Single job

This file defines the complete list of environment variables in Version 1, their startup validation rules in `lib/env.ts`, environment separation (`Development`, `Preview`, `Production`), per-variable rotation procedures, and the leak response runbook. It never contains secret values.

## Environments (`PRD 8.5`, `14.1`)

Three isolated environments exist so test or UAT actions never touch live customer contracts or production encryption keys:

1. **Development:** Engineer's local machine using gitignored `.env.local`, populated from the team password manager with development-only credentials and local PostgreSQL.
2. **Preview:** Ephemeral Vercel preview deployment per pull request (`PRD 14.2`), backed by a Preview PostgreSQL database and test SMS credentials for UAT.
3. **Production:** Vercel `main` branch deployment backed by Production PostgreSQL with PITR (`PRD 17.1`). Only the Product Lead and Owner have write access to Production environment variables in Vercel.

Never reuse a secret value (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NIN_ENCRYPTION_KEY`, `PHONE_ENCRYPTION_KEY`, `CRON_SECRET`, `SMS_API_KEY`) across Development, Preview, and Production, because a leaked development or preview key must never compromise production data.

## Environment variable inventory (10 PRD variables + platform runtime notes)

Only the variables below are permitted in `lib/env.ts`. Do not add any other environment variable without updating this file and `build-plan.md`:

| Variable name | Purpose | Required in | Validation rule in `lib/env.ts` | Consumed by |
|---|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection URI | All (`dev`, `preview`, `prod`) | `z.string().url().startsWith('postgres')` | `lib/db.ts` (Prisma Client) |
| `NEXTAUTH_SECRET` | HMAC signing secret for NextAuth cookies/CSRF | All | `z.string().min(32)` (at least 256 bits of entropy) | `lib/auth/` (NextAuth v4) |
| `SMS_API_KEY` | API key for Termii or Africa's Talking | All | `z.string().min(16)` | `lib/services/sms-service.ts` |
| `S3_ACCESS_KEY` | File storage access key (reserved for Version 2) | `preview`, `prod` (optional in `dev`) | `z.string().min(1).optional()` in `dev`; required non-empty in `preview`/`prod` per PRD 8.5 | Unused in Version 1 (`out-of-scope.md`) |
| `S3_SECRET_KEY` | File storage secret key (reserved for Version 2) | `preview`, `prod` (optional in `dev`) | `z.string().min(1).optional()` in `dev`; required non-empty in `preview`/`prod` per PRD 8.5 | Unused in Version 1 (`out-of-scope.md`) |
| `NIN_ENCRYPTION_KEY` | 32-byte key for AES-256-GCM encryption of `NIN` | All | `z.string()` decoding to exactly 32 bytes (64 hex chars or 44 base64 chars) | `lib/crypto.ts` |
| `PHONE_ENCRYPTION_KEY` | 32-byte key for AES-256-GCM encryption of `phone_number` | All | `z.string()` decoding to exactly 32 bytes (64 hex chars or 44 base64 chars); must not equal `NIN_ENCRYPTION_KEY` | `lib/crypto.ts` |
| `CRON_SECRET` | Bearer secret authenticating `/api/cron/*` | All (`dev` uses local test value; `preview`/`prod` use Vercel secret) | `z.string().min(32)` | `app/api/cron/**/route.ts` (`cron.md`) |
| `SENTRY_DSN` | Server-side Sentry ingest DSN | All | `z.string().url()` | Server Sentry initialization (`monitoring.md`) |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser-side Sentry ingest DSN | All | `z.string().url()` | Client Sentry initialization (`monitoring.md`) |

**Platform note on NextAuth v4 URL resolution:** On Vercel `Preview` and `Production`, NextAuth v4 automatically reads the platform-injected `VERCEL_URL` variable; in `Development`, set `NEXTAUTH_URL=http://localhost:3000` in `.env.local` if required by NextAuth v4 local callback resolution.

## Naming and startup validation rules (`lib/env.ts`)

- **Naming:** `SCREAMING_SNAKE_CASE` only. Only `NEXT_PUBLIC_SENTRY_DSN` may use the `NEXT_PUBLIC_` prefix, because Next.js inlines `NEXT_PUBLIC_*` values into the browser JavaScript bundle at build time; prefixing a secret with `NEXT_PUBLIC_` leaks it to every visitor.
- **Fail-fast startup validation:** `lib/env.ts` parses all variables with Zod at module load time and verifies that `NIN_ENCRYPTION_KEY !== PHONE_ENCRYPTION_KEY`. If any required variable is missing or malformed, `lib/env.ts` throws immediately at startup so a misconfigured deploy fails before serving traffic.
- **No `SKIP_ENV_VALIDATION` bypass** and **no direct `process.env` access outside `lib/env.ts`** (`code-conventions.md` forbidden pattern 6). Every module imports validated constants from `@/lib/env`.
- **Committed `.env.example`:** Commit `.env.example` containing only the variable names with empty values (`DATABASE_URL=`) and comments indicating expected format—never real or realistic placeholder secrets. Ensure `.env`, `.env.local`, and `.env.*.local` are in `.gitignore`.

## What does not belong in environment variables

- **Runtime business thresholds (`freshness_window`, `down_payment_min`, `down_payment_max`, `window_days`, `expiry_hours`):** These live in the PostgreSQL `Settings` table (`PRD 8.5`, `data-and-schema.md`) and `lib/constants.ts`, because `Settings` also stores the mutable cron heartbeats (`last_expiry_cron_at`, `last_default_cron_at`).
- **Feature flags:** Banned in Version 1 (`version-2-data.md`).
- **Message templates or UI strings:** Live in `lib/templates.ts` and `ux-states.md` constants.

## Rotation triggers and per-variable runbook (`PRD 8.5`, `14.5`)

Rotate secrets immediately upon: (1) any staff change (engineer, Owner, or Co-owner offboarding per `PRD 8.5`), (2) any suspected leak in logs, chat, or Git history, or (3) any third-party provider breach notice. Every rotation updates both Vercel and the Product Lead's encrypted password-manager backup in the same maintenance window:

1. **`NIN_ENCRYPTION_KEY` and `PHONE_ENCRYPTION_KEY` (`PRD 8.5`, `14.5`):**
   - Never overwrite an encryption key in Vercel before re-encrypting existing rows, or stored NINs and phone numbers become permanently unreadable.
   - Run the idempotent off-hours rotation script (`scripts/rotate-keys.ts`) which reads rows with the old key version prefix (`v1:`), decrypts with the old key, re-encrypts with the new key (`v2:`), updates rows in batches inside transactions, and writes the total re-encrypted row count to `AuditLog` (`action = 'KEY_ROTATION'`). Once 0 `v1:` rows remain, promote the new key in Vercel.
2. **`DATABASE_URL`:** Rotate the database user password in the Neon/Supabase console and update `DATABASE_URL` in Vercel within the same 10-minute off-hours window, then redeploy/restart serverless instances.
3. **`NEXTAUTH_SECRET`:** Rotate in Vercel during off-hours. Note: rotating invalidates existing signed cookies/CSRF tokens, requiring active users to log in again.
4. **`SMS_API_KEY`:** Generate a new API key in the Termii or Africa's Talking dashboard, update `SMS_API_KEY` in Vercel, verify OTP delivery in Preview/Production, then revoke the old key at the provider.
5. **`CRON_SECRET`:** Update `CRON_SECRET` in Vercel and verify that the next 5-minute `GET /api/cron/expire-applications` invocation succeeds and updates `last_expiry_cron_at`.
6. **`S3_ACCESS_KEY` / `S3_SECRET_KEY` and `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`:** Rotate in the provider console and update Vercel environment variables together.

## Leak response runbook (`PRD 17.3`)

If any secret is committed to Git, printed in logs, or exposed externally:
1. **Rotate immediately** using the per-variable procedure above—do not wait to investigate before rotating.
2. **Record the incident** in `AuditLog` (`action = 'INCIDENT'`) per `non-functional.md`.
3. **Audit exposure window:** Inspect `AuditLog`, Vercel logs, and Sentry events across the exposure window for unauthorized access (`NIN_ACCESS`, `FINAL_APPROVAL`, `PASSWORD_RESET_LOCK`) and purge any log lines containing the leaked secret.
4. **Publish the post-incident summary within 72 hours** (`PRD 17.3`).

## Unresolved before build

Track in `working-agreements.md` and resolve on Day 0 (`build-plan.md`):

1. **`SENTRY_AUTH_TOKEN` for build-time sourcemap upload (`AGENTS.md` Q61):** Not listed in PRD 8.5. Decide on Day 0 whether to add `SENTRY_AUTH_TOKEN` as a CI/build-only variable or accept minified stack traces in Version 1.
2. **`DATABASE_URL` zero-downtime rotation mechanics (`AGENTS.md` Q62):** Confirm dual-role/password support once Neon vs Supabase is chosen on Day 0 (`build-plan.md` decision 4).
3. **`SMS_API_KEY` dual-key grace period (`AGENTS.md` Q63):** Confirm whether the chosen SMS provider (`build-plan.md` decision 2) supports two active API keys during rotation.
4. **Team password manager tool (`AGENTS.md` Q64):** Product Lead to confirm the exact vault tool used for offline secret backup.
5. **Confirm keeping `NIN_ENCRYPTION_KEY` and `PHONE_ENCRYPTION_KEY` separate (`AGENTS.md` Q65):** Pinned as separate per PRD 8.5.
