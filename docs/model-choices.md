# Technical and Model Choices (`docs/model-choices.md`)

Source: Consolidated PRD v1.3 Sections 5.1, 8.1–8.5, 9.1–9.6; [`.agents/rules/stack.md`](../.agents/rules/stack.md); [`.agents/rules/build-plan.md`](../.agents/rules/build-plan.md); [`.agents/rules/data-and-schema.md`](../.agents/rules/data-and-schema.md).

## 1. Confirmed PRD-Pinned Decisions vs. Approved Day 0 Selections

Every technical choice in this repository is classified below as either **PRD-Pinned (Mandatory)** or **Day 0 Selection (Confirmed for Scaffold)**, together with the alternatives considered and the engineering rationale.

| Layer / Domain | Selected Choice | Status | Alternatives Considered | Why Selected |
|---|---|---|---|---|
| **Runtime** | **Node.js 20 LTS** (`>=20.0.0 <21.0.0`) | Confirmed (`stack.md`) | Node 18 LTS, Node 22, Bun | Matches Vercel's production serverless runtime; provides built-in `fetch` and Web/Node `crypto` (`AES-256-GCM`, `randomUUID`) without polyfills. |
| **Package Manager** | **npm** (`package-lock.json`) | Confirmed (`stack.md`) | `pnpm`, `yarn`, `bun` | Prevents competing lockfiles and ensures deterministic dependency resolution in CI and Vercel builds. |
| **Full-Stack Framework** | **Next.js 14.2.x (App Router)** | PRD-Pinned (`PRD 8.1`) | Next.js Pages Router, Remix, separate Express + Vite SPA | Unifies UI and API route handlers (`app/api/*`) in a single TypeScript repository; React Server Components minimize client-side JS shipped to 3G Android devices (`PRD 9.1` FCP `< 1.8s`). |
| **Language & Compiler** | **TypeScript 5.x** (`strict` + 6 additional safety flags) | PRD-Pinned (`PRD 8.1`, `code-conventions.md`) | Loose TypeScript, JavaScript | Enforces compile-time safety across Prisma models, Zod validation schemas, and status state machines (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`). |
| **Styling & Tokens** | **Tailwind CSS v3.4.x** mapped strictly to Task 1 CSS custom properties (`styles/tokens/*`) | Confirmed (`stack.md` Q77) | Tailwind CSS v4, CSS-in-JS (`styled-components`, `@emotion`), Material UI / Chakra UI | Tailwind v3 has battle-tested Next.js 14 PostCSS integration and zero runtime JS overhead; mapping utility classes strictly to `--color-*`, `--spacing-*`, `--radius-*`, and `--shadow-*` variables enforces Task 1 token fidelity (`docs/design-system.md`). |
| **Typography** | **Self-hosted `Fira Sans` (400/500/600/700) & `Noto Sans` (400)** (`.woff2`) | Confirmed (Task 1 `styles/fonts.css`) | Google Fonts CDN, system-only fonts | Eliminates external font network requests on 3G connections and guarantees verified glyph coverage for Naira (`₦`, `U+20A6`), Hausa, and Yoruba characters. |
| **Database & ORM** | **PostgreSQL 16 + Prisma 5.x** | PRD-Pinned (`PRD 8.1`, `build-plan.md` #4) | Drizzle ORM, TypeORM, Knex, MongoDB | Interactive `prisma.$transaction` enforces ACID guarantees for stock reservations, the 3-condition Final Approval check (`BR-13`), and immutable `AuditLog` writes (`data-and-schema.md`). |
| **Authentication** | **NextAuth.js v4 (`next-auth@^4.24`) + `@auth/prisma-adapter`** | Confirmed (`stack.md` Q76) | Auth.js v5 beta, Clerk, Auth0, custom JWT cookies | NextAuth v4 is stable on Next.js 14 App Router; database-backed sessions allow immediate server-side session revocation upon password reset (`PRD 7.11`, `9.3`). |
| **Password Hashing** | **`bcryptjs` (cost factor 12)** | Confirmed (`stack.md` Q73, `security-baseline.md`) | Native C++ `bcrypt`, `argon2` | Pure JavaScript implementation avoids native node-gyp binary mismatches between macOS local development and Linux serverless containers while enforcing cost factor 12 (`PRD 9.3`). |
| **Validation** | **Zod 3.x** | Confirmed (`stack.md`, `api-design.md`) | Yup, Joi, Valibot, manual checks | Shared runtime validation for API request bodies, query params, and `lib/env.ts` environment variables with automatic TypeScript type inference. |
| **Date & Time Math** | **`date-fns` 3.x** | Confirmed (`stack.md` Q78) | `moment`, `dayjs`, `luxon` | Immutable, tree-shakeable functions for computing the 24-hour application expiry window and the 30-day (`19:59 WAT` / `18:59 UTC`) contract due date (`cron.md`). |
| **Icons** | **`lucide-react`** | Confirmed (`stack.md` Q69) | Heroicons, FontAwesome, raw inline SVGs | Tree-shakeable accessible SVG icons always paired with visible text labels (`accessibility-baseline.md`). |
| **Observability & Error Tracking** | **Custom `lib/logger.ts` (JSON stdout) + `@sentry/nextjs`** | Confirmed (`stack.md` Q75, `observability-baseline.md`) | `pino`, `winston`, Datadog SDK | Zero-dependency JSON stdout logger avoids Next.js worker-thread bundling bugs while enforcing the mandatory 8-field log schema and PII redaction (`observability-baseline.md`). |
| **Testing Framework** | **Vitest 2.x** | Confirmed (`build-plan.md` #1, `stack.md` Q74) | Jest | Fast native ESM and TypeScript execution without Babel transforms for unit, integration, and concurrency tests (`PRD 13.1`). |
| **SMS Provider (OTP)** | **Termii REST API via native `fetch`** | Confirmed Fallback (`build-plan.md` #2) | Africa's Talking SDK, Twilio | Native `fetch` against Termii's Nigerian DND transactional route avoids third-party SDK bloat (`third-party.md`). |

---

## 2. Data Model & Schema Representation Choices (`data-and-schema.md`)

Per [`.agents/rules/data-and-schema.md`](../.agents/rules/data-and-schema.md) and your Phase 1 approval:

1. **Monetary values (`Int` whole Naira):** All Naira amounts (`base_price`, `dynamic_price`, `locked_price`, `down_payment_amount`, `remaining_amount`, `amount`) are stored and computed as integer whole Naira (`₦`) to prevent IEEE-754 floating-point rounding defects (`code-conventions.md`).
2. **Fractional multipliers and percentages (`Decimal(10, 4)`):** `exchange_rate_multiplier` and `down_payment_percent` use fixed-precision decimals so boundary checks (`69.9%` vs `70.0%` and `80.0%` vs `80.1%` per `BR-02` and `PRD 13.1`) are exact.
3. **Encrypted PII with HMAC-SHA256 blind indexes (`security-baseline.md`):** `CustomerProfile.nin` and `CustomerProfile.phone_number` use AES-256-GCM encryption at rest with random 96-bit IVs (`v1:<iv>:<authTag>:<ciphertext>`), paired with deterministic HMAC-SHA256 blind-index columns (`nin_hash`, `phone_hash`) to support `BR-09` default purchase-block lookups without exposing plaintext in SQL.
4. **Dual Cron Heartbeat Tracking (`cron.md`):** `Settings` tracks `last_expiry_cron_at` and `last_default_cron_at` separately so the 5-minute expiry cron never masks a missed 20:00 WAT default cron (`build-plan.md` decision #20).
5. **Referential Integrity & Audit Immutability:** Every foreign key uses `ON DELETE RESTRICT`, no business rows are ever deleted (`NDPA` erasure uses `UPDATE` anonymization), and `AuditLog` is insert-only (`ndpa-compliance.md`).

---

## 3. Unresolved Items Tracked for Production Cutover

While defaults are locked for the proof-of-concept scaffold, the following operational parameters require Shop ATF 03 Owner sign-off before live production traffic (tracked in [`AGENTS.md`](../AGENTS.md) and [`.agents/rules/build-plan.md`](../.agents/rules/build-plan.md)):
- Production Shop ATF 03 WhatsApp recipient phone number and `[Store Contact]` string for WhatsApp templates (`message-templates.md`).
- Live Termii sender ID and production `SMS_API_KEY` (`env-and-secrets.md`).
- Legal sign-off on exact post-contract statutory retention duration (defaulted to active/defaulted contract duration + statutory financial audit window per `ndpa-compliance.md`).

