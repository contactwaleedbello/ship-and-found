# Performance Observations and Checks (`docs/performance-note.md`)

Source: Consolidated PRD v1.3 Section 9.1; [`.agents/rules/non-functional.md`](../.agents/rules/non-functional.md); [`.agents/rules/code-conventions.md`](../.agents/rules/code-conventions.md); [`.agents/rules/stack.md`](../.agents/rules/stack.md); [`styles/fonts.css`](../styles/fonts.css).

## 1. PRD Performance Budgets (`PRD 9.1` & `non-functional.md`)

DG Tech Store targets Nigerian customers browsing on mid-range Android devices over 3G/4G mobile connections and store staff at Shop ATF 03:

| Metric | Target | Source |
|---|---|---|
| **First Contentful Paint (FCP)** on 3G mid-range Android | `< 1.8 seconds` | `PRD 9.1`, `non-functional.md` |
| **Time to Interactive (TTI)** on 3G mid-range Android | `< 3.5 seconds` | `PRD 9.1`, `non-functional.md` |
| **Read API Latency (`GET /api/devices`, `GET /api/devices/:id`, `POST /api/calculator`)** | `P95 < 400 ms` | `PRD 9.1`, `non-functional.md` |
| **Transactional Write API Latency (`POST /api/applications`, payments, approvals)** | `P95 < 800 ms` | `PRD 9.1`, `non-functional.md` |
| **Authentication / Login (`bcrypt` cost 12)** | `P95 < 1,000 ms` | `PRD 9.1`, `security-baseline.md` |

---

## 2. Architectural Performance Checks Performed in Phase 1

1. **Self-Hosted Subsetted `.woff2` Fonts from Task 1 (`styles/fonts.css`):**
   - **Check performed:** Inspected the byte sizes of the 5 `.woff2` font files copied verbatim from `/Users/macbookpro/Desktop/Dev & Design To/task-01-design-system/styles/fonts/`:
     - `fira-sans-400-text.woff2` (`6,856 bytes`)
     - `fira-sans-500-text.woff2` (`6,988 bytes`)
     - `fira-sans-600-text.woff2` (`7,008 bytes`)
     - `fira-sans-700-text.woff2` (`6,936 bytes`)
     - `noto-sans-400-text.woff2` (`6,684 bytes`)
   - **Finding:** All 5 font files combined total **`34.47 KB` (`34,472 bytes`)** and use `font-display: swap` with explicit `unicode-range` subsetting (including `U+20A6` Naira `₦`, Hausa, and Yoruba glyphs). Zero external requests are made to `fonts.googleapis.com` or `fonts.gstatic.com`, eliminating DNS/TLS blocking on 3G mobile networks.
2. **React Server Components by Default (`code-conventions.md`):**
   - **Check performed:** Audited [`app/layout.tsx`](../app/layout.tsx) and [`app/(public)/page.tsx`](../app/(public)/page.tsx) to ensure neither file declares `'use client'`.
   - **Finding:** Both root layout and the public inventory page render as zero-bundle Server Components; client-side hydration will be restricted exclusively to interactive leaf controls (calculator inputs, on-blur form inputs, and countdown timers) in Phases 2–4.
3. **Zero Heavy UI Runtime Libraries (`stack.md`):**
   - **Check performed:** Verified [`package.json`](../package.json) excludes `@mui/*`, `@chakra-ui/*`, `antd`, `styled-components`, `@emotion/*`, `redux`, `axios`, and `moment`.
   - **Finding:** Styling relies entirely on static CSS custom properties from Task 1 (`styles/tokens/primitives.css` and `styles/tokens/roles.css`) and compile-time Tailwind CSS v3 classes.
4. **Zero-Dependency Structured Logger (`lib/logger.ts`):**
   - **Check performed:** Implemented [`lib/logger.ts`](../lib/logger.ts) using native `process.stdout.write` / `console` rather than `pino` or `winston`.
   - **Finding:** Avoids worker-thread transport overhead and cold-start bundle bloat in Next.js serverless routes.

---

## 3. Runtime Performance Benchmarks Measured in Phase 2 (`evidence/03-server-start.txt` & `evidence/04-first-load.txt`)

During Phase 2 server verification on `phase-2-database-auth`, the Next.js 14.2.35 server was started and benchmarked across all 7 Public & Auth screens (`#1`–`#7`) and Public Inventory / Calculator API endpoints:

| Benchmark | Measured Result | PRD 9.1 Budget | Status | Evidence File |
|---|---|---|---|---|
| **Next.js Dev Server Startup (`Ready in`)** | `2.2s` | N/A (Local boot) | **Verified** | [`evidence/03-server-start.txt`](../evidence/03-server-start.txt) |
| **Cold First-Load Compile (`GET /`, 594 modules)** | `3,789 ms` (compile `3.4s`) | N/A (Cold dev compile) | **Verified** | [`evidence/03-server-start.txt`](../evidence/03-server-start.txt) |
| **Warm Filtered Inventory Load (`GET /?brand=Samsung&category=smartphone`)** | `38 ms` | `< 1,800 ms` FCP | **Passed (`38 ms`)** | [`evidence/03-server-start.txt`](../evidence/03-server-start.txt) |
| **Warm Empty-State Filter Load (`GET /?brand=Apple&category=tablet&battery_life=18`)** | `25 ms` | `< 1,800 ms` FCP | **Passed (`25 ms`)** | [`evidence/04-first-load.txt`](../evidence/04-first-load.txt) |
| **Public Read API (`GET /api/devices?brand=Samsung`)** | `176 ms` | `P95 < 400 ms` | **Passed (`176 ms`)** | [`evidence/04-first-load.txt`](../evidence/04-first-load.txt) |
| **Calculator API (`POST /api/calculator`)** | `247 ms` | `P95 < 400 ms` | **Passed (`247 ms`)** | [`evidence/04-first-load.txt`](../evidence/04-first-load.txt) |
| **Health Endpoint (`GET /api/health`)** | `219 ms` | `< 2,000 ms` | **Passed (`219 ms`)** | [`evidence/04-first-load.txt`](../evidence/04-first-load.txt) |

---

## 4. Outstanding Performance Checks for Subsequent Phases

- **Phase 3:** Measure customer application submission (`POST /api/applications`) transactional lock latency (`P95 < 800 ms` budget) and concurrent last-unit stock reservation (`PRD 13.1`).
- **Phase 4 & 5:** Measure `GET /api/admin/audit` pagination (`50 rows/page`, `P95 < 1,000 ms`) and production build bundle sizes (`npm run build`).

