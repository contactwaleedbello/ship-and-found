# AGENTS.md

## Paths

- Project root: `/Users/macbookpro/Desktop/Dev & Design To/Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY`
- Rules directory: `/Users/macbookpro/Desktop/Dev & Design To/Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY/.agents/rules`
- PRD: `/Users/macbookpro/Desktop/Dev & Design To/Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY/Context files/DG Tech Store PRD.md`
- Schema: `/Users/macbookpro/Desktop/Dev & Design To/Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY/prisma/schema.prisma`
- Skills directory: `/Users/macbookpro/Desktop/Dev & Design To/Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY/.agents/skills`
- Docs directory: `/Users/macbookpro/Desktop/Dev & Design To/Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY/docs`

All rule file references below are written as `.agents/rules/<filename>`. The PRD is the source of truth for behavior. Read the PRD first when a rule file cites a PRD section.

## Description

DG Tech Store is a web platform for one physical store, Shop ATF 03. It displays real-time device availability, specifications, and dynamic prices. It enables customers to apply for a part-payment plan subject to Owner approval and a strict balance completion window.

## Who uses it

**Visitor:** Unauthenticated. Browses inventory. Filters by brand, category, performance tier, battery life. Views device specs. Uses part-payment calculator. Cannot apply.

**Customer:** Registers with phone, password, OTP. Submits NIN per the format rule in `.agents/rules/business-rules.md`. Applies for part-payment with personal details, NIN, guarantor name, guarantor phone, and down payment within the threshold in `.agents/rules/business-rules.md`. Accepts agreement with OTP. Views own application, contract, and payment history. Submits deletion requests per `.agents/rules/ndpa-compliance.md`.

**Store Worker:** Updates inventory for Owner approval. Verifies cash or bank transfer down payments with exact transaction log per `.agents/rules/functional-requirements.md`. Records balance and settlement payments. Sends manual WhatsApp messages from dashboard, each logged per `.agents/rules/notification-matrix.md`.

**Owner:** Final approval authority. Reviews applications. Grants final approval. Adjusts exchange rate multipliers per `.agents/rules/business-rules.md`. Approves inventory changes. Resolves defaulted contracts per `.agents/rules/state-transitions.md`. Reviews deletion requests. Holds pseudonymous ID mapping per `.agents/rules/ndpa-compliance.md`.

**Co-owner:** Same permissions as Owner. Cannot be the same user as the verifier on the same application per `.agents/rules/business-rules.md`.

## One thing the agent must do well

At final approval, inside one transaction, validate all three: Store Worker verification exists with IP, OTP-verified customer agreement acceptance exists, and Owner or Co-owner final approver is not the same user as the verifier. These are three separate committed events recorded earlier. Do not activate a contract if any of the three is missing. Details in `.agents/rules/state-transitions.md` and `.agents/rules/business-rules.md`. If the same IP recorded both verification and final approval for one application, trigger the Owner in-app alert per `.agents/rules/business-rules.md`.

## Defined Scope for the MVP

**Public:** inventory listing with filters, device detail with specs and calculator, login, register, OTP verify, forgot password, Confirm Current Price via WhatsApp action when out of stock or stale price.

**Customer:** part-payment application with inline validation against the threshold and NIN format in `.agents/rules/business-rules.md`, application status with pending countdown from `.agents/rules/cron.md`, agreement acceptance with OTP, contract detail with remaining balance and countdown per `.agents/rules/state-transitions.md`, partial payments allowed with window not extended per `.agents/rules/business-rules.md`, overpayment blocked per `.agents/rules/business-rules.md`, account settings with deletion request.

**Store Worker:** dashboard with queues for payments to verify, reminder checklist, and reserved units. Down payment verification. Balance and settlement payment recording. Inventory update submitted for Owner approval. Queue behavior in `.agents/rules/workflows.md`.

**Owner and Co-owner:** review, reject, approve for verification, final approve. Exchange rate adjustment. Default resolution. Deletion review. Inventory approval. Audit log view. Success metrics view per `.agents/rules/success-metrics.md`.

