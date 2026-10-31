# Task 4: The Server is the Source of Truth (`task-04-server-security`)

**Domain**: DG Tech Store (Shop ATF 03) &mdash; Device Inventory & Flexi-Pay Part-Payment Platform  
**Location**: Shop ATF 03, Banex Plaza, Wuse 2, Abuja, Nigeria  
**Workstream**: `task-04-server-security`  
**Repository Branch**: `task-4`  

---

## 1. Executive Summary & Core Objective

Task 4 establishes that **the server is the absolute single source of truth**. While Task 3 demonstrated that client-side validation is merely an ergonomic convenience easily bypassed by automated tools and raw HTTP requests, Task 4 closes that vulnerability with defense-in-depth:
1. **Schema Design & Audit Immutability**: 5-table relational architecture including the `PaymentAttempt` drop-off telemetry table and the 14-month tax audit defense.
2. **Controlled, Deliberate Migrations**: Demonstrating the initial migration, capturing the required-column migration abort on populated data, executing the 3-step zero-downtime expand-backfill-contract pattern, and diagnosing intentional client/schema drift.
3. **Slow Password Hashing (Argon2id)**: Machine-measured hardware benchmarks proving why fast algorithms (SHA-256 at $1.32\ \mu\text{s}$) fail against brute-force attacks, while memory-hard algorithms (Argon2id at $61.78\text{ ms}$) shift the computational cost entirely onto the attacker.
4. **Boundary Schema Validation (Zod)**: Enforcing all domain rules at the server boundary. Direct curl attacks that bypassed Task 3 are now rejected with `HTTP 422 Unprocessable Content`.
5. **Rate Limiting & Proof of Defeat**: Sliding-window rate limiting on authentication routes, triggering `HTTP 429 Too Many Requests`, and demonstrating how rotating client IP headers defeats IP-only throttling.
6. **Breached Password Protection (k-Anonymity)**: Verifying compromised credentials against HaveIBeenPwned via 5-character SHA-1 prefix range queries without ever sending the cleartext password or full hash.
7. **Asynchronous Email Verification**: Cryptographic 6-digit code generation (`crypto.randomInt`), 10-minute expiry window, replay defect prevention (`HTTP 409`), and non-blocking background queue dispatch (dropping HTTP latency from 947ms to 67ms).

---

## 2. Deliverables Matrix

```text
task-04-server-security/
├── README.md                                  # Workstream overview & verification instructions
├── docs/
│   ├── schema.md                              # 5 tables, write costs, and 14-month tax audit defense
│   ├── migrations.md                          # Forward-only migrations, why never edit, and human rule
│   ├── hashing.md                             # Hardware benchmarks (61.78ms vs 0.0013ms) and arithmetic
│   ├── validation-placement.md                # Request lifecycle placement and schema vs. manual handlers
│   ├── rate-limiting.md                       # Multi-keying, counter storage trade-offs, and shared NAT
│   ├── breach-check.md                        # k-Anonymity prefix range queries vs. naive leaks
│   ├── verification-design.md                 # Cryptographic PRNG, 10-minute expiry, and replay defense
│   ├── email-copy.md                          # Task 1 token styling and customer copy critique
│   ├── not-implemented.md                     # 5 intentional security control deferrals with rationale
│   ├── defects.md                             # 7 identified defects, root causes & remediations
│   └── interview-answers.md                   # 19 detailed viva defence answers + viva preparation
└── evidence/
    ├── 01-schema-drawing.jpg                  # Architectural schema diagram of 5 core tables
    ├── 02-database-state-before.png           # Inspector discovery of uninitialized database state
    ├── 03-initial-migration.txt               # Initial Prisma migration command and terminal output
    ├── 04-required-column-failure.txt         # Captured migration failure on populated table
    ├── 05-required-column-three-steps.txt     # Expand -> backfill -> contract 3-step migration output
    ├── 06-drift-error.txt                     # Intentional client/schema drift error (P2022) & fix
    ├── 07-hash-twice-different.txt            # Argon2id identical password salt collision proof
    ├── 08-timing-argon-vs-sha.txt             # Real hardware timing benchmark numbers & arithmetic
    ├── 09-email-case-normalised.png           # Uppercase email registration logging in with lowercase
    ├── 10-password-trim-working.png           # Trailing space trimmed while preserving character case
    ├── 11-validation-timing.txt               # Microsecond latency benchmark before vs after Zod
    ├── 12-direct-request-before-and-after.txt # Side-by-side: Task 3 bypass (201) vs Task 4 refusal (422)
    ├── 13-rate-limit-triggered.png            # Captured HTTP 429 Too Many Requests response
    ├── 14-rate-limit-defeated.txt             # Proof of defeating IP-only limit via header rotation
    ├── 15-breach-check-rejection.png          # Compromised password rejected via k-Anonymity
    ├── 16-smtp-failure.txt                    # Standard password SMTP authentication failure log
    ├── 17-smtp-success.txt                    # App-password SMTP delivery success verification
    ├── 18-registration-timing-sync-vs-job.txt # Sync email (947ms) vs background job (67ms) benchmark
    ├── 19-verification-row.png                # Database row inspection of generated 6-digit OTP code
    ├── 20-verification-expired.png            # Failure Case 1: Expired code rejection (HTTP 410)
    ├── 21-verification-wrong-code.png         # Failure Case 2: Incorrect code rejection (HTTP 400)
    ├── 22-verification-code-reused.png        # Failure Case 3: Code reuse replay defect prevented (HTTP 409)
    └── 23-rendered-email.png                  # Brand email adhering strictly to Task 1 design tokens
```

---

## 3. Quickstart & Verification Commands

### 1. Static Verification (0 Errors Guaranteed)
```bash
cd "task-04-server-security"
npm run typecheck
npm run lint
```

### 2. Reproduce the Direct Request Refusal (Step 7)
Send the raw curl request that bypassed Task 3:
```bash
curl -i -X POST http://127.0.0.1:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"a","phoneNumber":"+2348039988771","email":"attacker@domain.com","password":"password123","termsAccepted":true}'
```
Observe **`HTTP/1.1 422 Unprocessable Content`** returning structured validation issues rejecting single-character names.

### 3. Reproduce Hardware Hashing Benchmark (Step 4)
```bash
node scripts/benchmark.js
```
Executes Argon2id vs SHA-256 on your local hardware and outputs execution metrics.

### 4. Run Full Integration Suite (Steps 6, 7, 8, 10)
```bash
node scripts/run_task4_tests.js
```
Executes the direct attack, latency measurement, rate limit lockout (429) & IP bypass, and sync vs background job benchmarks.
