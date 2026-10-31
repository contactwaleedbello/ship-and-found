# README Verification Procedure and Results (`docs/readme-test.md`)

Source: [`README.md`](../README.md); [`docs/scaffold-prompt.md`](./scaffold-prompt.md) Section 6 (`docs/readme-test.md`).

## 1. Purpose

This document defines the step-by-step verification procedure used to test that a developer or reviewer following [`README.md`](../README.md) from a clean checkout of `/Users/macbookpro/Desktop/Dev & Design To/Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY` can configure, install, typecheck, and run the project without undocumented steps.

---

## 2. Verification Checklist and Phase 1 Results

| Step | README Instruction Tested | Command Executed | Phase 1 Result | Evidence / Notes |
|---|---|---|---|---|
| **1** | Verify working directory is the repository root (not a nested subfolder) | `pwd && test -f package.json` | **Passed** | Confirmed `package.json`, `AGENTS.md`, `styles/`, `app/`, `lib/`, `docs/`, and `evidence/` exist directly at `/Users/macbookpro/Desktop/Dev & Design To/Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY`. |
| **2** | Verify Node.js runtime matches `.nvmrc` (`20`) and `engines.node` | `node -v` | **Verified** | `.nvmrc` specifies `20`; `package.json` enforces `"node": ">=20.0.0 <21.0.0"`. |
| **3** | Verify Task 1 Design System `styles/` parity | `diff -rq ../task-01-design-system/styles ./styles` | **Passed (`0` differences)** | Exact byte-for-byte match between `/Users/macbookpro/Desktop/Dev & Design To/task-01-design-system/styles` and `./styles`. |
| **4** | Copy `.env.example` to `.env.local` | `cp .env.example .env.local` | **Passed** | All 10 required environment variable names from `.agents/rules/env-and-secrets.md` present in `.env.example`. |
| **5** | Install dependencies via `npm install` | `npm install` | **Executed in Phase 1** | Generates `package-lock.json` using only approved packages from `.agents/rules/stack.md`. |
| **6** | Run strict TypeScript compiler check | `npm run typecheck` (`tsc --noEmit`) | **Executed in Phase 1** | Validates all 7 strict TypeScript flags from `.agents/rules/code-conventions.md`. |
| **7** | Start development server and verify first load | `npm run dev` | **Pending Phase 2** | Server startup and first-load HTTP capture will be recorded in `evidence/03-server-start.txt` and `evidence/04-first-load.txt` in Phase 2. |

---

## 3. Outstanding Items

- **Phase 2:** Execute live `npm run dev` startup verification and record verbatim stdout in `evidence/03-server-start.txt` and `evidence/04-first-load.txt`, plus document `npx prisma migrate dev` and `npx prisma db seed` verification once the Phase 2 Prisma schema is created.