**Background:** pending application expiry cron, default cron, cron heartbeat check. Schedules, timezone, and expiry computation in `.agents/rules/cron.md`.

**Statuses:** transition rules in `.agents/rules/state-transitions.md`. Each transition has side effects that run in the same transaction as the status write per `.agents/rules/state-transitions.md`.

**Success metrics:** per `.agents/rules/success-metrics.md`.

## Not in scope items for the MVP

Source: `.agents/rules/out-of-scope.md`. If a rule file or a frame asks for any of these, do not build it. Log in `.agents/rules/working-agreements.md` under open questions.

Automated flows: payment gateway webhooks, remote device locking, credit checks, credit scoring, third-party bank debt recovery, peer-to-peer chat bots, WhatsApp API, NDPA anonymization workflow.

Blocked features: complex multi-currency wallets, multi-currency pricing, external NIN verification, guarantor verification (collection only), inbound WhatsApp chatbot, customer self-service balance payment through gateway, multi-store support, receipt upload, PDF export beyond browser print, analytics dashboards beyond success metrics.

Blocked notifications: push notifications, SMS beyond OTP, email notifications.

Blocked commercial terms: late penalties, interest, fees.

Blocked engagement: customer-facing chat support.

## Stack

Pinned versions and picks in `.agents/rules/stack.md`. Rationale in `.agents/rules/data-and-schema.md` and `.agents/rules/api-design.md`. Frontend and backend share one codebase. Where the PRD lists two options, `.agents/rules/build-plan.md` records the Day 0 pick.

**Frontend:** Next.js 14 App Router with server and client components. TypeScript for all application code. Config files may use the tooling default language. Tailwind CSS. Battery life and price share font size, weight, and card weight per `.agents/rules/functional-requirements.md`.

**Backend:** Next.js API routes on Node.js. No separate backend service. PostgreSQL 15 or later. Prisma ORM. All multi-table writes run inside one Prisma transaction per `.agents/rules/data-and-schema.md`.

**Authentication:** NextAuth.js Credentials provider. Phone number plus password plus OTP. OTP at registration, forgot-password reset, and agreement acceptance. No OTP at application submission. No OTP at login. Rule in `.agents/rules/business-rules.md`.

**External services:** SMS provider: Termii or Africa's Talking, Day 0 pick in `.agents/rules/build-plan.md`. File storage: Supabase Storage or AWS S3, Version 1 does not upload receipts. WhatsApp: attempt wa.me deep link first, if wa.me fails or WhatsApp is unavailable, copy the template to clipboard, Worker marks sent in both cases per `.agents/rules/notification-matrix.md`. Hosting: Vercel. Database hosting: Neon or Supabase managed Postgres. Background jobs: Vercel Cron, schedules in `.agents/rules/cron.md`. Error tracking: Sentry. Logging: Postgres audit log table plus Vercel logs per `.agents/rules/observability-baseline.md`.

**Not used:** payment gateway, NIN registry, credit bureau, email provider, analytics SDK.

## Folder map

API routes follow PRD Section 8.3. Details in `.agents/rules/api-contracts.md`.

UI pages follow PRD Section 3.2 Screen Inventory. Use Next.js App Router page conventions under `app/`. One page per screen in Section 3.2. Details in `.agents/rules/screen-inventory.md`.

Route groups:
- `app/api/auth/` for register, verify-otp, login, logout, forgot-password, reset-password, accept-agreement-otp
- `app/api/devices/` for listing and detail
- `app/api/calculator/`
- `app/api/applications/` for submission, listing, accept-agreement
- `app/api/admin/` for review, approval, exchange rate, defaults, deletion, inventory approvals, audit, metrics
- `app/api/worker/` for payments to verify, down payment, balance payment, settlement payment, reminders, inventory update, otp-resend
- `app/api/customer/` for deletion-request
- `app/api/cron/` for expire-applications, default-contracts, check-expiry-heartbeat, and check-default-heartbeat
- `app/api/health/` for health check

Skills live in `.agents/skills/<skill-name>/SKILL.md`. Read the matching skill file before starting any of these tasks. The skill is a procedure, not a rule. It references the rule files and does not restate them.

