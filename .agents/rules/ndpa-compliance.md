# ndpa-compliance

Source: PRD Sections 5.3, 5.1, 3.3 FR-10, 4.1 BR-10, BR-12, 7.11, 8.5, 9.3, 10

## Single job

This file defines the Nigeria Data Protection Act (NDPA) compliance rules that application code and database migrations must enforce: lawful basis, data minimization, role-based PII access and logging, retention gating, formal deletion review, and UPDATE-based anonymization/pseudonymization. Cryptographic parameters (`AES-256-GCM`, `bcryptjs`) live in `security-baseline.md`.

## NDPA obligations enforced in code (`PRD 5.3`)

### 1. Lawful basis and consent (`ConsentRecord`)

- Personal data is processed under two lawful bases: **contract performance** (evaluating and servicing the part-payment agreement) and **explicit consent** for manual WhatsApp communications (`PRD 5.3`).
- Write a `ConsentRecord` row (`customer_id`, `consent_type`, `granted_at = NOW()`, `revoked_at = null`) inside the registration transaction (`PRD 13.1` unit test: `"ConsentRecord written on registration for terms and WhatsApp"`) and on agreement acceptance (`data-and-schema.md`).

### 2. Data minimization

- Collect **only** the personal data fields defined in `data-and-schema.md` (`full_name`, `phone_number`, `nin`, `personal_details`, `guarantor_name`, `guarantor_phone`, and `ip_address` on verification/approval).
- Never add columns or form inputs for email address, date of birth, BVN, home GPS coordinates, or next-of-kin beyond the single guarantor, because collecting unapproved PII violates NDPA data minimization (`PRD 5.3`).

### 3. Role-based access control and NIN access auditing

- **Full decrypted NIN:** Restricted strictly to `Owner` and `Co-owner` on single-record review screens (`Review Application`, `Deletion Requests` per `permission-matrix.md`). Every server-side decryption of a full NIN for an Owner or Co-owner **must write an `AuditLog` row** (`action = 'NIN_ACCESS'`, `entity_type = 'CustomerProfile'`, `entity_id = customer_id`) as required by `PRD 5.3` (`"Audit: Log NIN access and deletion decisions"`).
- **Masked NIN:** `Store Worker` receives only the server-masked NIN (`security-baseline.md`, `permission-matrix.md`); the full NIN is never serialized to a Worker browser.
- **Transaction logs:** Accessible only to `Store Worker`, `Owner`, and `Co-owner` (plus the owning `Customer` viewing their own contract payment history per `FR-11`).

### 4. Encryption and key management pointers

- `CustomerProfile.nin` and `CustomerProfile.phone_number` are encrypted at rest with **AES-256-GCM** using separate environment keys (`NIN_ENCRYPTION_KEY`, `PHONE_ENCRYPTION_KEY`), and all traffic runs over TLS (`security-baseline.md`, `env-and-secrets.md`).
- Off-hours key rotation on staff change re-encrypts rows idempotently and logs the re-encrypted row count in `AuditLog` (`action = 'KEY_ROTATION'` per `PRD 8.5`, `env-and-secrets.md`).

### 5. Immutable `AuditLog` (`BR-12`)

- `AuditLog` is insert-only at the PostgreSQL permission level (`data-and-schema.md`).
- **Immutability takes precedence over in-place mutation during anonymization:** Never `UPDATE` or `DELETE` existing `AuditLog` rows when anonymizing a customer (`PRD 5.3`, `data-and-schema.md`).

### 6. Refusal of informal deletion requests (`BR-10`, `FR-10`)

- Do not allow Store Workers or Owners to delete customer data ad-hoc. Any informal request receives the exact message from `FR-10`: `"Submit a formal deletion request in Account Settings."`

### 7. Formal deletion request and anonymization workflow (`FR-10`, `Workflow 6`)

