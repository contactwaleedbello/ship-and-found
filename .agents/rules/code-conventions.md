# code-conventions

Source: stack decisions in `stack.md` plus universal TypeScript and Next.js 14 App Router conventions

## Single job

This file is the code-level rulebook for language flags, naming, folder structure, import ordering, server/client component boundaries, service-layer separation, error handling, and forbidden code patterns. If a rule here conflicts with a domain rule file, the domain rule file wins on its subject (`api-design.md` on wire format, `accessibility-baseline.md` on a11y, `security-baseline.md` on security).

## TypeScript

- **Every application file is TypeScript (`.ts` or `.tsx`).** No `.js` or `.jsx` files in application code, because compile-time type checking is required to enforce schema and business-rule contracts (`stack.md`). Tooling config files (`next.config.mjs`, `postcss.config.js`, `tailwind.config.ts`) may use their tool's default format.
- **Strict mode is mandatory.** `tsconfig.json` must enable:
  - `"strict": true` — catches null/undefined and implicit `any` bugs at compile time.
  - `"noUncheckedIndexedAccess": true` — forces explicit undefined checks when indexing arrays or records so out-of-bounds reads cannot crash route handlers.
  - `"noImplicitOverride": true` — prevents accidental method shadowing in error subclasses.
  - `"noFallthroughCasesInSwitch": true` — prevents accidental switch fallthrough across application status enums.
  - `"noUnusedLocals": true` and `"noUnusedParameters": true` — keeps dead code out of the repository.
  - `"exactOptionalPropertyTypes": true` — prevents passing explicit `undefined` to optional Prisma fields where `undefined` vs `null` changes query behavior.
  - `"verbatimModuleSyntax": true` — enforces explicit `import type` so type-only imports are stripped cleanly at build time.
- **No `any`.** Use `unknown` and narrow with Zod or type guards, because `any` silently disables type checking for downstream callers.
- **No `as` type assertions** except immediately after a runtime narrowing check when TypeScript cannot infer the narrowed type. Never use `as unknown as T`, because double-casting hides incompatible shapes.
- **No `@ts-ignore` or `@ts-expect-error` in application code.** If a third-party type definition is inaccurate, write a small typed wrapper in `lib/` and document the upstream type issue in a comment on that wrapper.
- **No non-null assertion (`!`)** because runtime data can still be null/undefined; throw a typed `AppError` or narrow explicitly instead.
- **Use `import type { ... }` for type-only imports** so bundlers never emit runtime imports for types.

## File and folder naming

- **All file names and folder names use `kebab-case`** (for example `application-service.ts`, `verify-down-payment-form.tsx`), because macOS is case-insensitive by default while Linux (Vercel build container) is case-sensitive; `kebab-case` eliminates casing mismatch bugs between local dev and Vercel deploys.
- **Next.js App Router reserved filenames keep their exact names:** `page.tsx`, `layout.tsx`, `error.tsx`, `global-error.tsx`, `loading.tsx`, `not-found.tsx`, `route.ts`, `middleware.ts`.
- **Test files:** `<filename>.test.ts` or `<filename>.test.tsx` colocated next to the file under test so engineers and agents immediately see whether a module has unit tests.
- **No barrel `index.ts` files inside feature or component folders**, because barrel files cause circular dependency chains and defeat tree-shaking in Next.js server/client bundles.

## Folder structure

Under `app/` (Next.js 14 App Router):

- `app/(public)/` — unauthenticated screens (`Home / Inventory Listing`, `Device Detail`, `Login`, `Register`, `OTP Verification`, `Forgot Password`, `Confirm Current Price via WhatsApp`).
- `app/(customer)/` — Customer-authenticated screens (`Apply for Part-Payment`, `Application Status`, `My Applications`, `Contract Detail`, `Agreement Acceptance`, `Account Settings`).
- `app/(worker)/` — Store Worker screens (`Worker Dashboard`, `Verify Down Payment`, `Record Balance Payment`, `Record Settlement Payment`, `Reminder Checklist`, `Reserved Units`, `Inventory Update`).
- `app/(admin)/` — Owner and Co-owner screens (`Owner Dashboard`, `Review Application`, `Final Approval`, `Exchange Rate Settings`, `Defaulted Contracts`, `Deletion Requests`, `Inventory Approvals`, `Audit Log`, `Success Metrics`).
- `app/api/` — API route handlers matching `api-contracts.md` paths exactly.

Under repository root:

