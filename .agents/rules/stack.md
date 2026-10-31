# stack

Source: PRD Section 8.1 plus universal version-pinning discipline

## Single job

This file is the package and runtime lock for Version 1. It lists every permitted npm package by layer, the runtime and package manager constraints, banned package categories, and the version policy. External service network rules live in `third-party.md`. If a package is not in this file, do not install it; stop and ask (`working-agreements.md`).

## Runtime and package manager

- **Node.js 20 LTS**, enforced via `.nvmrc` (`20`) and `engines.node` in `package.json` (`">=20.0.0 <21.0.0"`), because Vercel's production Node.js runtime targets Node 20 LTS and matching local/CI prevents native-module or `crypto` API mismatches.
- **Package manager: `npm` only** with committed `package-lock.json`. Do not use `yarn`, `pnpm`, or `bun`, because mixing package managers generates competing lockfiles and non-deterministic dependency trees in Vercel builds.
- **TypeScript 5.x**, locked in `package-lock.json`, because compile-time type safety is required across Prisma, Zod, and Next.js App Router (`code-conventions.md`).

## Frontend packages

| Package | Purpose | Version policy | Why this package and version |
|---|---|---|---|
| `next` | Full-stack React framework (App Router only) | PRD pinned: `14.x` (latest stable 14.x at Day 0) | Server Components reduce JS bundle size on 3G Android devices (`PRD 8.1`, `9.1`) |
| `react` | UI library | Matches `next@14` peer dependency (`18.x`) | Required by Next.js 14 |
| `react-dom` | DOM renderer | Matches `next@14` peer dependency (`18.x`) | Required by Next.js 14 |
| `tailwindcss` | Utility CSS framework | Pinned to `3.x` (not v4) | Enforces minimal UX and battery-equals-price styling without v4 App Router build instability |
| `postcss` | CSS build pipeline | Matches Tailwind v3 peer requirement | Required by Tailwind v3 |
| `autoprefixer` | CSS vendor prefixing | Matches PostCSS requirement | Ensures Safari iOS and Android Chrome compatibility (`PRD 9.5`) |
| `clsx` | Conditional className composition | Latest stable at Day 0 | Lightweight class joining; add `tailwind-merge` only if copied `shadcn/ui` primitives require it |
| `lucide-react` | Icon set (Day 0 pick 69) | Latest stable at Day 0 (confirm on Day 0) | Tree-shakeable SVG icons paired with visible text labels (`accessibility-baseline.md`) |

## Backend, auth, and validation packages

| Package | Purpose | Version policy | Why this package and version |
|---|---|---|---|
| `prisma` | Schema migration CLI and generator | Latest stable `5.x` at Day 0 | Generates type-safe client on `postinstall` and runs additive migrations (`PRD 8.1`) |
| `@prisma/client` | Database runtime client | Matches `prisma` version exactly | Provides ACID `$transaction` support (`data-and-schema.md`) |
| `next-auth` | Session authentication (Credentials provider) | Pinned to `4.x` (not Auth.js v5 beta) | Stable Credentials + database session support on Next.js 14 App Router |
| `@auth/prisma-adapter` | Database session storage for NextAuth | Matches `next-auth@4` compatibility | Stores sessions in Postgres so password reset can revoke all active sessions (`PRD 7.11`, `9.3`) |
| `bcryptjs` | Password hashing (Day 0 pick 73) | Latest stable at Day 0 | Pure JS bcrypt (cost factor 12) avoids native C++ binary compilation failures on Vercel serverless |
| `zod` | Runtime input and env validation | Latest stable `3.x` at Day 0 | Enforces strict server-side schema validation on every API route and env var (`api-design.md`, `env-and-secrets.md`) |
| `date-fns` | Date math and WAT (`UTC+1`) formatting | Latest stable `3.x` at Day 0 | Immutable, tree-shakeable functions for 24h expiry and 30-day (`19:59 WAT`) countdown calculations |

## Observability, messaging, and infrastructure

| Component | Package / Mechanism | Version policy | Why |
|---|---|---|---|
| Error tracking | `@sentry/nextjs` | Latest stable at Day 0 | Captures server and browser 5xx exceptions with `beforeSend` PII scrubbing (`monitoring.md`) |
| Structured logger | Built-in `lib/logger.ts` (no npm package) | N/A | Zero-dependency JSON stdout logger (`observability-baseline.md`) |
| SMS OTP delivery | Native `fetch` or single SDK for Termii / Africa's Talking (Day 0 pick 2) | Day 0 decision 2 in `build-plan.md` | Calls the chosen Nigerian SMS gateway (`third-party.md`) |
| File storage | None installed in Version 1 (Day 0 pick 3 reserved for Version 2) | Do not install `@aws-sdk/*` or `@supabase/storage-js` in Version 1 | Receipt upload is excluded from Version 1 (`out-of-scope.md`) |
| Scheduled jobs | Vercel Cron (`vercel.json`) | Platform feature, no npm package | Triggers the 4 `GET /api/cron/*` routes (`cron.md`) |
| Database | PostgreSQL 15+ on Neon or Supabase (Day 0 pick 4) | PRD pinned: PostgreSQL 15, 16, or 17 | Supports ACID transactions and PITR backups (`PRD 8.1`, `17.1`) |

## Development, linting, and testing packages

