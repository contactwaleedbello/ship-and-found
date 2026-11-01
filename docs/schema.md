# Database Schema Design & Physical Architecture (`docs/schema.md`)

**Workstream**: `task-04-server-security/`  
**Domain**: DG Tech Store (Shop ATF 03) &mdash; Device Inventory & Flexi-Pay Platform  
**Location**: Shop ATF 03, Banex Plaza, Wuse 2, Abuja, Nigeria  
**Governing Standard**: Step 1 (Physical Schema Design & Money Auditing)  

---

## 1. Executive Summary & Architectural Overview

The DG Tech Store backend relies on a strictly typed, relational database architecture where **the server is the absolute single source of truth**. Rather than relying on client forms or external intermediaries, the server enforces structural invariants, data integrity constraints, foreign key referential integrity (`onDelete: Restrict`), and audit immutability.

Per Step 1 of the specification, the schema incorporates five foundational tables:
1. **`User`**: System actors (Customers, Store Workers, Store Owners/Executives) with strict role segregation, cryptographic hashes, and encryption at rest.
2. **`Session`**: Explicit server-managed authentication sessions enabling deterministic invalidation and multi-device management.
3. **`Payment`**: Finalized, settled financial ledger entries representing actual money collected.
4. **`PaymentAttempt`**: Immutable telemetry and audit trail of every checkout attempt (initiated, dropped on bad network, gateway timeout, or bank switch failure).
5. **`KnowledgeChunk`**: Text segmentation and vector retrieval chunks for the device catalog and hire-purchase policy retrieval system.

---

## 2. Table-by-Table Architectural Specification

### Table 1: `User` (People who use the system)

Stores authenticated identities across all retail and management personas.

| Column | Type | Nullable | Constraints / Default | Purpose & Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` (UUID) | **No** | `@id @default(uuid())` | Primary key identifier. |
| `fullName` | `String` | **No** | None | Full legal customer/worker name per BVN/NIN verification. |
| `phoneNumber` | `String` | **No** | `@unique` | Nigerian phone number in strict E.164 format (`+234...`). |
| `email` | `String` | **No** | `@unique` | Contact email, strictly lowercased at server boundary. |
| `passwordHash` | `String` | **No** | None | Argon2id slow cryptographic password hash with unique per-user salt. |
| `role` | `String` | **No** | `@default("CUSTOMER")` | System role: `CUSTOMER`, `STORE_WORKER`, `OWNER`. |
| `ninEncrypted` | `String` | Yes | None | AES-256-GCM encrypted National Identification Number. |
| `isVerified` | `Boolean` | **No** | `@default(false)` | Flag indicating successful cryptographic OTP verification. |
| `emailVerifiedAt` | `DateTime` | Yes | None | Timestamp of completed email verification. |
| `createdAt` | `DateTime` | **No** | `@default(now())` | Registration timestamp. |
| `updatedAt` | `DateTime` | **No** | `@updatedAt` | Record update timestamp. |

- **Relationships**:
  - `sessions`: One-to-Many (`1:N`) with `Session`.
  - `payments`: One-to-Many (`1:N`) with `Payment`.
  - `paymentAttempts`: One-to-Many (`1:N`) with `PaymentAttempt`.
- **Indices & Write Costs**:
  - `@@unique([email])`: Accelerates credential lookups during login from $O(N)$ table scans to $O(\log N)$ B-tree lookups. **Write Cost**: Requires updating the B-tree index on every user registration; negligible given write frequency.
  - `@@unique([phoneNumber])`: Accelerates customer identification and SMS dispatch lookups. **Write Cost**: Slight index maintenance overhead on creation.
  - `@@index([role])`: Optimizes administrative filtering for staff queues and owner audits. **Write Cost**: Incremental B-tree node rebalancing on role changes.

---

### Table 2: `Session` (Active user authentication sessions)

Maintains active user sessions with explicit lifetime boundaries and revocation capability.

| Column | Type | Nullable | Constraints / Default | Purpose & Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` (UUID) | **No** | `@id @default(uuid())` | Session primary key. |
| `sessionToken` | `String` | **No** | `@unique` | 64-character high-entropy cryptographic token. |
| `userId` | `String` | **No** | Foreign Key | References `User.id` (`onDelete: Restrict`). |
| `ipAddress` | `String` | **No** | None | Client IP address at session creation. |
| `userAgent` | `String` | **No** | None | Browser/device user agent string. |
| `expiresAt` | `DateTime` | **No** | None | Hard expiry timestamp (e.g., 7 days rolling). |
| `revokedAt` | `DateTime` | Yes | None | Timestamp of administrative or user logout revocation. |
| `createdAt` | `DateTime` | **No** | `@default(now())` | Creation timestamp. |

