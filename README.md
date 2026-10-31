# DG Tech Store (Shop ATF 03) — Repository & Application Scaffold

## Workstream Overview

This repository (`Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY`) contains the foundational full-stack scaffold, design-system token integration, governance rule set, and phased proof-of-concept implementation for **DG Tech Store**, a single-store device inventory and part-payment ("Flexi-Pay") platform for **Shop ATF 03**.

The application enables:
- **Visitors & Customers** to browse real-time device stock (`available_stock = stock_count - reserved_count`), inspect specifications with **Battery Life and Price displayed at equal visual weight (`FR-01`)**, run interactive part-payment calculations (`70%–80%` down payment, `30-day` completion window with zero interest or fees per `BR-02`, `BR-04`), submit a part-payment application locking the price and reserving `1` unit for `24 hours` (`FR-03`, `BR-01`), and accept the Flexi-Pay agreement via a 6-digit SMS OTP (`FR-06`).
- **Store Workers** to manage operational queues, verify cash or bank-transfer down payments with IP logging and mandatory attestation (`FR-05`, `BR-06`, `BR-19`), record balance and settlement payments (`FR-08`), trigger and log manual WhatsApp messages (`FR-07`), confirm physical reservation tags, and propose inventory/price updates (`FR-13`).
- **Owners & Co-owners** to review applications (`FR-04`), execute atomic 3-condition Final Approval (`FR-06`, `BR-13`), adjust the global exchange-rate multiplier (`FR-13`), resolve settled defaults (`FR-09`), process NDPA data deletion requests via `UPDATE` anonymization (`FR-10`), and inspect the immutable `AuditLog` (`FR-11`) and 5 business success metrics (`PRD 1.8`).

---

## Purpose of This Workstream

1. Establish the canonical Next.js 14 (App Router) + TypeScript (`strict`) + Tailwind CSS v3 + PostgreSQL/Prisma repository structure governed by root [`AGENTS.md`](./AGENTS.md) and the 32 rule files in [`.agents/rules/`](./.agents/rules/).
2. Integrate the verified Task 1 Design System (`styles/fonts.css`, self-hosted `Fira Sans` and `Noto Sans` `.woff2` fonts, `styles/tokens/primitives.css`, and `styles/tokens/roles.css`) with zero hardcoded style values.
3. Implement the application in controlled, verified phases with full per-file assumption tracking, requirement auditing, and real execution evidence in [`evidence/`](./evidence/).

---

## Repository Structure

```text
Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY/
├── AGENTS.md                        # Persistent project-wide engineering instructions
├── README.md                        # Workstream overview, setup, and phase status
├── Context files/
│   ├── DG Tech Store PRD.md         # Consolidated PRD v1.3 (Sections 1–17, Appendices A–G)
│   ├── architecture.md              # 3-layer system navigation & 7-step HTTP lifecycle
│   ├── data-model.md                # 5-domain data model navigation aid
│   ├── design-system.md             # Design system consumption rules & anti-patterns
│   └── assumptions-and-open-questions.md # Pointer index to rule files owning open questions
├── .agents/
│   ├── rules/                       # 32 domain, architecture, security, a11y, and workflow rule files
│   └── skills/                      # 3 repeatable build procedures (build-api-endpoint, build-form-screen, build-list-screen)
├── docs/
│   ├── scaffold-prompt.md           # Approved scaffolding prompt and workflow instructions
│   ├── model-choices.md             # Confirmed vs recommended technical choices & alternatives
│   ├── working-tree.md              # Actual working-tree structure and organizational rationale
│   ├── information-design.md        # 29-screen hierarchy, route groups, FR-01 weight rule, & tokens
│   ├── false-success.md             # False-success scenarios, prevention, and verification
│   ├── performance-note.md          # 3G performance budget, architectural checks, and findings
│   ├── readme-test.md               # Clean-checkout README verification procedure & results
│   ├── defects.md                   # Defect log, reproduction details, and resolution evidence
│   └── interview-answers.md         # Evidence-based technical review answers
├── evidence/
│   ├── 01-agent-plan.txt            # Cumulative approved phase plans & verification criteria
│   ├── 02-files-created.txt         # Cumulative file creation, assumption, & verification log
│   ├── github-phase-log.txt         # Per-phase Git branch, commit, push, & main merge log
│   └── 03..20                       # Runtime, diagnostic, database, Git, and UI evidence (Phases 2–5)
├── styles/
│   ├── fonts.css                    # Self-hosted @font-face declarations (Fira Sans & Noto Sans)
│   ├── fonts/                       # Subsetted .woff2 font binaries (Latin, Hausa, Yoruba, Naira ₦)
│   └── tokens/                      # CSS custom properties (index.css, primitives.css, roles.css)
├── lib/
│   ├── env.ts                       # Zod environment variable validation
│   ├── logger.ts                    # Structured JSON stdout logger with PII redaction
│   ├── errors.ts                    # AppError class and standard API error envelope mapper
│   ├── constants.ts                 # Business rule constants (BR-01 through BR-20)
│   └── types.ts                     # Shared TypeScript status unions, roles, and DTO contracts
└── app/
    ├── globals.css                  # Imports styles/fonts.css, styles/tokens/index.css, & Tailwind layers
    ├── layout.tsx                   # Root Server Component layout with semantic landmarks
    ├── (public)/
    │   └── page.tsx                 # Screen #1: Home / Inventory Listing scaffold
    └── api/
        └── health/
            └── route.ts             # GET /api/health endpoint with x-request-id correlation header
```