## Rule files and what they hold

Create each rule file on Day 0 per `.agents/rules/build-plan.md`. Each file opens with its referenced PRD section. If a rule file is missing when implementing a feature, stop and ask.

| Rule file | Holds | PRD section |
|---|---|---|
| .agents/rules/working-agreements.md | Collaboration rules, stop-and-ask, open question log, product glossary | N/A |
| .agents/rules/stack.md | Universal package list per layer, Node 20 LTS, npm, PRD-pinned versions, 10 Day 0 picks referenced, 21 banned packages and categories, version policy, rationale for NextAuth v4 and Tailwind v3 | 8.1 |
| .agents/rules/code-conventions.md | Universal code conventions: TypeScript strict flags, kebab-case naming, folder structure, three-group import order, server vs client component rule, module boundaries, typed error handling, types and constants placement, naming rules, named exports only, comment rules, 23 forbidden patterns, testing placement, 3 unresolved items | N/A |
| .agents/rules/data-and-schema.md | Schema source = PRD 5.1 plus 16 documented additions, 1 rejected addition, 7 PRD gaps, migration rules, transaction boundaries, referential integrity, indexing, field treatment, change process | 5.1, plus 1.5, 3.3 FR-01, FR-03, FR-06, FR-08, FR-10, FR-11, 3.4, 5.2, 5.3, 7.11, 7.12, 8.2, 8.5, 9.3, 9.6, 15.1, BR-09, BR-19 |
| .agents/rules/api-design.md | Endpoint shape, error envelope, 12 status codes, auth pattern, role check pattern, IDOR 404 rule, idempotency, pagination, CSRF, rate limit response, no versioning, 3 unresolved items | 8.3, 9.3, 10, 9.6, 14.2, 3.3 FR-08 |
| .agents/rules/security-baseline.md | Universal security enforcement: bcrypt cost 12, AES-256-GCM, session cookie rules, CSRF double-submit, Zod validation, output encoding, SQL injection prevention, rate limits, OTP mechanics, password reset 24-hour lock, IP logging, NIN masking, PII scrubbing list, security headers, 6 unresolved items | 9.3, 5.3, 7.11, 8.5, 9.6, 11, 3.3 FR-06, BR-19 |
| .agents/rules/accessibility-baseline.md | Universal a11y pattern: WCAG 2.1 AA for customer flows, contrast, keyboard, focus, semantics, forms, images, battery-life-equals-price accessible pattern, announcements, motion, zoom, hidden-state rule, testing approach, 3 unresolved items | 9.4, 3.3 FR-01, 3.1, 3.2, 9.5 |
| .agents/rules/observability-baseline.md | Universal log schema, 4 log levels with rules, banned fields and practices, correlation ID propagation, error capture convention, frontend boundary, health endpoint wire contract, heartbeat write pattern, third-party call logging, log volume and retention, 4 unresolved items | 15.1, 7.12, 9.2, 14.3, 9.1 |
| .agents/rules/env-and-secrets.md | Universal secret management: 3 environments, 10 variable names with env requirements and consumers, SCREAMING_SNAKE_CASE convention, what does not belong, local dev rules, Zod env validation, access and storage, per-variable rotation procedure, leak response steps, 11 banned practices, 5 unresolved items | 8.5 |
| .agents/rules/scope.md | Version 1 in-scope features per persona | 1.5 |
| .agents/rules/out-of-scope.md | Explicit exclusions | 1.6, 6 |
| .agents/rules/success-metrics.md | Five metrics with formulas and targets | 1.8 |
| .agents/rules/user-journeys.md | Four persona journeys with steps, step counts, PRD 2.2 gaps and conflicts | 2.2, 3.4, 11, 3.2 |
| .agents/rules/workflows.md | Workflows 1 to 7 with branches and edge cases, workflow step counts, eleven PRD contradictions and gaps flagged | 2.3, 3.3 FR-13, 4.1 BR-03, 6, 7.5, 7.10, 8.5, 14.3 |
| .agents/rules/screen-inventory.md | 29 screens (7 public, 6 customer, 7 worker, 9 owner/co-owner) with route, role, purpose, primary action, key elements | 3.2 |
| .agents/rules/functional-requirements.md | FR-01 to FR-14 | 3.3 |
| .agents/rules/business-rules.md | BR-01 to BR-20, thresholds, durations, NIN format, freshness window, same-user rule, statuses pointer | 4.1, 3.3 FR-03, 7.9, 7.13, 8.5, 9.2, 14.3 |
| .agents/rules/state-transitions.md | Seven customer statuses, ten application states, transitions per event, side effects per transition, atomicity per transition, countdown rules, three PRD gaps, one PRD contradiction | 3.4, 3.3 FR-14, 4.1, 8.2, 9.2, 14.3 |
| .agents/rules/failure-modes.md | 13 failure modes, mitigations, two residual risks, PRD 4.2 subsumed into 7.1 through 7.3, five duplications flagged | 7, 4.2, 3.3 FR-08, 9.3, 14.3, 15.1 |
| .agents/rules/version-2-data.md | Fields Version 1 collects for Version 2, Version 2 features not built in Version 1, hard no-scaffolding rules, field removal prohibition | 5.2, 16.2 |
| .agents/rules/ndpa-compliance.md | Lawful basis, encryption, retention, anonymization mechanics, pseudonymous ID (unresolved), audit log immutability, 6 NDPA gaps flagged for Day 0 | 5.3, 5.1, 7.11, 8.5, 9.3, 10 |
| .agents/rules/api-contracts.md | Full endpoint list with method, role, effect, 39 endpoints, 10 gap endpoints flagged | 8.3, 8.5, 11, 7.8, 2.2.2, 3.3, 5.1, 10, 15.1 |
| .agents/rules/third-party.md | Approved external services, calling routes per service, data flow rules per service, not-called list, one-package-per-service rule | 8.4, 8.1, 8.3, 6, 5.3, App G |
| .agents/rules/non-functional.md | Performance, reliability, security intent, accessibility, browser support, concurrency, backup, recovery, incident response, 6 unresolved NFR items | 9.1 through 9.6, 17.1 through 17.3 |
| .agents/rules/permission-matrix.md | Role by resource grid, 40 rows, NIN masking rule, 9 hard enforcement constraints, 3 unresolved | 10, 9.3, 4.1 BR-13, BR-19, 7.13, 3.3 FR-06, FR-11 |
| .agents/rules/notification-matrix.md | 4 SMS notifications, 8 manual WhatsApp notifications, 4 in-app Owner alerts, state display split out, template reference per row, 2 PRD 11 gaps | 11, 7.8, 8.3, 9.3, 2.3.2, 3.3 FR-05, FR-06, FR-07, 15.3, 6 |
| .agents/rules/cron.md | 4 GET cron endpoints, WAT and UTC schedules, two heartbeat fields, idempotency rules, boundary conditions, manual catch-up runbook, 3 unresolved items | 8.3, 9.2, 14.3, 15.1, 4.1 BR-03 |
| .agents/rules/message-templates.md | Exact SMS and WhatsApp template text, placeholder source table, 10 WhatsApp templates, 1 composed OTP SMS body, 3 unresolved placeholder values | App A, 9.3, 2.3.7, 3.3 FR-05 |
| .agents/rules/ux-states.md | Global states, 8 Appendix B screen blocks verbatim, 15 uncovered screens list, 3 reuse patterns, 9 unresolved | App B, 9.3, 10, 3.4, 3.1, 3.3 FR-08 |
| .agents/rules/edge-cases.md | 26 edge cases grouped by severity, actor, handling, cross-reference, 6 PRD gaps, 8 unresolved items | App C, 7.4, 7.6, 7.8, 7.10, 7.11, 7.12, 7.13, 8.3, 10, 13.1, 14.3, 15.1, BR-13, BR-19 |
| .agents/rules/build-plan.md | Day 0 to Day 5 plan, 21 Day 0 decisions with owner and fallback, acceptance per day, slip rules per day, 5-item cut order, seed data, parallelization rules, handoff rules, rollback rule | 12, 16.1, App G |
| .agents/rules/monitoring.md | What is monitored, what is not, in-app alert rules with thresholds, health endpoint spec, Sentry sampling and PII scrubbing, dashboard health indicators, 5 unresolved items | 15.1, 15.2, 15.3, 7.12, 9.2, 14.3, 8.3, 5.3, App B.8 |

