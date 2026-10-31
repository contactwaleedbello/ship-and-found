# failure-modes

Source: PRD Sections 7 (7.1 through 7.13), 4.2, 3.3 FR-08, 9.3, 14.3, 15.1

## Single job

This file documents the 13 failure modes (`PRD 7.1` through `7.13`), their required mitigations, the 2 verbatim residual risk commitments (`7.1` and `7.2`), and the pointer to the rule file that enforces each mitigation in code. Operational actor responses for live edge cases live in `edge-cases.md`.

## How to use this file

- **PRD Section 7 supersedes PRD Section 4.2:** Section 4.2 summarizes 4 risk controls (`Default and asset loss`, `Exchange rate volatility`, `Worker collusion`, `Account sharing`); Section 7 covers all 4 in full detail (`7.1`, `7.2`, `7.3`, `7.13`) plus 9 additional failure modes (`7.4`–`7.12`). Implement each mitigation once via its governing rule file—never duplicate checks across layers.
- **Preserve the 2 residual risk statements (`7.1` and `7.2`) verbatim** in architecture/UAT documentation, and do not invent residual risk exemptions for modes `7.3` through `7.13`.

## The 13 failure modes and their code enforcement mappings

### 7.1 Default and Asset Loss
- **Failure:** Customer pays down payment, takes device, and disappears without paying the remaining 20%–30% balance.
- **Required mitigations:**
  1. `70%–80%` down payment enforced at submission (`business-rules.md` `BR-02`).
  2. `device_serial` recorded at activation (`business-rules.md` `BR-08`).
  3. 30-day countdown displayed on `Contract Detail` (`functional-requirements.md` `FR-07`).
  4. Logged manual WhatsApp reminders at `T-7`, `T-3`, `T-1`, `T-0`, `T+1` (`notification-matrix.md`, `FR-07`).
  5. Automated `Defaulted` transition at `20:00 WAT` daily cron for contracts past `19:59 WAT` day 30 (`cron.md`, `BR-03`).
  6. Administrative default flag on contract and device serial (`business-rules.md` `BR-09`).
  7. Platform purchase block keyed on customer NIN and phone (`business-rules.md` `BR-09`, `BR-15`).
  8. Owner/Co-owner `Resolved` transition enabled only after full settlement (`state-transitions.md`, `FR-09`).
- **Residual risk (verbatim PRD commitment):** Administrative default flag does not recover the device. Down payment cushion is primary financial protection. Recovery depends on manual follow-up.

### 7.2 Exchange Rate Volatility
- **Failure:** Naira devaluation during the 30-day window makes the remaining balance insufficient to replace stock cost.
- **Required mitigations:**
  1. Dynamic price computed as `base_price * exchange_rate_multiplier` (`FR-01`).
  2. Real-time multiplier adjustment by Owner/Co-owner on `Exchange Rate Settings` (`FR-13`).
  3. Price locked at valid application submission (`business-rules.md` `BR-04`).
  4. Stale-price checkout refusal when multiplier changes or `last_updated_at` exceeds `freshness_window` (`BR-05`, `FR-12`).
  5. Fixed 30-day window with zero extensions on partial payments or holidays (`BR-14`, `edge-cases.md` row 18).
  6. Locked contract price never changes mid-contract (`BR-04`).
- **Residual risk (verbatim PRD commitment):** Down payment covers 70 to 80 percent of sale price, not replacement cost. Store accepts this residual. Version 2 can add volatility-linked down payment floor.

### 7.3 Worker Collusion
- **Failure:** Store Worker falsely marks cash or bank-transfer down payment as received.
- **Required mitigations:**
  1. Exact `DownPaymentTransaction` log required (`payment_method`, `amount`, `received_at`, `receiving_account_or_drawer_reference`, `recorded_by_worker_id` per `FR-05`).
  2. Mandatory `verification_checkbox = true` attestation (`BR-06`).
  3. Same-user rule (`BR-13`) enforced inside the final-approval transaction (`state-transitions.md`).
  4. Insert-only `AuditLog` at PostgreSQL permission level (`BR-12`, `data-and-schema.md`).
  5. Client IP logged on both verification and final approval (`BR-19`, `security-baseline.md`).
  6. Daily Owner reconciliation logged in `AuditLog` (`action = 'RECONCILIATION_DAILY'` per `data-and-schema.md`).
  7. IP collision alert (`7.13` below).