---

## Setup and Execution Instructions

### Prerequisites
- **Node.js 20 LTS** (`>=20.0.0 <21.0.0`, enforced via [`.nvmrc`](./.nvmrc) and [`package.json`](./package.json))
- **npm** (do not use `yarn`, `pnpm`, or `bun` per [`.agents/rules/stack.md`](./.agents/rules/stack.md))
- **PostgreSQL 15+** (required starting in Phase 2 for Prisma migrations and seed data)

### 1. Environment Configuration
Copy the example environment file to `.env.local`:

```bash
cp .env.example .env.local
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Type Check and Lint
```bash
npm run typecheck
npm run lint
```

### 4. Start Development Server
```bash
npm run dev
```

Once running, inspect:
- **Public Home Scaffold:** `http://localhost:3000/`
- **Health Endpoint:** `http://localhost:3000/api/health`

---

## Documentation Links

- **Engineering Instructions:** [`AGENTS.md`](./AGENTS.md)
- **Product Requirements:** [`Context files/DG Tech Store PRD.md`](./Context%20files/DG%20Tech%20Store%20PRD.md)
- **System Architecture:** [`Context files/architecture.md`](./Context%20files/architecture.md)
- **Data Model Navigation:** [`Context files/data-model.md`](./Context%20files/data-model.md)
- **Design System Rules:** [`Context files/design-system.md`](./Context%20files/design-system.md)
- **Assumptions & Open Questions Pointer:** [`Context files/assumptions-and-open-questions.md`](./Context%20files/assumptions-and-open-questions.md)
- **Technical & Model Choices:** [`docs/model-choices.md`](./docs/model-choices.md)
- **Working-Tree Organization:** [`docs/working-tree.md`](./docs/working-tree.md)
- **Information & Screen Design:** [`docs/information-design.md`](./docs/information-design.md)
- **False-Success Prevention:** [`docs/false-success.md`](./docs/false-success.md)
- **Performance Notes:** [`docs/performance-note.md`](./docs/performance-note.md)
- **README Verification Test:** [`docs/readme-test.md`](./docs/readme-test.md)
- **Defects Log:** [`docs/defects.md`](./docs/defects.md)
- **Technical Review Answers:** [`docs/interview-answers.md`](./docs/interview-answers.md)

---

## Workstream Status

| Phase | Scope | Status |
|---|---|---|
| **Pre-Phase 1** | Root `AGENTS.md`, 32 `.agents/rules/*.md` files, 3 `.agents/skills/` procedures, and 5 context docs | **Completed & Verified** |
| **Phase 1** | Git init, skill path normalization, Task 1 `styles/` token integration, workstream `docs/*.md`, Next.js 14 + TS strict + Tailwind v3 base scaffold, `lib/` core modules, `app/(public)/page.tsx`, `GET /api/health`, and `evidence/01` & `02` | **Completed & Verified** |
| **Phase 2** | `prisma/schema.prisma`, `prisma/seed.ts`, `lib/db.ts`, `lib/crypto.ts`, `lib/templates.ts`, `lib/catalog-data.ts`, `lib/services/*`, Public & Auth screens (`Home`, `Device Detail`, `Login`, `Register`, `OTP Verification`, `Forgot Password`, `Confirm Current Price`), 10 API routes, and server startup & diagnostic evidence (`evidence/03`–`10`) | **Completed & Verified** |
| **Phase 3** | Customer screens (`Apply`, `Application Status`, `My Applications`, `Agreement Acceptance`, `Contract Detail`, `Account Settings`), Application & Cron API endpoints, and DB write/failure evidence (`evidence/11`–`13`) | **Completed & Verified** |
| **Phase 4** | Store Worker (7 screens: #14–#20) and Owner/Co-owner (9 screens: #21–#29) operational workflows, queues, approvals, exchange rate, defaults, deletions, audit log, metrics, and 16 management API routes | **Completed & Verified** |
| **Phase 5** | Working-tree diagram, Git log graph, `<head>` route checks, heading-wrap defect/fix, and 3-width responsive verification (`evidence/14`–`20`) | **Pending (Next Phase)** |