Schema: `prisma/schema.prisma` mirrors PRD Section 5.1 plus the sixteen additions in `.agents/rules/data-and-schema.md`. Governed by `.agents/rules/data-and-schema.md`. No other additions, renames, or drops.

## Context docs and when to use them

Context docs are navigation aids. They orient a reader to the whole system or point at where a rule lives. They never replace a rule file. If a context doc disagrees with a rule file, with `prisma/schema.prisma`, or with this file, the rule file, the schema, or this file wins. The doc loses.

Read the matching doc before starting the task. Do not read a doc out of scope.

| Doc | Path | Load when |
|---|---|---|
| architecture | `docs/architecture.md` | Start of every feature. Read once. Do not re-read mid-feature unless the feature crosses a layer boundary. |
| data-model | `docs/data-model.md` | When working on a table or relationship you have not touched before. Navigation only. The schema is `prisma/schema.prisma`. |
| design-system | `docs/design-system.md` | Before building any form screen or list screen. Mandatory before any UI is written. |
| assumptions-and-open-questions | `docs/assumptions-and-open-questions.md` | Session start. Pointer file. Use it to navigate to the rule file that owns the open question you need resolved. Do not add a question to it. |

## Skills and when to use them

Skills are repeatable procedures. Load the matching skill before starting the task. Do not invent a procedure when a skill exists. Do not load a skill when its trigger does not match. Do not restate a rule inside a skill; the skill references the rule file instead.

