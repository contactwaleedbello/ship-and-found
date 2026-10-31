# Task 4 Defects Log & Remediation History (`docs/defects.md`)

**Workstream**: `task-04-server-security/`  
**Domain**: DG Tech Store (Shop ATF 03)  
**Standard**: Step 10 & 12 (Defect Forensic Documentation)  

---

## Defect Inventory & Diagnostic Summary

| Defect ID | Severity | Category | Description | Root Cause | Architectural Remediation |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **DEF-T4-01** | **CRITICAL** | Security | Defenceless endpoint: Direct curl request bypassed client validation, inserting single-character names into DB. | Missing server-side boundary schema enforcement. | Introduced Zod `serverRegisterSchema` rejecting malformed data with `HTTP 422 Unprocessable Content`. |
| **DEF-T4-02** | **HIGH** | Database | Required column migration failure (`P3006`) when attempting to add `NOT NULL` column to populated table. | Relational engines abort altering populated tables without defaults or values. | Implemented 3-step zero-downtime migration: (1) add nullable, (2) backfill data, (3) enforce required. |
| **DEF-T4-03** | **HIGH** | Security | Verification code replay vulnerability: Same valid 6-digit OTP code accepted multiple times. | Missing consumption state tracking in verification store. | Added atomic `consumedAt` timestamp, returning `HTTP 409 Conflict: Code Already Consumed` on reuse. |
| **DEF-T4-04** | **HIGH** | Architecture | Client/Schema drift error (`P2022: Column does not exist`) causing runtime query crash. | Generating Prisma Client updated TypeScript types without migrating physical database catalog. | Established strict governance: schema edits must execute `npx prisma migrate dev` before client invocation. |
| **DEF-T4-05** | **MEDIUM** | Performance | Synchronous email transmission inside HTTP registration thread caused 947ms latency. | Awaiting remote SMTP TCP/TLS handshakes synchronously inside the HTTP response loop. | Refactored email dispatch to an asynchronous background worker queue (`enqueueEmailJob`), dropping latency to 67ms. |
| **DEF-T4-06** | **CRITICAL** | Cryptography | Fast algorithm vulnerability: Fast hashing (SHA-256) enables billions of guesses/sec on consumer GPUs. | Treating password hashing as a file integrity problem rather than an authentication problem. | Standardized on Argon2id (`m=64MB, t=3, p=4`), forcing attacker work factor penalty of ~46,683x. |
| **DEF-T4-07** | **MEDIUM** | Information | Account enumeration leak: Login route distinguishing between "User not found" and "Incorrect password". | Differentiated error messages disclosing registered email addresses. | Unified login failure response to generic `"Incorrect email or password"` (`HTTP 401 Unauthorized`). |

---

## Detailed Forensic Deep-Dives

### 1. DEF-T4-01: Direct Endpoint Bypass
- **Discovery**: In Task 3 Step 8, executing `curl -i -X POST http://127.0.0.1:3000/api/auth/register -d '{"fullName":"a",...}'` returned `HTTP 201 Created`.
- **Diagnosis**: The server route assumed the browser form had already validated the data. Because curl does not execute browser JavaScript, all 8 client-side rules were ignored.
- **Remediation**: In `app/api/auth/register/route.ts`, the incoming payload is parsed via `serverRegisterSchema.safeParse(rawBody)`. If any domain rule fails, the request is terminated with `HTTP 422` before reaching any backend service.

### 2. DEF-T4-02: Required Column Migration Abort
- **Discovery**: Adding `bvnNumber String` to populated `User` table resulted in Prisma abort: `We found changes that cannot be executed: Step 0 Added the required column bvnNumber without a default value.`
- **Remediation**: Executed the expand-backfill-contract pattern:
  1. Add `bvnNumber String?` $\rightarrow$ Migration `step1_add_bvn_optional`
  2. SQL backfill: `UPDATE "User" SET "bvnNumber" = 'BVN-222' || substr("id", 5) WHERE "bvnNumber" IS NULL;`
  3. Alter `bvnNumber String` $\rightarrow$ Migration `step2_make_bvn_required`

### 3. DEF-T4-03: Verification Code Replay Defect
- **Discovery**: Submitting a previously verified OTP code `749201` a second time within its 10-minute validity window returned `HTTP 200 OK`, allowing potential credential re-hijacking.
- **Remediation**: In `lib/security/otp-service.ts`, the verification function marks `record.consumedAt = Date.now()` upon the first successful validation. Subsequent calls detect `consumedAt !== null` and reject with `HTTP 409 Conflict`.