- **Relationships**:
  - `user`: Many-to-One (`N:1`) with `User`.
- **Indices & Write Costs**:
  - `@@unique([sessionToken])`: Mandatory for authenticating incoming API bearer tokens in sub-millisecond time. **Write Cost**: B-tree update on session creation and deletion.
  - `@@index([userId])`: Allows fast enumeration and bulk revocation ("Log out of all devices") without scanning entire session table. **Write Cost**: Moderate, as sessions are created upon every login.

---

### Table 3: `Payment` (The finalized money ledger)

Represents irreversible, cleared financial transactions. No row enters this table unless verified by gateway webhook signature or physical in-store POS bank receipt.

| Column | Type | Nullable | Constraints / Default | Purpose & Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` (UUID) | **No** | `@id @default(uuid())` | Transaction ledger primary key. |
| `paymentReference` | `String` | **No** | `@unique` | Internal unique reference (`DG-PAY-YYYYMMDD-XXXX`). |
| `paymentAttemptId` | `String` | **No** | `@unique`, Foreign Key | References originating `PaymentAttempt.id`. |
| `userId` | `String` | **No** | Foreign Key | References paying `User.id` (`onDelete: Restrict`). |
| `deviceId` | `String` | **No** | None | Inventory device SKU/ID being purchased. |
| `amountNaira` | `Int` | **No** | None | Transaction value represented in **whole Naira (₦)** as integer to eliminate floating-point rounding errors. |
| `paymentType` | `String` | **No** | None | Type: `DOWN_PAYMENT` (initial flexi-pay) or `BALANCE_PAYMENT`. |
| `gatewayReference` | `String` | **No** | None | External settlement reference (Paystack / Flutterwave / NIBSS transaction ID). |
| `receiptNumber` | `String` | **No** | `@unique` | Sequential fiscal tax invoice number (`DG-REC-XXXX`). |
| `settledAt` | `DateTime` | **No** | None | Exact timestamp when funds cleared merchant account. |
| `createdAt` | `DateTime` | **No** | `@default(now())` | Ledger record creation timestamp. |

- **Relationships**:
  - `user`: Many-to-One (`N:1`) with `User`.
  - `attempt`: One-to-One (`1:1`) with `PaymentAttempt`.
- **Indices & Write Costs**:
  - `@@unique([paymentReference])`: Guarantees idempotency and prevents double-crediting. **Write Cost**: Low write frequency (only completed purchases), critical consistency protection.
  - `@@unique([receiptNumber])`: Tax auditing index.
  - `@@index([userId, settledAt])`: Accelerates customer billing statements and chronological account reconciliations.

---

### Table 4: `PaymentAttempt` (The money-attempts table)

Captures all transaction attempts, including failures, timeouts, abandoned carts, and bad-network drops.

| Column | Type | Nullable | Constraints / Default | Purpose & Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` (UUID) | **No** | `@id @default(uuid())` | Attempt tracking identifier. |
| `attemptReference` | `String` | **No** | `@unique` | Pre-generation tracking reference (`DG-ATT-XXXX`). |
| `userId` | `String` | **No** | Foreign Key | References initiating `User.id`. |
| `deviceId` | `String` | **No** | None | Targeted device ID. |
| `intendedAmountNaira` | `Int` | **No** | None | Amount intended to be paid in whole Naira. |
| `channel` | `String` | **No** | None | Channel: `CARD`, `BANK_TRANSFER`, `USSD`, `IN_STORE_POS`. |
| `status` | `String` | **No** | None | Status: `INITIATED`, `GATEWAY_TIMEOUT`, `NETWORK_DROPPED`, `INSUFFICIENT_FUNDS`, `ABANDONED`, `COMPLETED`. |
| `gatewayErrorCode` | `String` | Yes | None | Raw error string from gateway (e.g., `ERR_504_TIMEOUT`). |
| `gatewayErrorMessage` | `String` | Yes | None | Human-readable error message returned by banking switch. |
| `ipAddress` | `String` | **No** | None | IP address of initiating client. |
| `startedAt` | `DateTime` | **No** | `@default(now())` | Checkout initialization timestamp. |
| `endedAt` | `DateTime` | Yes | None | Terminal state timestamp. |

- **Relationships**:
  - `user`: Many-to-One (`N:1`) with `User`.
  - `payment`: Optional One-to-One (`1:1`) with `Payment`.
- **Indices & Write Costs**:
  - `@@unique([attemptReference])`: Accelerates webhook correlation.
  - `@@index([status, startedAt])`: Enables real-time telemetry on payment drop-off funnels and network failure spikes across telecom networks (MTN, Airtel, Glo).