| Skill | Path | Load when |
|---|---|---|
| build-api-endpoint | `.agents/skills/build-api-endpoint/SKILL.md` | The task names a specific endpoint from `api-contracts.md`, or asks to add, change, or fix an HTTP route handler, service function, or Zod schema for one endpoint. |
| build-form-screen | `.agents/skills/build-form-screen/SKILL.md` | The task names a form screen from `screen-inventory.md` whose purpose is form submission, or asks to add, change, or fix a screen with fields the user submits. |
| build-list-screen | `.agents/skills/build-list-screen/SKILL.md` | The task names a list or queue screen from `screen-inventory.md` whose purpose is displaying a collection, or asks to add, change, or fix a screen with items and a per-item primary action. |

If a task spans more than one skill, load each skill in the order its artifact is built. Endpoint first for write forms. List endpoint first for list screens.

If a task does not match any skill trigger, do not load a skill. Follow the rule files directly.

## How to work in this codebase

- One pull request per feature or per bug fix per `.agents/rules/working-agreements.md`. One commit per logical step inside a pull request.
- Ask before adding any package not listed in the Stack section or `.agents/rules/third-party.md`.
- Do not modify the database schema. It mirrors PRD Section 5.1 plus the sixteen additions in .agents/rules/data-and-schema.md. No other additions. Do not add, rename, or remove fields without a PRD change. If PRD Section 5.1 does not list a field you need, stop and ask.
- Migrations are additive only per `.agents/rules/data-and-schema.md`. No column drops, no renames, no type narrowing. Constraints are created in the initial migration before seed runs.
- The audit log is insert-only at the database permission level per `.agents/rules/ndpa-compliance.md`. No update. No delete. Enforced in the initial migration and in database user grants.
- At the end of every response, list any decision not directly specified by the PRD or a rule file per `.agents/rules/working-agreements.md`. Do not list facts that are specified.
- Stop and ask when the PRD is silent. Do not guess. Log the question in `.agents/rules/working-agreements.md` under open questions.
- Check the rule file before implementing a rule. `.agents/rules/business-rules.md` before enforcing any limit. `.agents/rules/state-transitions.md` before adding or changing a status. `.agents/rules/api-contracts.md` and `.agents/rules/api-design.md` before adding or changing an endpoint. `.agents/rules/permission-matrix.md` before any role check.
- Battery life displays with equal visual weight to price on every device view. Font size, weight, and card prominence match per `.agents/rules/functional-requirements.md`.
- Every screen has exactly one primary action per `.agents/rules/screen-inventory.md`.
- Every form field has inline validation per `.agents/rules/functional-requirements.md`.
- Every screen has explicit empty, loading, and error states per `.agents/rules/ux-states.md`.
- No decorative elements per `.agents/rules/working-agreements.md`.
- Mobile first for customer flows. Desktop first for Worker and Owner flows.
- All multi-table writes run inside one Prisma transaction per `.agents/rules/data-and-schema.md`.
- Do not build Version 2 features or scaffolding. Version 1 only collects Version 2 data per .agents/rules/version-2-data.md.

