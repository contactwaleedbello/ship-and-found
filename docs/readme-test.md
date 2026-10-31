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
| **5** | Install dependencies via `npm install` | `npm install` | **Passed (Phase 1)** | Generates `package-lock.json` (`644` packages) using only approved packages from `.agents/rules/stack.md`. |
| **6** | Validate Prisma schema & generate Prisma Client | `npx prisma validate && npx prisma generate` | **Passed (Phase 2)** | `The schema at prisma/schema.prisma is valid` and `Generated Prisma Client (v5.22.0)` in `254ms`. |
| **7** | Run strict TypeScript compiler check & ESLint | `npm run typecheck && npm run lint` | **Passed (Phases 1–5)** | `0` TypeScript errors across all 7 strict flags and `✔ No ESLint warnings or errors`. |
| **8** | Start development server and verify 29 screens & 27 API routes | `npm run dev` | **Passed (Phases 2–5)** | Server ready in `2.2s` on `http://localhost:3000`; HTTP `200` verified across all 29 screens (Public, Customer, Worker, Owner) and 27 API endpoints in [`evidence/04-first-load.txt`](../evidence/04-first-load.txt), [`evidence/11-db-write-success.txt`](../evidence/11-db-write-success.txt), and [`evidence/16-head-check-3000.txt`](../evidence/16-head-check-3000.txt). |

---

## 3. Diagnostic Reproductions Verified Across All Phases

1. **Nested-Folder / Parent-Directory Execution Check:**
   - Reproduced `npm run dev` failure (`ENOENT: no such file or directory, open '.../package.json'`) when executed from the parent workspace folder in [`evidence/05-nested-folder-error.txt`](../evidence/05-nested-folder-error.txt) and verified the root-directory fix in [`evidence/06-nested-folder-fixed.txt`](../evidence/06-nested-folder-fixed.txt).
2. **Port `3000` Conflict (`EADDRINUSE`) & Resolution:**
   - Reproduced `Error: listen EADDRINUSE: address already in use :::3000` in [`evidence/07-port-conflict.txt`](../evidence/07-port-conflict.txt) and verified clean single-listener resolution in [`evidence/08-port-conflict-resolved.txt`](../evidence/08-port-conflict-resolved.txt).
3. **404 Not Found Boundary & Canonical Route Resolution:**
   - Verified HTTP `404` UI (`"The page you are looking for does not exist."`) and API (`404 NOT_FOUND`) responses on `/devices/dev-nonexistent-id` in [`evidence/09-404-error.txt`](../evidence/09-404-error.txt) and HTTP `200` resolution on `/devices/dev-a15` and `/confirm-price/dev-t490s` in [`evidence/10-404-resolved.txt`](../evidence/10-404-resolved.txt).
4. **Database Write & 24h Reservation Hold:**
   - Verified atomic application submission, stock decrement, and agreement creation in [`evidence/11-db-write-success.txt`](../evidence/11-db-write-success.txt).
5. **Database Failure Simulation & Recovery:**
   - Verified simulated database failure (HTTP 503 degraded response) and clean health check recovery in [`evidence/12-db-connection-failure.txt`](../evidence/12-db-connection-failure.txt) and [`evidence/13-db-connection-recovered.txt`](../evidence/13-db-connection-recovered.txt).
6. **Architecture & Multi-Branch Git Graph:**
   - Verified full working-tree diagram in [`evidence/14-working-tree-diagram.txt`](../evidence/14-working-tree-diagram.txt) and Git log graph in [`evidence/15-git-log-graph.txt`](../evidence/15-git-log-graph.txt).
7. **HTTP HEAD Checks & Security Hardening:**
   - Verified HTTP 200, `x-request-id`, and `x-powered-by` absence in [`evidence/16-head-check-3000.txt`](../evidence/16-head-check-3000.txt) and port 3001 diagnostic check in [`evidence/17-head-check-3001.txt`](../evidence/17-head-check-3001.txt).
8. **Heading-Wrap Defect & Responsive Token Resolution:**
   - Documented narrow viewport overflow reproduction in [`evidence/18-heading-wrap-bad.txt`](../evidence/18-heading-wrap-bad.txt) and responsive CSS resolution in [`evidence/19-heading-wrap-good.txt`](../evidence/19-heading-wrap-good.txt).
9. **3-Width Responsive Layout Audit:**
   - Verified 360px mobile, 900px tablet, and 1200px desktop layouts in [`evidence/20-responsive-360-900-1200.txt`](../evidence/20-responsive-360-900-1200.txt).