- `lib/` — cross-cutting modules and domain services:
  - `lib/env.ts` — Zod-validated environment variables (`env-and-secrets.md`).
  - `lib/db.ts` — PrismaClient singleton so Next.js hot reload does not exhaust database connections.
  - `lib/logger.ts` — structured JSON logger (`observability-baseline.md`).
  - `lib/errors.ts` — `AppError` class and error-to-response mapper (`api-design.md`).
  - `lib/constants.ts` — business rule thresholds and status enums from `business-rules.md` and `state-transitions.md`.
  - `lib/templates.ts` — exact SMS and WhatsApp templates from `message-templates.md`.
  - `lib/types.ts` — shared domain TypeScript interfaces and types.
  - `lib/crypto.ts` — AES-256-GCM field encryption/decryption and HMAC-SHA256 blind indexing (`security-baseline.md`).
  - `lib/auth/` — NextAuth configuration, session helpers, CSRF verification, and role-guard wrappers.
  - `lib/services/` — transactional business logic (`application-service.ts`, `approval-service.ts`, `payment-service.ts`, `cron-service.ts`, `deletion-service.ts`, `inventory-service.ts`, `audit-service.ts`).
- `components/` — shared accessible UI primitives (`button.tsx`, `input.tsx`, `banner.tsx`, `skeleton.tsx`). Screen-specific components live in `_components/` inside that screen's route folder.
- `prisma/` — `schema.prisma`, migrations, and `seed.ts` (`data-and-schema.md`).
- `tests/` — multi-module integration and concurrency tests (`PRD 13.1`).

Do not create top-level `utils/`, `helpers/`, or `common/` directories, because dumping-ground folders obscure module ownership; place focused modules in `lib/`.

## Import ordering

Separate imports into three groups, alphabetized within each group, with one blank line between groups so diffs stay clean and dependencies are scannable:

1. Node built-ins and external npm packages (`node:crypto`, `next/server`, `zod`).
2. Internal absolute imports via `@/` (`@/lib/db`, `@/lib/errors`).
3. Relative imports (`./_components/price-badge`).

Example:

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { AppError } from '@/lib/errors';
import { createApplication } from '@/lib/services/application-service';

