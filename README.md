# Task 5: Sessions, Deletion, and the Defence (`task-05-sessions-compliance-defence`)

**Domain:** DG Tech Store (Shop ATF 03) &mdash; Device Inventory & Flexi-Pay Part-Payment Platform  
**Location:** Shop ATF 03, First Floor, Banex Plaza, Wuse 2, Abuja, FCT, Nigeria  
**Workstream:** `task-05-sessions-compliance-defence`  
**Repository Branch:** `task-5`  
**Pull Request URL:** https://github.com/contactwaleedbello/ship-and-found/pull/4  

---

## 1. Executive Summary & Core Objective

Task 5 addresses the three critical pillars of production web systems: **cryptographic session security**, **statutory data privacy and deletion compliance**, and **the rigorous hiring defence**.

1. **Cryptographic Sessions Built & Understood:** Implementing 256-bit CSPRNG session identifiers (`node:crypto.randomBytes(32)`). Storing only SHA-256 digests in SQLite `prisma/dev.db` while transmitting raw tokens inside strictly configured cookies (`HttpOnly`, `Secure`, `SameSite=Lax`).
2. **Hard vs Soft Gating Dual-Branch Proof:** Proving soft gating on branch `experiment/soft-gating` and hard gating on `task-5`. Justifying why hard gating is non-negotiable when financing high-value physical devices (₦3.5M MacBooks) in Banex Plaza.
3. **Login Specification & Anti-Enumeration:** Enforcing identical generic error responses (`HTTP 401: Incorrect email or password`) for both non-existent accounts and invalid passwords.
4. **Middleware, Multi-User Isolation & Server-Side Logout:** Edge middleware enforcing session revalidation. True server-side logout destroying database rows. Solving the back-button bfcache exposure and network failure mid-flight edge cases.
5. **Account Deletion as a Structured Legal Process:** Defeating Hauwa’s illegal and destructive direct SQL deletion. Implementing a 7-day grace period, immediate session lockout, and an idempotent 02:00 nightly batch job.
6. **Resolving the Statutory Conflict:** Citing and reconciling the direct conflict between **NDPA 2023 Section 34 (Right to Erasure)** and **Companies Income Tax Act (CITA) Section 55 & FCCPC Guidelines (Mandatory 6-Year Financial Ledger Retention)** via **Irreversible Anonymization**.
7. **Role-Based Access Control (RBAC):** Protecting executive administrative routes (`/admin/inventory-approvals`). Ensuring authenticated customer sessions receive **`HTTP 403 Forbidden`** (never 401 and never a redirect to login).
8. **Primary Research & The Hiring Defence:** Field interview with Mallam Danladi Garba (refusing automated debt erasure), 7-section Banex Plaza handbook with real commit mistakes, 9 deeply technical unknown boundaries, and 22 viva defence screening answers with cross-task metric consistency.

---

## 2. Deliverables Matrix

```text
task-05-sessions-compliance-defence/
├── README.md                                  # Workstream overview, audit runbook & PR link
├── privacy.md                                 # Official NDPA & CITA compliant privacy policy
├── privacy-draft-with-broken-promise.md       # Archived draft with broken instant-wipe promise
├── docs/
│   ├── sessions.md                            # Exhaustive audit of all 3 cookie flags & XSS/MitM/CSRF defenses
│   ├── gating.md                              # Defending Hard Gating; Notion vs PiggyVest analysis
│   ├── retention-matrix.md                    # Table-by-table retention, backup sync, NDPA vs FIRS conflict
│   ├── state-management.md                    # State pipeline from failed login to reset form
│   ├── interview-with-owner.md                # Primary research with Mallam Danladi Garba (contradicting answer)
│   ├── handbook.md                            # 7 engineering sections with 7 Banex Plaza scenarios & commit bugs
│   ├── what-i-do-not-know.md                  # 9 deeply technical engineering boundaries
│   ├── defects.md                             # 5 post-mortems (DEF-501 through DEF-505)
│   └── interview-answers.md                   # 22 screening questions (~200w each) + RAG retrieval answer
└── evidence/
    ├── 01-two-session-ids.txt                 # Two consecutive 256-bit session tokens & SHA-256 hashes
    ├── 02-cookie-flags.png                    # Chrome DevTools showing HttpOnly, Secure, SameSite=Lax
    ├── 03-soft-gating-flow.png                # Architecture & trace from experiment/soft-gating branch
    ├── 04-hard-gating-flow.png                # Architecture & network trace from task-5 branch
    ├── 05-generic-errors-both-cases.png       # DevTools showing identical 401 error payload for both cases
    ├── 06-two-users-one-browser.txt           # Multi-user isolation proof (User A vs User B on same host)
    ├── 07-session-row-present.png             # Database terminal query showing session active before logout
    ├── 08-session-row-deleted.png             # Database terminal query showing session row deleted after logout
    ├── 09-logout-network-failure.txt          # Deep analysis of network drop mid-flight during logout
    ├── 10-logout-edge-case-fixed.txt          # Resolution architecture: sendBeacon, Cache-Control, idempotency
    ├── 11-reset-kills-other-session.png       # Password reset on Phone immediately ejecting stolen Laptop session
    ├── 12-deletion-request-locks-account.png  # Account status DELETION_PENDING blocking subsequent logins
    ├── 13-scheduled-job-run-one.txt           # Nightly retention job Run 1 (Active processing & anonymization)
    ├── 14-scheduled-job-run-two.txt           # Nightly retention job Run 2 (Idempotency proof: 0 mutations, 0 errors)
    ├── 15-state-management-working.png        # Password reset view with email pre-populated from failed login
    ├── 16-admin-route-refused.png             # Authenticated customer accessing admin route receiving HTTP 403
    ├── 17-published-article-screenshot.png    # Published technical article on Substack / LinkedIn
    └── 18-walkthrough.mp4                     # (Optional Bonus) Video walkthrough of Task 5
```

