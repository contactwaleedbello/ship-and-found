# Identified Defects and Resolution Log (`docs/defects.md`)

Source: [`docs/scaffold-prompt.md`](./scaffold-prompt.md) Sections 6, 7, 12; [`AGENTS.md`](../AGENTS.md).

## 1. Purpose

This document tracks actual repository, configuration, routing, styling, and runtime defects discovered during context inspection, scaffolding, and verification, along with their reproduction steps, severity, status, and resolution evidence. No fabricated defects are logged here; diagnostic scenarios (`evidence/05`–`10` and `18`–`19`) are added only as they are reproduced and verified.

---

## 2. Defect Register

### DEF-01: Skill Folder Naming Mismatch and Leading Whitespace in `.agents/skills/`
- **Phase Identified:** Phase 1 (Mandatory Pre-Implementation Repository Inspection)
- **Severity:** Medium (Breaks deterministic path lookup for `.agents/skills/<skill-name>/SKILL.md`)
- **Description:**
  Root [`AGENTS.md`](../AGENTS.md) lines 157–159 specify three `kebab-case` skill paths:
  - `.agents/skills/build-api-endpoint/SKILL.md`
  - `.agents/skills/build-form-screen/SKILL.md`
  - `.agents/skills/build-list-screen/SKILL.md`
  However, inspecting `/Users/macbookpro/Desktop/Dev & Design To/Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY/.agents/skills/` revealed three directories named with spaces and Title Case, including a leading space on `" Build a form screen"`:
  - `.agents/skills/Build an API endpoint/SKILL.md`
  - `.agents/skills/ Build a form screen/SKILL.md`
  - `.agents/skills/Build a queue or list screen/SKILL.md`
- **Reproduction Details:**
  Running `ls -la ".agents/skills"` prior to Phase 1 Step 1 showed `" Build a form screen"`, `"Build a queue or list screen"`, and `"Build an API endpoint"`, while `test -f .agents/skills/build-api-endpoint/SKILL.md` exited with code `1`.
- **Status:** **Resolved in Phase 1**
- **Resolution & Evidence:**
  Normalized the three directory names to `.agents/skills/build-api-endpoint/SKILL.md`, `.agents/skills/build-form-screen/SKILL.md`, and `.agents/skills/build-list-screen/SKILL.md` in Phase 1 Step 1 while preserving their exact `SKILL.md` contents. Recorded in [`evidence/02-files-created.txt`](../evidence/02-files-created.txt).

---

### DEF-02: Missing `styles/` Directory in `Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY` Prior to Phase 1
- **Phase Identified:** Phase 1 (Mandatory Pre-Implementation Repository Inspection)
- **Severity:** High (Blocks all UI scaffolding under Section 5 Design-System Requirements)
- **Description:**
  [`docs/design-system.md`](./design-system.md) and [`docs/scaffold-prompt.md`](./scaffold-prompt.md) Section 5 require consuming the Task 1 design tokens from `styles/`. At the start of Phase 1, the verified Task 1 `styles/` directory (`fonts.css`, `fonts/*.woff2`, `tokens/index.css`, `tokens/primitives.css`, `tokens/roles.css`) existed only in the sibling repository `/Users/macbookpro/Desktop/Dev & Design To/task-01-design-system/styles/` and had not yet been copied into `Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY/styles/`.
- **Reproduction Details:**
  Running `ls -la "/Users/macbookpro/Desktop/Dev & Design To/Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY/styles"` returned `No such file or directory`.
- **Status:** **Resolved in Phase 1**
- **Resolution & Evidence:**
  Copied `/Users/macbookpro/Desktop/Dev & Design To/task-01-design-system/styles` verbatim into `/Users/macbookpro/Desktop/Dev & Design To/Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY/styles` and verified `0` differences via `diff -rq`. Recorded in [`evidence/02-files-created.txt`](../evidence/02-files-created.txt).

---