import { mapApplicationResponse } from './mapper';
```

## Server vs Client Component rule

- **Server Components are the default** for all pages and layouts so minimal JavaScript is shipped to 3G mid-range Android devices (`non-functional.md` FCP < 1.8s target).
- **Add `'use client'` only at leaf interactive components** that require browser state or event handlers (forms with inline on-blur validation, the part-payment calculator slider/inputs, countdown timers, and the `wa.me` / clipboard action button).
- **Never mark a route `layout.tsx` or top-level `page.tsx` as `'use client'`** unless the entire screen is an interactive form, and even then prefer a Server Component `page.tsx` that fetches initial data and renders a Client Component form child.

## Module boundaries

- **UI components (`app/**`, `components/**`) never import `@/lib/db` or `@/lib/crypto` directly**, because database queries and encryption keys must remain strictly server-side behind services or route handlers.
- **API route handlers (`app/api/**/route.ts`) are thin controllers:** they verify authentication/role/CSRF, parse and validate the request with Zod, call a function in `lib/services/*`, and format the HTTP response per `api-design.md`. They do not contain raw `prisma.$transaction` blocks, because keeping transactions in `lib/services/*` makes business logic unit- and integration-testable without mocking HTTP objects.
- **All `AuditLog` writes go through `lib/services/audit-service.ts`** (which accepts an optional Prisma transaction client `tx`) so every audit entry shares a consistent schema and cannot be forgotten inside a transaction.

## Typed error handling

- Define a single `AppError` class in `lib/errors.ts` with `{ code: ErrorCode, statusCode: HttpStatusCode, message: string, details?: Record<string, string[]> }`.
- Services throw `AppError` for expected business or state rejections (for example `OUT_OF_STOCK`, `STALE_PRICE`, `SAME_USER_FORBIDDEN`, `OVERPAYMENT_BLOCKED`, `NOT_FOUND`).
- Route handlers wrap execution in a central `handleApiError(error, correlationId)` helper that:
  - Maps `ZodError` to `400 VALIDATION_ERROR` with field-level details.
  - Maps `AppError` to its declared `statusCode` and `code`.
  - Logs unexpected errors via `lib/logger.ts`, reports them to Sentry with PII scrubbed, and returns `500 INTERNAL_ERROR` with `"Something went wrong on our end. Try again."` (`ux-states.md`) so raw stack traces or Prisma errors never leak to the client (`security-baseline.md`).

## Naming rules and exports

- **Variables and functions:** `camelCase` (`calculateDynamicPrice`, `verifyDownPayment`). Boolean variables start with `is`, `has`, `can`, or `should` (`isPriceFresh`, `hasAcceptedAgreement`).
- **React components, classes, TypeScript types, and interfaces:** `PascalCase` (`DeviceCard`, `ApplicationStatus`). Do not prefix interfaces with `I` (`User`, not `IUser`).
- **Constants and enum-like values:** `SCREAMING_SNAKE_CASE` (`DOWN_PAYMENT_MIN_PERCENT = 70`, `BALANCE_WINDOW_DAYS = 30`).
- **Named exports only** across `lib/` and `components/` because named exports enforce consistent symbol names across the codebase and simplify refactoring. **Exception:** Next.js App Router requires `export default` for `page.tsx`, `layout.tsx`, `error.tsx`, `global-error.tsx`, `loading.tsx`, and `not-found.tsx`.

## Comment rules

- **Cite the PRD rule ID (`BR-01` through `BR-20`, `FR-01` through `FR-14`) in a comment above every business-rule check**, as required by `business-rules.md` ("Every validation must cite its BR number in a code comment").
- **Comments explain *why*, never *what*.** Do not write comments that restate the next line of code.
- **No commented-out code and no `TODO: Version 2` comments**, because `version-2-data.md` forbids Version 2 scaffolding or comment stubs in Version 1 code.

## 23 forbidden patterns

Every pattern below is banned in Version 1 for the reason stated:

1. `any` type — disables TypeScript safety.
2. `@ts-ignore` or `@ts-expect-error` — hides real type errors.
3. `as unknown as T` double-casting — bypasses structural type checking.
4. Non-null assertion `!` — causes uncaught `TypeError` at runtime.
5. `console.log`, `console.info`, `console.warn`, `console.error` outside `lib/logger.ts` — bypasses structured JSON logging and PII scrubbing (`observability-baseline.md`).
6. `process.env` access outside `lib/env.ts` — bypasses startup Zod validation (`env-and-secrets.md`).
7. `dangerouslySetInnerHTML` — creates XSS risk (`security-baseline.md`).
8. ` prisma.$queryRaw` or `prisma.$executeRaw` (except `SELECT 1` in `/api/health` if needed, or use `prisma.$queryRaw\`SELECT 1\`` with zero parameters) — prevents SQL injection (`security-baseline.md`).
9. `Math.random()` for OTPs, tokens, or IDs — not cryptographically secure; use `node:crypto` (`randomInt`, `randomBytes`, `randomUUID`).
10. Floating-point math for money (`number` decimals for Naira) — causes IEEE-754 rounding bugs; store and compute Naira in whole integer Naira (`Int` / `BigInt`) and validate integer bounds (`data-and-schema.md`).
11. Storing local time (WAT) in database timestamp columns — store UTC only and convert to WAT (`UTC+1`) at display/boundary calculation (`cron.md`).
12. `div` or `span` with `onClick` — breaks keyboard accessibility; use `<button>` or `<a>` (`accessibility-baseline.md`).
13. Positive `tabIndex` (`tabIndex={1}`) — breaks natural DOM focus order (`accessibility-baseline.md`).
14. CSS `outline: none` without a custom 3:1 focus ring replacement — removes keyboard focus visibility (`accessibility-baseline.md`).
15. Importing `@/lib/db` inside a Client Component or UI component — leaks server-only database logic across module boundaries.
16. Multi-table database writes outside `prisma.$transaction` — risks partial writes on failure (`data-and-schema.md`).
17. Returning `403 Forbidden` instead of `404 Not Found` when a Customer accesses another Customer's resource — leaks resource existence via IDOR enumeration (`api-design.md`, `permission-matrix.md`).
18. Sending unmasked NIN in any Store Worker API response — violates NDPA access control (`ndpa-compliance.md`).
19. Updating or deleting rows in `AuditLog` — violates immutable audit trail (`BR-12`, `ndpa-compliance.md`).
20. Hardcoding message or UI state strings inline in components instead of importing from `lib/templates.ts` or `ux-states.md` constants — causes copy drift from PRD Appendices A and B.
21. Installing or importing any package on the banned list in `stack.md` — violates stack lock.
22. Building receipt upload UI, endpoints, or S3 calls in Version 1 — explicitly excluded by PRD Section 6 (`out-of-scope.md`).
23. Adding `if (version === 2)` branches, feature flags, or Version 2 placeholder columns — forbidden by `version-2-data.md`.

## Testing placement

- **Unit tests:** colocated as `<filename>.test.ts` next to the service, validator, or component under test, because colocation keeps unit tests tied to module changes.
- **Integration and concurrency tests:** placed in `tests/integration/` and `tests/concurrency/` against a dedicated test PostgreSQL database (`PRD 13.1`), because they exercise cross-route and multi-transaction behavior.

## Unresolved before build

Track in `working-agreements.md` and resolve on Day 0 (`build-plan.md`):

1. **Exact ESLint and Prettier rule configuration** (`.eslintrc.json` and `.prettierrc` options; `AGENTS.md` open question 66).
2. **Test database provisioning strategy for CI and local integration tests** (`build-plan.md` Day 0 decision 1; `AGENTS.md` open question 67).
3. **Confirm `verbatimModuleSyntax` compatibility** with the exact TypeScript 5.x version and Next.js 14 tsconfig preset at Day 0 (`AGENTS.md` open question 68).
