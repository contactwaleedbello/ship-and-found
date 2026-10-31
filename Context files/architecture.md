# architecture

Source: PRD Section 8.2, plus the boundaries defined in .agents/rules/data-and-schema.md, code-conventions.md, api-design.md, security-baseline.md, observability-baseline.md, third-party.md, and cron.md.

## What this file is

This is the whole-system view. It names the layers, the order of operations per request, and which rule file enforces each boundary. It does not define rules. Rules live in `.agents/rules/`.

## What this file is not

- Not the schema. Schema is `prisma/schema.prisma` and `.agents/rules/data-and-schema.md`.
- Not the module boundaries. Those are in `.agents/rules/code-conventions.md`.
- Not the wire shape. That is in `.agents/rules/api-design.md`.
- Not the list of external services. That is in `.agents/rules/third-party.md`.
- Not the transaction boundaries. Those are in `.agents/rules/data-and-schema.md`.
- Not the security rules. Those are in `.agents/rules/security-baseline.md`.

If this file disagrees with any of the above, the rule file wins. This file is navigation.

## Three layers

1. **Presentation layer.** Browser. React server and client components per `.agents/rules/code-conventions.md` server and client component rules. Tailwind CSS. Lives under `app/` per the folder structure section of `.agents/rules/code-conventions.md`.
2. **Application layer.** Next.js API route handlers. Middleware. Service functions in `lib/services/`. Zod schemas. Route handlers in `app/api/` per `.agents/rules/api-contracts.md`. Business logic in `lib/services/` per the module boundaries section of `.agents/rules/code-conventions.md`.
3. **Data layer.** PostgreSQL 15 or later per `.agents/rules/stack.md`. Prisma client singleton in `lib/db.ts`. Schema in `prisma/schema.prisma`. Migrations per `.agents/rules/data-and-schema.md`.

## Request lifecycle

Order of operations for one HTTP request. This sequence is not defined in any single rule file. It is defined here.

1. Browser sends an HTTP request.
2. Middleware runs first. It applies session check, role check, rate limit, CSRF, security headers, and correlation ID. Mechanisms in `.agents/rules/security-baseline.md` and `.agents/rules/api-design.md`.
3. Route handler runs second. It validates input with Zod per `.agents/rules/api-design.md`. It calls a service function. It does not call Prisma directly.
4. Service function runs third. It holds business logic per `.agents/rules/business-rules.md` and `.agents/rules/state-transitions.md`. It wraps multi-table writes in one Prisma transaction per the transaction boundaries table in `.agents/rules/data-and-schema.md`. It writes the AuditLog row inside the transaction per `.agents/rules/ndpa-compliance.md`.
5. Prisma writes to PostgreSQL. Referential integrity per `.agents/rules/data-and-schema.md`.
6. Response returns through the route handler. Shape and status code per `.agents/rules/api-design.md`. `x-request-id` header on the way out per `.agents/rules/observability-baseline.md`.
7. Every outbound call to an external service is logged per `.agents/rules/observability-baseline.md`. Only services in `.agents/rules/third-party.md` are called.

## External systems

Approved services are in `.agents/rules/third-party.md`. Every call is server-side except `wa.me` deep links on the Worker Dashboard, which are client-side URL scheme opens and not HTTP calls. The full data flow restriction per service is in `.agents/rules/third-party.md`.

## Background jobs

Two crons and two heartbeat checks per `.agents/rules/cron.md`. All four endpoints are GET. Called by Vercel Cron. Protected by `CRON_SECRET` header. No session auth. Schedules and idempotency rules in `.agents/rules/cron.md`.

## What each layer must never do

- Presentation layer never calls Prisma directly.
- Presentation layer never calls an external service directly. Exception: `wa.me` deep links on the Worker Dashboard per `.agents/rules/third-party.md`.
- Route handler never contains business logic. Business logic is in services per `.agents/rules/code-conventions.md` module boundaries.
- Route handler never calls Prisma directly. Only services call Prisma per `.agents/rules/code-conventions.md` module boundaries.
- Service never returns a raw Prisma object. Map to a DTO at the service boundary per `.agents/rules/api-design.md`.
- Service never reads request context. It receives typed arguments.
- Middleware never contains business logic. It handles only session, role, rate limit, CSRF, security headers, and correlation ID.
- No layer logs outside `lib/logger.ts` per `.agents/rules/observability-baseline.md`.

## Where each boundary is enforced

| Boundary | Rule file |
|---|---|
| Session and role | `.agents/rules/security-baseline.md` and `.agents/rules/permission-matrix.md` |
| CSRF | `.agents/rules/security-baseline.md` |
| Rate limits | `.agents/rules/api-design.md` |
| Request and response shape | `.agents/rules/api-design.md` |
| Zod validation | `.agents/rules/code-conventions.md` |
| Module boundaries | `.agents/rules/code-conventions.md` |
| Transaction boundaries | `.agents/rules/data-and-schema.md` |
| Referential integrity | `.agents/rules/data-and-schema.md` |
| Field treatment (encrypt, mask) | `.agents/rules/data-and-schema.md` and `.agents/rules/security-baseline.md` |
| Audit log | `.agents/rules/ndpa-compliance.md` and `.agents/rules/observability-baseline.md` |
| Log format | `.agents/rules/observability-baseline.md` |
| External services | `.agents/rules/third-party.md` |
| Package list | `.agents/rules/stack.md` |
| Cron schedule | `.agents/rules/cron.md` |

## How to use this file

Read this file once at the start of any feature. Then read the specific rule file for the specific boundary you are working on. Do not use this file as a substitute for the rule files.