## Where the detailed rules live

The PRD at `Context files/DG Tech Store PRD.md` is the source of truth for behavior. Sections 1 through 17 plus Appendices A through G.

Sigma Designs frames are the layout and design guide. When the PRD is silent on a screen detail, adopt the frame layout. If the frame contains an element listed in Not in scope, or not present in PRD Section 3.2, do not build it. Log the discrepancy in `.agents/rules/working-agreements.md` under open questions.

Rule files in `.agents/rules/` hold detailed content referenced from this file. Create them on Day 0 per `.agents/rules/build-plan.md`.

## Definitions

- **Available stock:** stock count minus reserved count per `.agents/rules/functional-requirements.md`.
- **Locked price:** device price at valid application submission per `.agents/rules/business-rules.md`.
- **Price freshness:** fresh when exchange rate multiplier is unchanged since last published price and last update is within the window in `.agents/rules/business-rules.md`.
- **Settled:** full remaining balance recorded as paid per `.agents/rules/state-transitions.md`.
- **Administrative default flag:** marks device serial and contract as Defaulted and applies a platform purchase block keyed on NIN and phone per `.agents/rules/state-transitions.md`. Does not lock, disable, or recover the device. Block is platform only.
- **Same-user rule:** final approver cannot be the verifier per `.agents/rules/business-rules.md`.
- **WAT:** West Africa Time, UTC+1.
- **IP collision:** same IP address recorded on both verification and final approval for the same application per `.agents/rules/business-rules.md`. Triggers Owner in-app alert.
- **Minimal UX MO:** one primary action per screen, inline validation, explicit empty, loading, and error states, no decorative elements, progressive disclosure, mobile first for customers, desktop first for Worker and Owner, battery life equal visual weight to price.

## Open questions

Where the PRD is silent, track the answer in `.agents/rules/build-plan.md` under Day 0 decisions:

