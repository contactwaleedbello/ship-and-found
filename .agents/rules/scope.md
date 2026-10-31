# scope

Source: PRD Section 1.5

## Single job

This file is the high-level Version 1 in-scope feature boundary per persona. Detailed functional rules live in `functional-requirements.md`, screen layouts in `screen-inventory.md`, branch workflows in `workflows.md`, role access in `permission-matrix.md`, notifications in `notification-matrix.md`, and background jobs in `cron.md`. Explicit exclusions live in `out-of-scope.md`.

## Version 1 in-scope capabilities (with business reason per capability)

- **Browse and filter device inventory (`Visitor`, `Customer`):** Display real-time availability (`stock_count - reserved_count`), specifications, and dynamic prices filtered by brand, category, performance tier, and battery life (`FR-01`), because shoppers like Ahmed return twice a week to compare battery specs and price drops (`PRD 1.2`).
- **Equal visual weight for battery life and price (`Visitor`, `Customer`):** Render battery life with the same font size, font weight, and card prominence as price on every device view (`FR-01`, `accessibility-baseline.md`), because unreliable grid power makes battery life a primary purchase driver equal to price (`PRD 1.4`).
- **Public part-payment calculator (`Visitor`, `Customer`):** Calculate a 70% to 80% down payment, remaining 20% to 30% balance, and 30-day completion window with the required estimate disclaimer (`FR-02`), so unauthenticated visitors can evaluate affordability before registering.
- **Part-payment application with atomic price lock and stock reservation (`Customer`):** Collect full name, phone, 11-digit NIN, guarantor name, guarantor phone, personal details, and a 70%–80% down payment; lock the current dynamic price and reserve 1 stock unit for 24 hours inside one transaction (`FR-03`, `BR-02`, `BR-04`, `BR-18`), preventing double-sale of the last unit or mid-application price shifts.
- **Owner / Co-owner initial review (`Owner`, `Co-owner`):** Route pending applications to the Owner dashboard to approve for payment verification or reject with a required reason (`FR-04`, `BR-01`), because credit risk at Shop ATF 03 requires manual human underwriting.
- **Store Worker physical payment verification (`Store Worker`):** Verify physical cash or bank-transfer down payments at Shop ATF 03 with an exact transaction log, verifier IP, and attestation checkbox (`FR-05`, `BR-06`, `BR-19`), keeping Version 1 free of complex payment-gateway webhook integrations.
- **OTP-verified customer agreement acceptance (`Customer`):** Generate a pending agreement and require the customer to accept terms via SMS OTP before final approval (`FR-06`, `BR-17`), creating non-repudiable proof of contract acceptance.
- **Dual-control final approval and contract activation (`Owner`, `Co-owner`):** Require final sign-off from an Owner or Co-owner whose `user_id` differs from the verifying Store Worker (`FR-06`, `BR-07`, `BR-11`, `BR-13`), recording the device serial (`BR-08`) and starting the 30-day balance countdown (`BR-03`) to prevent worker collusion (`PRD 7.3`).
- **Balance tracking, manual WhatsApp reminders, and payment recording (`Store Worker`, `Customer`):** Track the remaining 20%–30% balance over the fixed 30-day window, surface a manual WhatsApp reminder checklist (`T-7`, `T-3`, `T-1`, `T-0`, `T+1`) with logged sends (`FR-07`), and record partial or full balance/settlement payments while blocking overpayment (`FR-08`, `BR-14`).
- **Full status lifecycle and automated expiry/default crons (`System`, `Owner`, `Co-owner`):** Enforce the 7 customer statuses (`Application Pending`, `Active Flexi-Pay Contract`, `Defaulted`, `Completed`, `Rejected`, `Resolved`, `Expired`) and 3 intermediate application states (`state-transitions.md`), driven by the 5-minute expiry cron and `20:00 WAT` daily default cron (`FR-09`, `FR-14`, `cron.md`).
- **Version 2 data foundation (`System`):** Capture customer identity, encrypted NIN and phone, guarantor details, exact payment logs, device serials, and `ConsentRecord` rows from Day 1 (`PRD 5.2`, `version-2-data.md`) so Version 2 can add credit scoring and remote device locking without a data backfill.
- **NDPA-compliant data deletion review (`Customer`, `Owner`, `Co-owner`):** Route formal Account Settings deletion requests to Owner/Co-owner review, block deletion during Active or Defaulted contracts, and anonymize personal data via `UPDATE` while preserving immutable `AuditLog` records (`FR-10`, `ndpa-compliance.md`).

## Constraints

- If a feature appears in `functional-requirements.md`, `screen-inventory.md`, `workflows.md`, `permission-matrix.md`, `notification-matrix.md`, or `cron.md`, it is in scope for Version 1.
- If a feature is absent from all of those files or appears in `out-of-scope.md`, do not build it; stop and log in `working-agreements.md`.