---

### Table 5: `KnowledgeChunk` (Retrieval / RAG chunks)

Houses segmented knowledge base documents and hire-purchase terms for vector similarity search.

| Column | Type | Nullable | Constraints / Default | Purpose & Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` (UUID) | **No** | `@id @default(uuid())` | Chunk identifier. |
| `documentTitle` | `String` | **No** | None | Title of source document (e.g., "Banex Flexi-Pay Terms 2026"). |
| `sourceUrl` | `String` | **No** | None | Path or URL to source document. |
| `chunkIndex` | `Int` | **No** | None | Zero-based sequential position within the document. |
| `content` | `String` | **No** | None | Extracted text block (typically 200–500 tokens). |
| `tokenCount` | `Int` | **No** | None | Word/token length for context window budgeting. |
| `embeddingJson` | `String` | Yes | None | Serialized vector array (768 or 1536 float values). |
| `createdAt` | `DateTime` | **No** | `@default(now())` | Ingestion timestamp. |

- **Relationships**: Standalone retrieval entity.
- **Indices & Write Costs**:
  - `@@index([documentTitle, chunkIndex])`: Optimizes chunk reconstruction and filtering by policy section. **Write Cost**: Only incurred during background knowledge ingestion.

---

## 3. Data Duplication Analysis & Trade-Off Defense

### Where the Same Fact is Stored Twice:
1. **Device Price & Amount**: `Payment.amountNaira` stores the exact amount paid at settlement time, even though `Inventory.lockedPriceNaira` or `Device.basePrice` records the retail price.
   - **Defense**: Storing this fact redundantly is mandatory under accounting immutability. Retail device prices fluctuate daily based on USD/NGN parallel exchange rates at Banex Plaza. The ledger must record the exact contractual snapshot agreed upon at the moment of payment, unaffected by future catalog price edits.
2. **User Identity on Payment & Attempt**: `userId` is present on both `Payment` and `PaymentAttempt`, even though `Payment` links directly to `PaymentAttempt`.
   - **Defense**: Denormalizing `userId` onto `Payment` eliminates expensive multi-table JOINs across hundreds of thousands of historical attempts during monthly customer account reconciliation queries, ensuring $O(1)$ relational lookups.

---

## 4. The Two Reasons for the `PaymentAttempt` Table

Most novice systems only build the `Payment` table, discarding failed attempts. In enterprise retail, the `PaymentAttempt` table is mandatory for two distinct reasons:

1. **Drop-Off Telemetry & Conversion Optimization**:
   - In the Nigerian retail context, over 30% of card and transfer attempts fail due to banking switch downtime (NIBSS inter-bank delays, USSD timeouts, telecom packet loss).
   - Drop-off data tells the business exactly where customers abandon the purchase funnel. If 100 users initiate checkout for the Samsung Galaxy A15 but 42 terminate at `GATEWAY_TIMEOUT` on USSD, management knows the defect lies with the banking partner rather than customer hesitation.

2. **The Source of Truth for Tax Authorities, Litigation, and Inquiries**:
   - In financial investigations and tax audits, proving what **did not** clear is just as vital as proving what did.
   - Fraudsters frequently present SMS debit alerts or bank screenshots claiming "I was debited ₦176,250 for this iPhone 13," demanding the store worker hand over the device.
   - If the business only kept a `Payment` table, staff could only say "we don't see it." With `PaymentAttempt`, the system proves: *"At 14:22:05, attempt `DG-ATT-8891` was initiated; our gateway received code `ERR_501_INSUFFICIENT_FUNDS` from your bank at 14:22:12; no funds entered our merchant account."*

### What We Would Do if the Tax Authority Asked for a Transaction from 14 Months Ago:
> If the Federal Inland Revenue Service (FIRS) or state revenue board audited DG Tech Store and requested accounting for a specific transaction from 14 months ago (e.g., Reference `DG-PAY-20250912-8821`), we would:
> 1. Query the immutable `Payment` ledger by `receiptNumber` or `paymentReference` to pull the exact settlement record, including `settledAt` timestamp, `amountNaira`, and the external banking switch `gatewayReference`.
> 2. Cross-reference the associated `PaymentAttempt` (`paymentAttemptId`) to establish the originating customer IP, timestamp of initiation, and channel used.
> 3. Provide the corresponding bank settlement batch ID from our merchant processor matching the exact `gatewayReference`, demonstrating that the funds cleared into our corporate account and were recognized under that fiscal quarter's VAT and Companies Income Tax (CIT) filings.
> 4. Export the immutable audit log trail (`AuditLog`) proving that the record has not been updated, backdated, or tampered with since creation.

