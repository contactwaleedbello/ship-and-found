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
| **7** | Run strict TypeScript compiler check & ESLint | `npm run typecheck && npm run lint` | **Passed (Phase 1 & 2)** | `0` TypeScript errors and `✔ No ESLint warnings or errors`. |
| **8** | Start development server and verify first load | `npm run dev` | **Passed (Phase 2)** | Server ready in `2.2s` on `http://localhost:3000`; HTTP `200` verified across all 7 Public & Auth screens and 10 API endpoints in [`evidence/03-server-start.txt`](../evidence/03-server-start.txt) and [`evidence/04-first-load.txt`](../evidence/04-first-load.txt). |

---

## 3. Diagnostic Reproductions Verified in Phase 2

1. **Nested-Folder / Parent-Directory Execution Check:**
   - Reproduced `npm run dev` failure (`ENOENT: no such file or directory, open '.../package.json'`) when executed from the parent workspace folder in [`evidence/05-nested-folder-error.txt`](../evidence/05-nested-folder-error.txt) and verified the root-directory fix in [`evidence/06-nested-folder-fixed.txt`](../evidence/06-nested-folder-fixed.txt).
2. **Port `3000` Conflict (`EADDRINUSE`) & Resolution:**
   - Reproduced `Error: listen EADDRINUSE: address already in use :::3000` in [`evidence/07-port-conflict.txt`](../evidence/07-port-conflict.txt) and verified clean single-listener resolution in [`evidence/08-port-conflict-resolved.txt`](../evidence/08-port-conflict-resolved.txt).
3. **404 Not Found Boundary & Canonical Route Resolution:**
   - Verified HTTP `404` UI (`"The page you are looking for does not exist."`) and API (`404 NOT_FOUND`) responses on `/devices/dev-nonexistent-id` in [`evidence/09-404-error.txt`](../evidence/09-404-error.txt) and HTTP `200` resolution on `/devices/dev-a15` and `/confirm-price/dev-t490s` in [`evidence/10-404-resolved.txt`](../evidence/10-404-resolved.txt).

