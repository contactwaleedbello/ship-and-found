# Data Retention, Erasure & Compliance Matrix

**Application:** DG Tech Store (Shop ATF 03, Banex Plaza, Wuse 2, Abuja)  
**Document:** `docs/retention-matrix.md`  
**Task:** Task 5 — Step 5: Account Deletion as a Legal Process  

---

## 1. Schema-Wide Data Retention & Processing Matrix

Every table and column in `prisma/schema.prisma` is classified below, detailing its retention duration, legal basis under Nigerian law, and the exact processing behavior applied during an account deletion request.

### Table 1: `User` (Customer & Administrative Accounts)

| Column Name | Data Type | Retention Period | Legal Basis | Action at Account Deletion | Justification & Safeguards |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `String (UUID)` | Permanent | FIRS CITA s.55 (Accounting ledger primary key) | **PRESERVED** | Preserved as synthetic relational anchor for immutable payment foreign keys (`Payment.userId`). |
| `fullName` | `String` | Duration of account + 7-day grace period | NDPA 2023 s.24(1)(a) (Performance of contract) | **ANONYMISED** | Overwritten with `'REDACTED_ANONYMIZED_CUSTOMER'`. Eliminates personal identity. |
| `phoneNumber` | `String` | Duration of account + 7-day grace period | NDPA 2023 s.24(1)(a) | **ANONYMISED** | Replaced with synthetic non-routable dummy string (e.g. `+2340000000XXX`). Prevents contact. |
| `email` | `String` | Duration of account + 7-day grace period | NDPA 2023 s.24(1)(a) | **ANONYMISED** | Replaced with `redacted_<uuid>@compliance.dgtechstore.ng`. Frees up real email while maintaining uniqueness. |
| `passwordHash` | `String` | Duration of active session | NDPA 2023 s.39 (Security of data) | **ANONYMISED / DESTROYED** | Overwritten with `'REDACTED_DELETED_ACCOUNT'`. Credential permanently unrecoverable. |
| `role` | `String` | Duration of account | Legitimate business interest | **PRESERVED** | Preserved as `'CUSTOMER'` for audit reporting. |
| `ninEncrypted` | `String?` | Duration of financing application | NIMC Act 2007 & FCCPC Credit Guidelines | **DELETED (PURGED)** | Completely set to `NULL`. Sensitive national identity token deleted immediately after grace period. |
| `isVerified` | `Boolean` | Duration of account | NDPA s.24(1)(d) (Data accuracy) | **PRESERVED** | Preserved as boolean audit flag. |
| `emailVerifiedAt` | `DateTime?` | Duration of account | NDPA s.24(1)(d) | **DELETED (PURGED)** | Set to `NULL`. |
| `bvnNumber` | `String` | Duration of financing | CBN Regulatory Framework on BVN / KYC | **ANONYMISED** | Replaced with `'REDACTED_BVN'`. Financial identifier obliterated from user record. |
| `creditScore` | `Int` | 6 Months rolling | FCCPC Digital Lending Guidelines | **RESET / PURGED** | Reset to `0`. |
| `accountStatus` | `String` | Permanent | NDPA 2023 s.34 & Audit compliance | **PRESERVED** | Set to `'ANONYMIZED_PRESERVED_FOR_AUDIT'`. Informs future queries that row is dead. |
| `deletionRequestedAt` | `DateTime?` | Permanent | NDPA s.34(3) (Compliance record keeping) | **PRESERVED** | Timestamp recorded to prove statutory compliance with 30-day deletion requests. |
| `createdAt` / `updatedAt` | `DateTime` | Permanent | Audit trail | **PRESERVED** | Timestamps kept for tax year accounting. |

---

### Table 2: `Session` (Active & Historic Session Tokens)

| Column Name | Data Type | Retention Period | Legal Basis | Action at Account Deletion | Justification & Safeguards |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `String (UUID)` | Max 7 days | NDPA 2023 s.39 (Security) | **HARD DELETED** | Session row purged immediately upon deletion request. |
| `sessionToken` | `String` (SHA-256) | Max 7 days | NDPA 2023 s.39 | **HARD DELETED** | Deleted from database; token immediately fails verification. |
| `userId` | `String` | Max 7 days | NDPA 2023 s.24 | **HARD DELETED** | Foreign key link purged. |
| `ipAddress` / `userAgent` | `String` | Max 7 days | Cybersecurity Act 2015 s.17 | **HARD DELETED** | Device and IP telemetry completely purged. |
| `expiresAt` / `revokedAt` | `DateTime` | Max 7 days | Security lifecycle | **HARD DELETED** | Row destroyed. |

---

### Table 3: `Payment` (Settled Financial Ledger Records)

