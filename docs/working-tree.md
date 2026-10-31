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
│   ├── (public)/                               # Unauthenticated & customer browsing route group
│   │   └── page.tsx                            # Screen #1: Home / Inventory Listing scaffold
│   ├── api/                                    # HTTP route handlers (thin controllers)
│   │   └── health/
│   │       └── route.ts                        # GET /api/health endpoint
│   ├── globals.css                             # Global stylesheet importing fonts & tokens
│   └── layout.tsx                              # Root Server Component layout
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
│   └── github-phase-log.txt
├── lib/                                        # Server-side utilities, validation, & domain modules
│   ├── constants.ts                            # Business rule thresholds & enums (BR-01..BR-20)
│   ├── env.ts                                  # Zod-validated environment configuration
│   ├── errors.ts                               # AppError class & standard error envelope mapper
│   ├── logger.ts                               # Structured JSON logger with PII scrubbing
│   └── types.ts                                # Domain status unions, roles, and DTO contracts
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