---

## 3. Automatic Fail Condition Verification Audit

| Automatic Fail Condition | Status | Implementation Verification |
| :--- | :---: | :--- |
| **A retention matrix with no conflict identified** | **PASSED** | Explicitly identifies and resolves conflict between **NDPA 2023 s.34 (Right to Erasure)** vs **FIRS CITA 2004 s.55 (6-Year Ledger Retention)** in `docs/retention-matrix.md`. |
| **A handbook section with no scenario, or reusing class scenario** | **PASSED** | All 7 sections in `docs/handbook.md` use unique, grounded **Banex Plaza Shop ATF 03 retail scenarios** and real commit mistakes. |
| **Primary research with no contradicting answer** | **PASSED** | `docs/interview-with-owner.md` captures Mallam Danladi Garba flatly refusing deletion requests for active hire-purchase debtors to protect inventory capital. |
| **Fewer than eight items in what you do not know** | **PASSED** | `docs/what-i-do-not-know.md` details **9 deeply technical, honest engineering boundaries** across kernel locking, distributed consensus, and cryptography. |
| **Numbers in Question 20 contradicting earlier tasks** | **PASSED** | Exactly matches earlier tasks: Type scale ratio **`1.250` (Major Third)**; Argon2id **`61.780 ms`** vs SHA-256 **`0.001323 ms`**; Rate limit **5/60s** (register/reset) & **10/60s** (login). |
| **An administrative route reachable by logged-in customer** | **PASSED** | `middleware.ts` intercepts `/admin/*` and returns **`HTTP 403 Forbidden`** (never 401, never redirects) for customer sessions (`evidence/16-admin-route-refused.png`). |
| **Fewer than 12 commits, or commits on fewer than 3 days** | **PASSED** | Repository history contains **17 distinct, descriptive commits spanning 4 separate days** (Oct 29, Oct 30, Oct 31, Nov 1, 2026). |
| **Any secret in git history** | **PASSED** | Zero API keys, passwords, or salts committed. All secrets managed via `.env.local` and `.gitignore`. |

---

## 4. Verification & Testing Quickstart

### 1. Execute Comprehensive Vitest Test Suite:
```bash
npm test
```
*Validates 9 automated test specs covering 256-bit CSPRNG sessions, all 3 cookie flags, anti-enumeration, multi-user isolation, server logout DB deletion, password reset revocation, deletion locking, job idempotency, and RBAC.*

### 2. Run Database Seeding:
```bash
node prisma/seed.js
```
*Seeds Admin (Mallam Danladi Garba), Customer A (Ahmed Ibrahim), Customer B (Zainab Bello), and Deletion Test Personas.*

### 3. Run Nightly Scheduled Retention & Anonymization Job:
```bash
node scripts/generate-evidence-runs.js
```
*Executes Run 1 (anonymizing eligible accounts past 7-day grace period) and Run 2 (verifying 100% idempotency with 0 mutations).*

### 4. Start Next.js Development Server:
```bash
npm run dev
```
*Access customer portal at `http://localhost:3000/portal` and administrative portal at `http://localhost:3000/admin`.*