| Column Name | Data Type | Retention Period | Legal Basis | Action at Account Deletion | Justification & Safeguards |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `String (UUID)` | **6 Years** | **FIRS CITA s.55 & VAT Act s.11** | **PRESERVED (IMMUTABLE)** | Legally required for Federal Inland Revenue Service tax audits. |
| `paymentReference` | `String` | **6 Years** | FIRS CITA s.55 | **PRESERVED (IMMUTABLE)** | Unique accounting transaction reference. |
| `paymentAttemptId` | `String` | **6 Years** | FIRS CITA s.55 | **PRESERVED (IMMUTABLE)** | Relational link to bank gateway attempt. |
| `userId` | `String` | **6 Years** | FIRS CITA s.55 | **PRESERVED (FOREIGN KEY)** | Links to anonymized User record. Cannot be deleted due to `onDelete: Restrict`. |
| `deviceId` | `String` | **6 Years** | Shop ATF 03 Asset Inventory Ledger | **PRESERVED** | Proves which MacBook/iPhone physical asset was financed. |
| `amountNaira` | `Int` | **6 Years** | FIRS CITA s.55 & CBN Guidelines | **PRESERVED (IMMUTABLE)** | Financial accounting amount. |
| `paymentType` | `String` | **6 Years** | FIRS CITA s.55 | **PRESERVED** | Classification (Hire-Purchase Deposit vs Installment). |
| `gatewayReference` | `String` | **6 Years** | CBN Electronic Payments Guidelines | **PRESERVED** | External Paystack/Interswitch audit reconciliation. |
| `receiptNumber` | `String` | **6 Years** | FIRS Stamp Duties & Tax Regulations | **PRESERVED** | Statutory physical receipt identifier issued at Banex Plaza. |
| `settledAt` / `createdAt`| `DateTime` | **6 Years** | FIRS CITA s.55 | **PRESERVED** | Tax year allocation. |

---

### Table 4: `PaymentAttempt` (Gateway Intent & Telemetry)

| Column Name | Data Type | Retention Period | Legal Basis | Action at Account Deletion | Justification & Safeguards |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `String (UUID)` | **6 Years** | CBN Digital Lending Guidelines | **PRESERVED** | Required to reconcile disputed gateway transactions. |
| `attemptReference` | `String` | **6 Years** | CBN Digital Lending Guidelines | **PRESERVED** | Gateway audit key. |
| `userId` | `String` | **6 Years** | CBN Digital Lending Guidelines | **PRESERVED** | Foreign key to anonymized User row. |
| `deviceId` | `String` | **6 Years** | Asset tracking | **PRESERVED** | Device catalog reference. |
| `intendedAmountNaira` | `Int` | **6 Years** | CBN Digital Lending Guidelines | **PRESERVED** | Intent amount. |
| `channel` / `status` | `String` | **6 Years** | CBN Digital Lending Guidelines | **PRESERVED** | Transaction channel and success/failure outcome. |
| `gatewayErrorCode` | `String?` | 1 Year | Operational debugging | **PRESERVED** | System error codes. |
| `ipAddress` | `String` | 1 Year | Cybersecurity Act 2015 s.17 | **ANONYMIZED** | IP truncated / masked to subnet (e.g. `197.210.0.0`) after 1 year. |

---

### Table 5: `KnowledgeChunk` (RAG Knowledge Base & Terms)

| Column Name | Data Type | Retention Period | Legal Basis | Action at Account Deletion | Justification & Safeguards |
| :--- | :--- | :--- | :--- | :--- | :--- |
| *All Columns* | N/A | Indefinite (Public) | Legitimate business interest | **UNAFFECTED** | Contains zero personal data; stores public store policies and terms. |

---

## 2. Statutory Legal Conflict & Resolution

### The Conflict: Privacy vs Fiscal Law

A direct, irreconcilable conflict arises between two federal statutes governing DG Tech Store:

1. **The Data Protection Mandate:**  
   **Nigeria Data Protection Act (NDPA) 2023, Section 34 ("Right to Erasure"):**  
   Grants a data subject (e.g., customer Fatima Aliyu) the legal right to request the total erasure of her personal data without undue delay where the personal data is no longer necessary, or where consent is withdrawn.

2. **The Tax and Consumer Protection Mandate:**  
   **Companies Income Tax Act (CITA) 2004 (as amended), Section 55:**  
   Mandates that every company operating in Nigeria shall keep books of accounts, ledgers, sales records, and receipts for a statutory minimum period of **six (6) years** from the date of the transactions. Under Section 55(3), failure to preserve these records for six years is a criminal misdemeanor carrying severe monetary penalties and corporate sanctions.  
   *Additionally,* the **Federal Competition and Consumer Protection Commission (FCCPC) Limited Interim Regulatory Framework for Digital Lending (2022)** requires retail hire-purchase financiers to maintain complete transaction logs and loan agreement ledgers to resolve consumer disputes and prevent predatory lending fraud.

### The Resolution:

Under NDPA Section 34(2)(b), the Right to Erasure is explicitly **subordinate** to statutory compliance:
> *"The right to erasure under subsection (1) shall not apply where processing is necessary... (b) for compliance with a legal obligation to which the data controller is subject by a law in Nigeria."*

Therefore, fiscal and financial regulations legally supersede the right to an absolute database wipe:

- **What CANNOT be erased:** The `Payment` and `PaymentAttempt` records, because purging them would violate CITA Section 55, create unexplainable tax gaps during an FIRS audit, and destroy proof of settled debts.
- **How we satisfy BOTH laws:** We apply **Irreversible Anonymization**. We sever the link between the living individual and the financial ledger:
  1. Fatima's name is overwritten with `REDACTED_ANONYMIZED_CUSTOMER`.
  2. Her email, phone number, encrypted NIN, and password hash are obliterated.
  3. The `Payment` row retains its relational integrity via foreign key `userId`, ensuring the store's annual balance sheet still balances to the exact Naira.
  4. An auditor inspecting the books sees that ₦250,000 was paid on receipt `RCP-DG-2026-0941` for an iPhone, but no personal information about Fatima Aliyu remains anywhere on the disk.

---

## 3. Critical Compliance Questions Answered

### Question 1: Backup Synchronization Interval
> *"What is your sync interval with backups? If you delete a user today and restore from yesterday's backup tomorrow, what happens to the deletion?"*

**Sync Interval:** DG Tech Store operates automated encrypted daily SQLite database backups at **03:00 WAT** (one hour after the 02:00 nightly deletion job runs). Backups are retained in an immutable S3 cold storage vault for 30 days before lifecycle expiration.

**The "Ghost User" Problem & Solution:**  
If a user requests account deletion on Tuesday, the nightly job anonymises/deletes them at 02:00 Wednesday. If a catastrophic hardware failure occurs on Wednesday afternoon and the database is restored from Tuesday's backup (which predates the deletion), **the deleted user would be resurrected as an active account ("ghost user")**, directly violating NDPA Section 34.

**Our Architectural Safeguard:**  
DG Tech Store maintains an append-only, write-ahead **`Compliance Deletion Log` (CDL)** stored in an independent Redis/JSON key-value store external to the main SQLite database.  
Whenever database restoration occurs:
1. The automated restore script (`scripts/restore-database.sh`) completes the database restoration.
2. Before the application server re-opens to incoming traffic, the script triggers an automatic replay:  
   `node scripts/scheduled-deletion-job.js --replay-cdl`
3. The job replays all confirmed deletions that occurred between the backup timestamp and the restore point, re-anonymizing any resurrected accounts before a single user request is served.

---

### Question 2: Why Anonymisation Over Deletion for Certain Fields?
> *"Why did you choose anonymisation over deletion for certain fields? What would break if you deleted the row instead?"*

**What Breaks If You Execute a Hard SQL `DELETE FROM User`:**

1. **Foreign Key Integrity Violations (`onDelete: Restrict`):**  
   In `prisma/schema.prisma`, financial records are defined with strict integrity:
   ```prisma
   model Payment {
     userId String
     user   User   @relation(fields: [userId], references: [id], onDelete: Restrict)
   }
   ```
   Executing `DELETE FROM User WHERE id = 'usr_fatima'` fails immediately with Prisma error `P2003: Foreign key constraint violated`. SQLite refuses to delete a user who has associated payments.
2. **Cascading Delete Disaster (Hauwa's Cooperative Scenario):**  
   If an inexperienced developer changes the schema to `onDelete: Cascade`, deleting Fatima's row will silently and automatically **delete all her payment records and receipts**! The store's monthly sales ledger drops by ₦250,000, bank statement reconciliations fail, VAT returns to the FIRS are fraudulent, and if Fatima later disputes a payment receipt at the Banex Plaza shop counter, the store has no record that the transaction ever took place.
3. **Database Null-Pointer Crashes:**  
   If `userId` were made nullable (`userId String?` with `onDelete: SetNull`), the financial ledger would contain orphaned rows with no origin (`userId = null`). Historical financial reports (e.g. "total revenue per customer cohort" or "hire-purchase default rates") would crash with unhandled null dereferences.

By preserving the row and anonymizing the PII columns, database relational integrity remains 100% solid, zero foreign keys break, and accounting ledgers balance perfectly.

---

### Question 3: Deleting vs Anonymising Under the NDPA
> *"What is the difference between deleting data and anonymising data under the NDPA?"*

Under the **Nigeria Data Protection Act (NDPA) 2023, Section 65 (Interpretation & Definitions)**:

1. **"Deleting" (Erasure / Destruction):**  
   Refers to the physical or electronic destruction of personal data so that the underlying bytes cease to exist on the storage medium. In database systems, this is a hard SQL `DELETE` or file purge. While it guarantees the removal of personal identifiers, it also destroys all relational structure and non-personal attributes stored in that record.

2. **"Anonymising" (Irreversible De-identification):**  
   Refers to processing personal data in such a manner that the data subject can **no longer be identified**, directly or indirectly, by any means reasonably likely to be used, either by the data controller or by any third party, without the possibility of reversal.  
   - Crucially, under NDPA Section 3(2), **truly anonymized data ceases to be "personal data"**. Once personal identifiers (name, phone, BVN, NIN, IP) are irreversibly redacted, the remaining non-identifiable numerical attributes (amount: ₦250,000, date: 2026-10-15, item: MacBook) fall outside the scope of data protection restrictions.
   - Anonymisation satisfies the legal mandate of Section 34 (Right to Erasure) because the data subject's privacy is permanently secured, while simultaneously satisfying fiscal record-keeping laws because the mathematical ledger is preserved.