### 7.4 Device Sold While Pending
- **Failure:** A unit reserved by a pending online application is sold to a walk-in customer at Shop ATF 03.
- **Required mitigations:**
  1. Atomic `Inventory.reserved_count` increment on submission (`data-and-schema.md`, `BR-18`).
  2. `Reserved Units` queue on `Worker Dashboard` (`screen-inventory.md` #19) where Store Worker acknowledges placing a physical reservation tag on the unit (`edge-cases.md` row 6).
  3. Automatic reservation release (`reserved_count -= 1`) on `Expired` or `Rejected` (`state-transitions.md`).

### 7.5 Fake NIN
- **Failure:** Customer submits a fabricated NIN.
- **Required mitigations:**
  1. Strict `^\d{11}$` 11-digit numeric validation (`business-rules.md`).
  2. Decrypted NIN shown to `Owner` and `Co-owner` on `Review Application` for manual inspection (`FR-04`, `permission-matrix.md`).
  3. `guarantor_name` and `guarantor_phone` collected on submission (`FR-03`, `version-2-data.md`).
  *(Note: External NIN registry verification is Version 2 only per `out-of-scope.md`; do not build a NIN registry call or extra column in Version 1.)*

### 7.6 Device Loss or Damage Before Pickup
- **Failure:** Device is damaged or stolen at Shop ATF 03 after contract activation but before customer pickup.
- **Required mitigations & unresolved block:**
  - `device_serial` is recorded at activation (`BR-08`).
  - **Unresolved block (`edge-cases.md` row 7, `AGENTS.md` Q36):** PRD 7.6 mentions customer pickup sign-off and pausing the 30-day timer during an open dispute, but neither `PRD 5.1` (`data-and-schema.md`) nor `PRD 3.4` (`state-transitions.md`) defines a pickup timestamp column or a `Paused` contract status. Do **not** invent a `Paused` status or schema column; track in `working-agreements.md` for Day 0 resolution.

### 7.7 Owner or Co-owner Unavailable for Final Approval
- **Failure:** Down payment is verified and customer accepted the agreement, but no Owner or Co-owner grants final approval promptly.
- **Required mitigations:**
  1. `Awaiting Final Approval` queue count displayed on `Owner Dashboard` (`screen-inventory.md` #21).
  2. Non-dismissible in-app alert banner triggered for Owner and Co-owner when an application remains in `Awaiting Final Approval` (`NOW() - Agreement.customer_accepted_at > 24 hours`) (`notification-matrix.md`, `monitoring.md`).

### 7.8 Customer Cannot Receive OTP
- **Failure:** Cellular network delay or outage prevents customer from receiving SMS OTP during registration or agreement acceptance.
- **Required mitigations:**
  1. Render `"Trouble receiving OTP? Visit Shop ATF 03 for in-person verification."` on OTP screens (`ux-states.md` B.6).
  2. Store Worker triggers `POST /api/worker/otp-resend` after in-person identity check at Shop ATF 03, writing an `AuditLog` entry (`api-contracts.md`, `security-baseline.md`).

### 7.9 Customer Overpays or Underpays
- **Failure:** Customer tenders an amount different from the remaining balance.
- **Required mitigations:**
  1. Overpayment (`amount > remaining_amount`) is blocked inside the payment transaction with `400 OVERPAYMENT_BLOCKED` and exact message `"Amount exceeds remaining balance."` (`FR-08`, `ux-states.md` B.7).
  2. Partial underpayment (`0 < amount < remaining_amount`) is recorded as a valid partial payment, recalculating `remaining_amount` without extending the 30-day `due_date` (`BR-14`).

### 7.10 Agreement Not Accepted by Customer
- **Failure:** Customer pays down payment at Shop ATF 03 (`Awaiting Customer Acceptance`) but fails to complete OTP agreement acceptance.
- **Required mitigations:**
  1. Customer sees `"Payment verified. Accept your agreement to activate contract."` on `Application Status` and `Accept Agreement` CTA on `Contract Detail` (`ux-states.md` B.4, `screen-inventory.md` #11).
  2. Store Worker reminds customer in shop and via manual WhatsApp `Template A.5`.
  3. Non-dismissible in-app alert banner triggered for Owner and Co-owner when `NOW() - DownPaymentTransaction.verified_at > 24 hours` and `Agreement.customer_accepted_at IS NULL` (`notification-matrix.md`, `monitoring.md`).

### 7.11 Password Reset Account Takeover
- **Failure:** A thief with a customer's stolen phone and SIM resets the account password via SMS OTP.
- **Required mitigations:**
  1. `POST /api/auth/reset-password` sets `User.locked_until = NOW() + 24 hours` (`security-baseline.md`). *(Distinct from `BR-18` 24-hour pending application expiry.)*
  2. All existing session rows for that `user_id` are deleted immediately (`security-baseline.md`).
  3. Early unlock requires in-person verification by `Owner` or `Co-owner` at Shop ATF 03 (`PRD 14.5`).
  4. Both the password-reset lock and any Owner unlock write `AuditLog` entries.

### 7.12 Cron Silent Failure
- **Failure:** Vercel Cron fails to run or errors out, leaving expired applications or defaulted contracts unprocessed.
- **Required mitigations:**
  1. `GET /api/cron/expire-applications` writes `Settings.last_expiry_cron_at = NOW()` on success; `GET /api/cron/default-contracts` writes `Settings.last_default_cron_at = NOW()` on success (`cron.md`).
  2. Heartbeat check endpoints (`GET /api/cron/check-expiry-heartbeat` and `GET /api/cron/check-default-heartbeat`) and dashboard queries raise the Owner in-app alert banner (`"Cron has not run in 15 minutes. Check system health."` per `ux-states.md` B.8) whenever a heartbeat is stale by more than 15 minutes (`monitoring.md`).
  3. All cron queries compare stored UTC timestamps (`expires_at < NOW()`, `due_date < NOW()`), so the next successful run or manual catch-up (`cron.md`) processes all overdue rows without data loss.

### 7.13 IP Collision on Verify and Approve
- **Failure:** The same IP address records both Store Worker down-payment verification and Owner/Co-owner final approval on the same application, indicating possible account sharing or collusion.
- **Required mitigations:**
  1. Extract client IP from `x-forwarded-for` (`security-baseline.md`) and store on `DownPaymentTransaction.verifier_ip` and final-approval `AuditLog.ip_address`.
  2. Inside the final-approval transaction (`state-transitions.md`), if `approver_ip === verifier_ip`, raise the non-dismissible Owner/Co-owner in-app alert banner: `"Same IP performed verification and final approval on this application. Review before further approvals."` (`ux-states.md` B.8, `BR-19`).