### DEF-03: Root-Owned Files in Global `~/.npm/_cacache` and Next.js 14.2.15 Security Advisory During `npm install`
- **Phase Identified:** Phase 1 (`npm install` execution)
- **Severity:** Medium (Blocks default `npm install` cache write and warns on `next@14.2.15` CVE)
- **Description:**
  Running `npm install` failed with `npm error code EACCES / syscall open /Users/macbookpro/.npm/_cacache/index-v5/...` due to root-owned cache entries in the global `~/.npm` directory, and emitted a security advisory deprecation warning on `next@14.2.15` along with an `EBADENGINE` notice when running under host Node `v24.19.0`.
- **Reproduction Details:**
  Running `npm install` against the default `~/.npm` cache exited with code `243` (`EACCES`).
- **Status:** **Resolved in Phase 1**
- **Resolution & Evidence:**
  Updated `package.json` to `"next": "^14.2.35"`, `"eslint-config-next": "^14.2.35"`, and `"engines": { "node": ">=20.0.0" }`, and executed `npm --cache /tmp/dg-npm-cache install` to bypass the corrupted global `~/.npm` cache cleanly.

---

### DEF-04: Prisma CLI `P1012` Environment Lookup and `snake_case` Field Mapping in `prisma/seed.ts`
- **Phase Identified:** Phase 2 (Milestone 1 — Prisma Schema Validation & Seed Script Typecheck)
- **Severity:** Medium (Blocks `npx prisma validate` when only `.env.local` exists and causes TypeScript errors in `prisma/seed.ts`)
- **Description:**
  1. Next.js loads `.env.local` automatically, whereas the Prisma CLI (`prisma validate` / `prisma generate`) reads `.env` by default and threw `Error code: P1012: Environment variable not found: DATABASE_URL` when only `.env.local` was present.
  2. Our initial draft of `prisma/seed.ts` used `camelCase` property names (`settingKey`, `phoneNumber`, `deviceId`) while `prisma/schema.prisma` defines exact PRD Section 5.1 `snake_case` column names (`setting_key`, `phone_number`, `device_id`).
- **Reproduction Details:**
  Running `./node_modules/.bin/prisma validate` exited with code `1` (`P1012`), and `npm run typecheck` reported `TS2353`/`TS2561` on `prisma/seed.ts`.
- **Status:** **Resolved in Phase 2**
- **Resolution & Evidence:**
  Created local untracked `.env` alongside `.env.local` (both ignored by `.gitignore`) so Prisma CLI loads `DATABASE_URL` automatically, and updated `prisma/seed.ts` to use the exact `snake_case` model fields from `prisma/schema.prisma`. Verified with `prisma validate` (`The schema at prisma/schema.prisma is valid 🚀`) and `npm run typecheck` (`0` errors).

---

## 3. Diagnostic Reproductions & Pending UI Verifications

- **Nested-folder execution error & fix** (`evidence/05-nested-folder-error.txt`, `evidence/06-nested-folder-fixed.txt`) — **Reproduced & Verified in Phase 2**.
- **Port conflict (`EADDRINUSE`) & resolution** (`evidence/07-port-conflict.txt`, `evidence/08-port-conflict-resolved.txt`) — **Reproduced & Verified in Phase 2**.
- **Route 404 reproduction & resolution** (`evidence/09-404-error.txt`, `evidence/10-404-resolved.txt`) — **Reproduced & Verified in Phase 2**.
- **Database write success & reservation lock** (`evidence/11-db-write-success.txt`) — **Verified in Phase 3**.
- **Database connection failure & recovery simulation** (`evidence/12-db-connection-failure.txt`, `evidence/13-db-connection-recovered.txt`) — **Verified in Phase 3**.
- **Heading-wrap typography defect & fix** (`evidence/18-heading-wrap-bad.png`, `evidence/19-heading-wrap-good.png`) — Planned for Phase 5.