1. **Submission:** Customer submits `POST /api/customer/deletion-request` from `Account Settings`, creating a `DataDeletionRequest` row (`request_date = NOW()`) and an `AuditLog` row (`action = 'DELETION_REQUEST_SUBMITTED'`).
2. **Mandatory retention block (`FR-10`):** When an `Owner` or `Co-owner` reviews the request (`POST /api/admin/deletion-requests/:id/decide`), the server checks whether the customer has any `PartPaymentApplication` or `Agreement` in an active/unfinished state or in `Active Flexi-Pay Contract` or `Defaulted` status. If so, the server enforces rejection (`decision = 'REJECTED'`, `decision_reason = 'retention required'`, HTTP `422 RETENTION_REQUIRED` if Approval was attempted).
3. **Approved anonymization mechanics (`UPDATE`, never `DELETE`):** When approved for a customer with no active/defaulted contract and no open legal retention hold, execute inside one `prisma.$transaction` (`data-and-schema.md`):
   - Generate a deterministic or random pseudonymous token `PSEUDO_<uuid>` for the customer.
   - `UPDATE CustomerProfile` setting `full_name = 'ANONYMIZED_' || <pseudonym>`, `nin = encrypt('00000000000')`, `phone_number = encrypt('ANONYMIZED')`, `personal_details = 'ANONYMIZED'`, `guarantor_name = 'ANONYMIZED'`, `guarantor_phone = 'ANONYMIZED'`.
   - `UPDATE User` setting `phone_number = 'ANONYMIZED_' || <pseudonym>`, `password_hash = '<invalidated>'`, `account_status = 'ANONYMIZED'`, and delete all active `Session` rows for that `user_id`.
   - Update `DataDeletionRequest` with `reviewer_id`, `decision = 'APPROVED'`, `decision_reason`, `anonymized_fields` (`["full_name","nin","phone_number","personal_details","guarantor_name","guarantor_phone"]`), and `anonymized_at = NOW()`.
   - Insert a new `AuditLog` row (`action = 'DELETION_DECISION_APPROVED'`) recording the `pseudonym` reference in `metadata` without altering historical `AuditLog` rows.
4. **Records retained after anonymization:** Financial ledger rows (`DownPaymentTransaction`, `BalancePaymentTransaction`, `SettlementLog`), `Agreement` amounts/dates/device serials, `ConsentRecord`, and `AuditLog` rows are retained intact for accounting and tax/audit integrity (`PRD 5.3`).

## Unresolved before build (6 Day 0 NDPA decisions)

Track in `working-agreements.md` and resolve on Day 0 (`build-plan.md` decisions 5–10):

1. **Post-contract legal retention duration (`build-plan.md` decision 5 / `Appendix G` #2):** Exact retention period (e.g., 6 years under Nigerian financial/contract law or immediate eligibility after `Completed`/`Resolved`) before a completed contract's personal data can be anonymized.
2. **Pseudonymous ID mapping custody (`build-plan.md` decision 6 / `Appendix G` #5):** Mechanism by which the Owner holds the `user_id <-> PSEUDO_<uuid>` mapping for legal disputes only (`PRD 5.3`). Do not build an unapproved mapping table in `prisma/schema.prisma` until decided on Day 0.
3. **IP address retention period in `AuditLog` and `DownPaymentTransaction` (`build-plan.md` decision 7):** Confirm that `ip_address` is retained permanently inside immutable `AuditLog` rows under NDPA legitimate-interest fraud prevention (`BR-19`).
4. **Customer viewing own NIN (`build-plan.md` decision 8 / `AGENTS.md` Q20):** Confirm whether a Customer sees their own NIN masked or hidden after submitting the Apply form (`permission-matrix.md`).
5. **WhatsApp consent revocation effect (`build-plan.md` decision 9):** When a Customer toggles off WhatsApp consent in `Account Settings` (`ConsentRecord.revoked_at = NOW()`), confirm whether contractual balance reminders (`T-7` to `T+1`) continue under the `contract performance` lawful basis (`PRD 5.3`) or switch to in-person/phone follow-up.
6. **Deletion request during `Defaulted` contract (`build-plan.md` decision 10 / `AGENTS.md` Q41):** `FR-10` mandates rejecting deletion when a contract is `Defaulted` (`reason: "retention required"`). Enforce `FR-10` strictly unless written legal sign-off directs otherwise.