| Package | Purpose | Version policy | Why |
|---|---|---|---|
| `typescript` | Compiler and type checker | Latest stable `5.x` at Day 0 | Enforces strict flags in `code-conventions.md` |
| `@types/node`, `@types/react`, `@types/react-dom`, `@types/bcryptjs` | TypeScript definitions | Match runtime versions | Required for strict compilation |
| `eslint`, `eslint-config-next` | Static analysis | Match `next@14` | Catches React, hook, and accessibility regressions |
| `prettier` | Code formatting | Latest stable at Day 0 | Prevents formatting churn across PRs |
| Testing runner (`vitest` or `jest`) | Unit, integration, and concurrency tests | Day 0 decision 1 in `build-plan.md` | Runs automated test suite (`PRD 13.1`); install only the chosen one |
| `axe-core` (or `vitest-axe` / `@axe-core/playwright`) | Automated WCAG 2.1 AA checks | Matches Day 0 test runner | Enforces zero critical accessibility issues in CI (`accessibility-baseline.md`) |

## Banned packages and categories

Do not install any package in the categories below. External service exclusions are governed by `third-party.md`; the packages below are banned because Version 1 either excludes the feature (`out-of-scope.md`) or provides the capability via Node/Next.js built-ins:

1. **External service SDKs for excluded features** (payment gateways like `stripe`/`@paystack/*`/`flutterwave-*`, WhatsApp APIs like `twilio`/`whatsapp-web.js`, email SDKs like `resend`/`nodemailer`, push SDKs like `firebase-admin`/`web-push`, analytics SDKs like `@vercel/analytics`/`posthog-js`, chat SDKs, NIN/credit/MDM SDKs, or S3/Supabase storage SDKs) — banned by `out-of-scope.md` and `third-party.md`.
2. **Logging libraries (`pino`, `winston`, `bunyan`, `log4js`)** — use `lib/logger.ts` (`observability-baseline.md`) to avoid worker-thread bundler bugs in Next.js.
3. **HTTP client wrappers (`axios`, `got`, `node-fetch`, `superagent`)** — Node 20 has native `fetch` built in.
4. **Client state libraries (`redux`, `@reduxjs/toolkit`, `zustand`, `jotai`, `recoil`)** — Server Components and local React state suffice for Version 1's single-purpose screens.
5. **Heavy UI component frameworks installed as runtime dependencies (`@mui/*`, `@chakra-ui/*`, `antd`)** — bloat client bundles past the 1.8s 3G FCP target (`non-functional.md`). If `shadcn/ui` is confirmed on Day 0, copy only the needed primitives into `components/`.
6. **Form state libraries (`react-hook-form`, `formik`, `@tanstack/react-form`)** — native controlled/form state plus shared Zod schemas keep validation logic unified between client and server.
7. **Alternative CSS engines (`styled-components`, `@emotion/*`, `sass`, `less`)** — Tailwind v3 is the single styling system.
8. **Alternative date libraries (`moment`, `dayjs`, `luxon`)** — `date-fns` is the single date library.
9. **UUID generators (`uuid`, `nanoid`)** — Node 20 provides `crypto.randomUUID()`.
10. **Env loaders (`dotenv`, `dotenv-cli`)** — Next.js loads `.env.local` natively.
11. **In-process cron schedulers (`node-cron`, `bullmq`, `agenda`)** — serverless functions freeze between requests; Vercel Cron (`cron.md`) is the only scheduler.
12. **Alternative ORMs (`drizzle-orm`, `typeorm`, `sequelize`, `knex`)** — Prisma is the single ORM (`PRD 8.1`).

## Version policy and rationale for pinned choices

- **PRD-pinned versions (`Next.js 14`, `PostgreSQL 15+`)** cannot change without a PRD amendment.
- **Lockfile discipline:** Every dependency is pinned via `package-lock.json` on Day 0. Do not upgrade any package during the Day 1–Day 5 build unless required to patch a critical `npm audit` vulnerability (`security-baseline.md`), and document the reason in the PR description.
- **Why NextAuth v4 (`next-auth@^4`) instead of Auth.js v5:** Auth.js v5 is in beta and has breaking adapter and configuration changes; NextAuth v4 is stable with Next.js 14 App Router and `@auth/prisma-adapter`.
- **Why Tailwind v3 (`tailwindcss@^3`) instead of v4:** Tailwind v4 alters PostCSS configuration and drops `tailwind.config.ts` conventions used by Next.js 14; v3 is stable for a 1-week build.

## Unresolved before build (10 Day 0 stack items)

Track in `working-agreements.md` and resolve on Day 0 (`build-plan.md`) before installing packages:

1. **Testing framework (`build-plan.md` decision 1 / `AGENTS.md` Q1, Q74):** Vitest or Jest.
2. **SMS provider (`build-plan.md` decision 2 / `AGENTS.md` Q2):** Termii or Africa's Talking (and whether to use native `fetch` against their REST API or an SDK).
3. **File storage provider (`build-plan.md` decision 3 / `AGENTS.md` Q3):** Supabase Storage or AWS S3 (decision recorded for Version 2 only; no SDK installed in Version 1).
4. **Database hosting provider (`build-plan.md` decision 4 / `AGENTS.md` Q4):** Neon or Supabase managed PostgreSQL.
5. **ESLint and Prettier configuration (`AGENTS.md` Q66):** Exact `.eslintrc.json` and `.prettierrc` rules.
6. **Icon library (`AGENTS.md` Q69):** Confirm `lucide-react` (or zero-icon text-only UI).
7. **Component primitives (`AGENTS.md` Q70):** Confirm copied-in `shadcn/ui` primitives vs hand-authored Tailwind primitives in `components/`.
8. **Form library (`AGENTS.md` Q71):** Confirm native React forms + Zod (no form library).
9. **PostgreSQL major version (`AGENTS.md` Q72):** Confirm PG 15, 16, or 17 on the chosen managed host.
10. **Password hashing package (`AGENTS.md` Q73):** Confirm `bcryptjs` (pure JS for Vercel compatibility) vs native `bcrypt`.