1. Testing framework name.
2. SMS provider pick between the two options.
3. File storage pick.
4. Database hosting pick.
5. Retention length for personal data after contract ends.
6. Pseudonymous ID mapping custody and storage mechanism.
7. IP address retention period in AuditLog.
8. Customer view of own NIN.
9. Consent revocation process when ConsentRecord.revoked_at is set.
10. Deletion request during Defaulted contract legal review confirmation.
11. InventoryApproval table is not in PRD 5.1.
12. Reminder :id pattern in PRD 8.3 does not match a schema that has no reminder rows before send.
13. Contract view, agreement document, reserved units, and single-detail endpoints for Owner, Worker, and Customer are missing from PRD 8.3.
14. Rate limits conflict. CGNAT breaks 20 per minute per IP. 5 per phone per hour contradicts 5 per minute on OTP.
15. Uptime window. Does 99 percent cover the 20:00 WAT cron.
16. RPO. 5-minute PITR versus 24-hour daily snapshot.
17. Backup retention. 7 days does not cover 30-day contract plus resolution.
18. WCAG scope for Worker and Owner flows.
19. Incident notification SLA to affected customers.
20. Customer viewing own NIN.
21. Exact display scope for full NIN for Owner and Co-owner.
22. Masking format for Worker view of NIN.
23. No escalation rule if customer does not respond to WhatsApp reminders before default.
24. [Store Contact] value used in reminder templates.
25. Shop WhatsApp number for Confirm Current Price recipient.
26. T+1 template says will change to Defaulted but status is already Defaulted at send time.
27. 15 screens with no Appendix B states defined.
28. OTP lockout state after 3 failed attempts.
29. OTP rate limit state.
30. Login error strings for wrong password, account not found, account locked.
31. Register error strings for phone already registered, weak password.
32. Forgot Password error strings.
33. Confirm Current Price success and failure states.
34. My Applications empty and loading states.
35. Account Settings form states.
36. Device damaged before pickup. No status change mechanism in state-transitions.md.
37. Expiry behavior at Awaiting Down Payment Verification and later intermediate states.
38. 24-hour acceptance timeout has no status transition.
39. Return policy for Completed contracts.
40. Customer death or incapacity handling.
41. Legal review requirement for deletion during default.
42. data-and-schema.md needs two heartbeat fields (last_expiry_cron_at, last_default_cron_at) instead of one. Schema change required before Day 1.
43. api-contracts.md lists cron endpoints as POST but Vercel Cron uses GET. Update api-contracts.md.
44. No automated recovery from a missed cron. Manual catch-up only.
45. Alert review cadence for Owner. Sentry and Vercel dashboards are not integrated with the app dashboard.
46. Alert response SLA after an in-app alert appears.
47. SMS provider health monitoring is not built in Version 1.
48. Database connection count threshold depends on Day 0 managed Postgres plan pick.
49. Vercel log retention on the chosen plan.
50. Idempotency-Key storage table not in data-and-schema.md. Adding it requires a schema change. Day 0 decision required.
51. NIN mask format for Worker view.
53. OTP lockout string in ux-states.md.
54. Session idle and absolute timeout values. Default 24 hours and 7 days stated in security-baseline.md. Confirm.
55. Key rotation runbook detail: script location, batch size, downtime.
56. bcrypt cost 12 versus 11 on the chosen Vercel plan if login P95 exceeds 1 second.
57. Structured logger implementation module. Wraps console.log with the schema. Day 0 decision.
58. Vercel log retention on the chosen plan. Referenced from monitoring.md.
59. Sentry project configuration: one DSN per environment or one project with environment tags. Day 0 decision.
60. Rate limit values (referenced from non-functional.md item 14).
61. SENTRY_AUTH_TOKEN for sourcemap upload. Not in PRD 8.5. Add or accept minified traces.
62. DATABASE_URL rotation runbook detail. Provider chosen on Day 0.
63. SMS_API_KEY rotation grace period. Provider chosen on Day 0.
64. Password manager selection and ownership.
65. Whether NIN_ENCRYPTION_KEY and PHONE_ENCRYPTION_KEY remain separate.
66. Linter and formatter configuration. ESLint and Prettier assumed. Exact config not chosen.
67. Test database strategy for CI. Per build-plan.md Day 0 decision 1.
68. Whether verbatimModuleSyntax is available on the chosen TypeScript version.
69. Icon library: Lucide assumed. Confirm at Day 0.
70. Component library: shadcn/ui assumed as copied-in primitives. Confirm at Day 0.
71. Form library: none assumed. Confirm at Day 0.
72. Database version: 15, 16, or 17. Chosen with Day 0 host pick.
73. bcryptjs versus bcrypt. bcryptjs assumed for Vercel compatibility. Confirm at Day 0.
74. Testing framework pick: Vitest or Jest. Already in build-plan.md Day 0 decision 1. Referenced here.
75. @sentry/nextjs confirmed as the single Sentry package. No alternative.
76. NextAuth v4 confirmed, not Auth.js v5.
77. Tailwind v3 confirmed, not v4.
78. date-fns confirmed as the single date library.

All open questions above (1 through 78, with duplicate item 52 removed) are resolved in build-plan.md Day 0 decisions or in the rule file named alongside each question. Once build-plan.md is populated, this open questions section is historical only. New open questions go into working-agreements.md.