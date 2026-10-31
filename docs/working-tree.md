# Working-Tree Structure and Organization (`docs/working-tree.md`)

Source: [`.agents/rules/code-conventions.md`](../.agents/rules/code-conventions.md); [`.agents/rules/screen-inventory.md`](../.agents/rules/screen-inventory.md); [`.agents/rules/api-contracts.md`](../.agents/rules/api-contracts.md); [`docs/architecture.md`](./architecture.md).

## 1. Actual Working-Tree Structure (Phase 1)

```text
/Users/macbookpro/Desktop/Dev & Design To/Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY/
├── .agents/
│   ├── rules/                                  # 32 authoritative engineering & domain rule files
│   │   ├── accessibility-baseline.md
│   │   ├── api-contracts.md
│   │   ├── api-design.md
│   │   ├── build-plan.md
│   │   ├── business-rules.md
│   │   ├── code-conventions.md
│   │   ├── cron.md
│   │   ├── data-and-schema.md
│   │   ├── edge-cases.md
│   │   ├── env-and-secrets.md
│   │   ├── failure-modes.md
│   │   ├── functional-requirements.md
│   │   ├── message-templates.md
│   │   ├── monitoring.md
│   │   ├── ndpa-compliance.md
│   │   ├── non-functional.md
│   │   ├── notification-matrix.md
│   │   ├── observability-baseline.md
│   │   ├── out-of-scope.md
│   │   ├── permission-matrix.md
│   │   ├── scope.md
│   │   ├── screen-inventory.md
│   │   ├── security-baseline.md
│   │   ├── stack.md
│   │   ├── state-transitions.md
│   │   ├── success-metrics.md
│   │   ├── third-party.md
│   │   ├── user-journeys.md
│   │   ├── ux-states.md
│   │   ├── version-2-data.md
│   │   ├── workflows.md
│   │   └── working-agreements.md
│   └── skills/                                 # 3 repeatable procedural skills (kebab-case aligned)
│       ├── build-api-endpoint/
│       │   └── SKILL.md
│       ├── build-form-screen/
│       │   └── SKILL.md
│       └── build-list-screen/
│           └── SKILL.md
├── Context files/
│   ├── DG Tech Store PRD.md                    # Consolidated PRD v1.3
│   ├── architecture.md                         # 3-layer system navigation & 7-step HTTP lifecycle
│   ├── assumptions-and-open-questions.md       # Pointer index to rule files owning open questions
│   ├── data-model.md                           # 5-domain data model navigation aid
│   └── design-system.md                        # Design system consumption rules & anti-patterns
├── app/                                        # Next.js 14 App Router presentation & API layer
│   ├── (admin)/                                # Owner & Co-owner executive route group (Screens #21-#29)
│   │   ├── admin/
│   │   │   ├── applications/[id]/
│   │   │   │   ├── final-approve/page.tsx      # Screen #23: Final Approval (BR-13 dual-control gate)
│   │   │   │   └── review/page.tsx             # Screen #22: Review Application (NIN access & rejection)
│   │   │   ├── audit/page.tsx                  # Screen #28: Immutable Audit Log (50 rows/page)
│   │   │   ├── defaults/page.tsx               # Screen #25: Defaulted Contracts (FR-09 ₦0 balance resolution)
│   │   │   ├── deletion-requests/page.tsx      # Screen #26: NDPA Section 37 Deletion Requests
│   │   │   ├── exchange-rate/page.tsx          # Screen #24: Exchange Rate Settings (live price preview)
│   │   │   ├── inventory-approvals/page.tsx    # Screen #27: Inventory Approvals (worker proposals)
│   │   │   ├── metrics/page.tsx                # Screen #29: Success Metrics (5 PRD business KPIs)
│   │   │   └── page.tsx                        # Screen #21: Owner Dashboard (alerts & KPI summary)
│   │   └── layout.tsx                          # Executive governance navigation layout
│   ├── (customer)/                             # Authenticated Customer route group (Screens #8-#13)
│   │   ├── applications/
│   │   │   ├── [id]/
│   │   │   │   ├── accept/page.tsx             # Screen #12: Agreement Acceptance (with SMS OTP)
│   │   │   │   └── page.tsx                    # Screen #9: Application Status (with 24h timer)
│   │   │   └── page.tsx                        # Screen #10: My Applications
│   │   ├── apply/[deviceId]/page.tsx           # Screen #8: Apply for Part-Payment
│   │   ├── contracts/[id]/
│   │   │   ├── _components/print-contract-button.tsx
│   │   │   └── page.tsx                        # Screen #11: Contract Detail
│   │   └── settings/page.tsx                   # Screen #13: Account Settings & NDPA Deletion
│   ├── (public)/                               # Unauthenticated & customer browsing route group (7 screens)
│   │   ├── confirm-price/[deviceId]/page.tsx   # Screen #7: Confirm Current Price via WhatsApp (Template A.3)
│   │   ├── devices/[id]/
│   │   │   ├── _components/part-payment-calculator.tsx # Interactive FR-02 70%-80% calculator
│   │   │   └── page.tsx                        # Screen #2: Device Detail
│   │   ├── forgot-password/page.tsx            # Screen #6: Forgot Password (24-hour lock notice)
│   │   ├── login/page.tsx                      # Screen #3: Login
│   │   ├── register/page.tsx                   # Screen #4: Register (Terms & WhatsApp consent)
│   │   ├── verify-otp/page.tsx                 # Screen #5: OTP Verification (with B.6 fallback)
│   │   └── page.tsx                            # Screen #1: Home / Inventory Listing (25 devices + filters)
│   ├── (worker)/                               # Store Worker counter operations route group (Screens #14-#20)
│   │   ├── layout.tsx                          # Worker counter layout & navigation header
│   │   └── worker/
│   │       ├── balance/[agreementId]/page.tsx  # Screen #16: Record Balance Payment (FR-08 overpayment block)
│   │       ├── inventory/page.tsx              # Screen #20: Inventory Update (propose stock changes)
│   │       ├── reminders/page.tsx              # Screen #18: Reminder Checklist (wa.me click-to-chat)
│   │       ├── reserved/page.tsx               # Screen #19: Reserved Units (24h hold & shelf tags)
│   │       ├── settlement/[agreementId]/page.tsx # Screen #17: Record Settlement Payment
│   │       ├── verify/[applicationId]/page.tsx # Screen #15: Verify Down Payment (BR-06 attestation)
│   │       └── page.tsx                        # Screen #14: Worker Dashboard (4 operational queues)
│   ├── api/                                    # HTTP route handlers (thin controllers)
│   │   ├── admin/                              # Owner & Co-owner administration API routes
│   │   │   ├── applications/
│   │   │   │   └── [id]/
│   │   │   │       ├── final-approve/route.ts  # POST /api/admin/applications/:id/final-approve
│   │   │   │       ├── review/route.ts         # POST /api/admin/applications/:id/review
│   │   │   │       └── view-nin/route.ts       # POST /api/admin/applications/:id/view-nin
│   │   │   ├── audit-logs/route.ts             # GET /api/admin/audit-logs
│   │   │   ├── defaults/[id]/resolve/route.ts  # POST /api/admin/defaults/:id/resolve
│   │   │   ├── deletion-requests/[id]/decide/route.ts # POST /api/admin/deletion-requests/:id/decide
│   │   │   ├── exchange-rate/route.ts          # POST /api/admin/exchange-rate
│   │   │   ├── inventory-approvals/[id]/decide/route.ts # POST /api/admin/inventory-approvals/:id/decide
│   │   │   └── metrics/route.ts                # GET /api/admin/metrics
│   │   ├── applications/
│   │   │   ├── [id]/
│   │   │   │   ├── accept-agreement/route.ts   # POST /api/applications/:id/accept-agreement
│   │   │   │   └── route.ts                    # GET /api/applications/:id
│   │   │   ├── mine/route.ts                   # GET /api/applications/mine
│   │   │   └── route.ts                        # POST /api/applications
│   │   ├── auth/
│   │   │   ├── accept-agreement-otp/route.ts   # POST /api/auth/accept-agreement-otp
│   │   │   ├── forgot-password/route.ts        # POST /api/auth/forgot-password
│   │   │   ├── login/route.ts                  # POST /api/auth/login
│   │   │   ├── logout/route.ts                 # POST /api/auth/logout
│   │   │   ├── register/route.ts               # POST /api/auth/register
│   │   │   ├── reset-password/route.ts         # POST /api/auth/reset-password
│   │   │   └── verify-otp/route.ts             # POST /api/auth/verify-otp
│   │   ├── calculator/route.ts                 # POST /api/calculator
│   │   ├── cron/
│   │   │   ├── check-expiry-heartbeat/route.ts # GET /api/cron/check-expiry-heartbeat
│   │   │   └── expire-applications/route.ts    # GET /api/cron/expire-applications
│   │   ├── customer/
│   │   │   └── deletion-request/route.ts       # POST /api/customer/deletion-request
│   │   ├── devices/
│   │   │   ├── [id]/route.ts                   # GET /api/devices/:id
│   │   │   └── route.ts                        # GET /api/devices
│   │   ├── health/
│   │   │   └── route.ts                        # GET /api/health endpoint
│   │   └── worker/                             # Store Worker counter operations API routes
│   │       ├── inventory-update/route.ts       # POST /api/worker/inventory-update
│   │       ├── log-reminder/route.ts           # POST /api/worker/log-reminder
│   │       ├── queues/route.ts                 # GET /api/worker/queues
│   │       ├── record-balance/route.ts         # POST /api/worker/record-balance
│   │       ├── record-settlement/route.ts      # POST /api/worker/record-settlement
│   │       ├── resend-otp/route.ts             # POST /api/worker/resend-otp
│   │       └── verify-payment/route.ts         # POST /api/worker/verify-payment
│   ├── globals.css                             # Global stylesheet importing fonts & tokens
│   ├── layout.tsx                              # Root Server Component layout
│   └── not-found.tsx                           # Global 404 boundary (verbatim ux-states.md string)
├── docs/                                       # Required workstream documentation (9 files)
│   ├── defects.md
│   ├── false-success.md
│   ├── information-design.md
│   ├── interview-answers.md
│   ├── model-choices.md
│   ├── performance-note.md
│   ├── readme-test.md
│   ├── scaffold-prompt.md
│   └── working-tree.md
├── evidence/                                   # Verifiable execution & audit records
│   ├── 01-agent-plan.txt
│   ├── 02-files-created.txt
│   ├── 03-server-start.txt
│   ├── 04-first-load.txt
│   ├── 05-nested-folder-error.txt
│   ├── 06-nested-folder-fixed.txt
│   ├── 07-port-conflict.txt
│   ├── 08-port-conflict-resolved.txt
│   ├── 09-404-error.txt
│   ├── 10-404-resolved.txt
│   ├── 11-db-write-success.txt
│   ├── 12-db-connection-failure.txt
│   ├── 13-db-connection-recovered.txt
│   └── github-phase-log.txt
├── lib/                                        # Server-side utilities, validation, & domain modules
│   ├── services/
│   │   ├── admin-service.ts                    # Owner review, dual-control approval, multiplier, defaults
│   │   ├── application-service.ts              # Part-payment submission & agreement acceptance logic
│   │   ├── audit-service.ts                    # Immutable append-only audit trail & 50 rows/page query
│   │   ├── auth-service.ts                     # Auth & OTP verification business logic
│   │   ├── catalog-service.ts                  # Device filtering, lookup, & calculator math
│   │   ├── cron-service.ts                     # Overdue application expiry & heartbeat checker
│   │   ├── customer-service.ts                 # NDPA formal data deletion service
│   │   └── worker-service.ts                   # Operational queues, down payment verify, balance record
│   ├── catalog-data.ts                         # 25 seeded Shop ATF 03 devices across 5 brands
│   ├── constants.ts                            # Business rule thresholds & enums (BR-01..BR-20)
│   ├── crypto.ts                               # AES-256-GCM encryption, HMAC-SHA256 blind index, NIN mask
│   ├── db.ts                                   # PrismaClient singleton
│   ├── env.ts                                  # Zod-validated environment configuration
│   ├── errors.ts                               # AppError class & standard error envelope mapper
│   ├── logger.ts                               # Structured JSON logger with PII scrubbing
│   ├── templates.ts                            # Verbatim Appendix A WhatsApp & OTP SMS templates
│   └── types.ts                                # Domain status unions, roles, and DTO contracts
├── prisma/
│   ├── schema.prisma                           # 14 PRD 5.1 models + Session, OtpToken, InventoryApproval
│   └── seed.ts                                 # Development/Preview seed script (Settings, 7 users, 25 devices)
├── styles/                                     # Approved Task 1 design system tokens & fonts
│   ├── fonts/
│   │   ├── OFL-FiraSans.txt
│   │   ├── OFL-NotoSans.txt
│   │   ├── fira-sans-400-text.woff2
│   │   ├── fira-sans-500-text.woff2
│   │   ├── fira-sans-600-text.woff2
│   │   ├── fira-sans-700-text.woff2
│   │   └── noto-sans-400-text.woff2
│   ├── fonts.css
│   └── tokens/
│       ├── index.css
│       ├── primitives.css
│       └── roles.css
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .nvmrc
├── .prettierrc
├── AGENTS.md
├── README.md
├── next.config.mjs
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 2. Structural Decisions and Rationale

1. **Flat Project Root (No Nested `task-02-repository-and-scaffold/` Subfolder):**
   - `AGENTS.md` line 5 defines `/Users/macbookpro/Desktop/Dev & Design To/Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY` as the canonical project root. Placing `package.json`, `app/`, `lib/`, `styles/`, `docs/`, and `evidence/` directly at the repository root prevents the nested-folder error (`ENOENT: no such file or directory, open '.../package.json'`) where commands run from the wrong directory level.
2. **Next.js App Router Route Groups by Persona (`code-conventions.md`):**
   - UI screens under `app/` are partitioned into four route groups that do not pollute URL paths:
     - `app/(public)/` — 7 public screens (`Visitor` & `Customer`)
     - `app/(customer)/` — 6 authenticated `Customer` screens
     - `app/(worker)/` — 7 `Store Worker` operational screens
     - `app/(admin)/` — 9 `Owner` & `Co-owner` governance and approval screens
   - This separation allows role-specific layouts and middleware guards without duplicating URL prefixes where canonical routes are top-level (`/login`, `/apply/[deviceId]`, `/worker`, `/admin`).
3. **Strict 3-Layer Module Boundary (`docs/architecture.md` & `code-conventions.md`):**
   - `app/**` (Presentation) never imports database or encryption modules directly.
   - `app/api/**/route.ts` (Controllers) only parse requests with Zod, invoke `lib/services/*`, and return standard JSON envelopes with `x-request-id`.
   - `lib/` holds focused modules (`env.ts`, `logger.ts`, `errors.ts`, `constants.ts`, `types.ts`, and in Phase 2 `db.ts`, `crypto.ts`, `services/*`). Generic dumping-ground directories (`utils/`, `helpers/`, `common/`) are banned by `code-conventions.md`.
4. **No Barrel (`index.ts`) Files (`code-conventions.md`):**
   - Every module is imported by its explicit `kebab-case` file path (`@/lib/errors`, `@/lib/logger`) to prevent circular dependencies and preserve tree-shaking in Next.js server/client bundles.

