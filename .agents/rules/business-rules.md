# business-rules

Source: PRD Sections 4.1 (BR-01 to BR-20), 3.3 FR-03, FR-08, 7.9, 7.13, 8.5, 9.2, 13.1, 14.3

## Single job

This file is the single source of truth for the 20 business rules (`BR-01` through `BR-20`) and every numeric, percentage, duration, and format threshold enforced in application code. Security cryptography and rate-limit numbers live in `security-baseline.md`; state transition tables live in `state-transitions.md`.

## How to use this file

- **Never hardcode a business number inline in a route or component:** define all values in `lib/constants.ts` referencing the table below.
- **Cite the `BR-XX` identifier in a comment above every validation check** (`code-conventions.md`).
- **Enforce every business rule on the server** inside `lib/services/*` (client-side validation is for UX feedback only per `security-baseline.md`).

## Business Rules (`BR-01` through `BR-20`) with reasons

- **BR-01 Manual approval only:** Refuse automatic part-payment approval; require explicit `Owner` or `Co-owner` sign-off on every application (`FR-04`). *Why:* Version 1 has no automated credit-scoring model (`out-of-scope.md`), so human underwriting protects Shop ATF 03 from credit loss.
- **BR-02 Down payment threshold:** Require `down_payment_amount` to be between **70.0% and 80.0% (inclusive)** of the device's current `dynamic_price` at submission (`FR-03`, `PRD 13.1`). Reject `69.9%` or below and `80.1%` or above. *Why:* A 70%–80% cash cushion is the store's primary financial protection against default (`PRD 7.1`).
- **BR-03 30-day balance window:** Starts at contract activation (`final-approve`) and expires at **`19:59 WAT` (`18:59:00 UTC`) on day 30**; the default cron runs daily at **`20:00 WAT` (`19:00:00 UTC`)** (`cron.md`). *Why:* Setting the cutoff at `19:59 WAT` guarantees the `20:00 WAT` daily cron catches every contract whose 30th day just ended at shop closing time.
- **BR-04 Price lock:** Validate `down_payment_amount` against current `Price.dynamic_price` inside the submission transaction and store that price in `PartPaymentApplication.locked_price` and `Agreement.locked_price`. Subsequent multiplier or base-price changes never alter an existing application or contract's `locked_price`. *Why:* Protects customers from mid-contract price changes while the 24h expiry and 30-day window cap the store's FX exposure (`PRD 7.2`).
- **BR-05 Checkout refusal on zero stock or stale price:** Refuse application submission when `available_stock <= 0` or when price is stale (`exchange_rate_multiplier` changed after `Price.last_updated_at` OR `NOW() - Price.last_updated_at > freshness_window`), and display the `Confirm Current Price via WhatsApp` action (`FR-12`). *Why:* Prevents locking an unhedged Naira price during currency volatility or selling an unavailable unit.
- **BR-06 Worker verification required:** Require a `Store Worker` to physically verify cash or bank-transfer receipt, record the full `DownPaymentTransaction` log, and check `verification_checkbox = true` before final approval is possible (`FR-05`). *Why:* Replaces automated payment webhooks with accountable human attestation at Shop ATF 03.
- **BR-07 Owner or Co-owner final sign-off:** Require explicit `Owner` or `Co-owner` final approval (`POST /api/admin/applications/:id/final-approve`) before any contract becomes `Active Flexi-Pay Contract` (`FR-06`). *Why:* Ensures store leadership approves the final asset release.
- **BR-08 Device serial tie:** Record `Agreement.device_serial` (non-empty string) at the moment of final approval activation (`FR-06`). Never record it before activation. *Why:* Ties the specific physical unit at Shop ATF 03 to the contract and prepares the Version 2 remote-locking key (`version-2-data.md`).
- **BR-09 Default flag and purchase block:** When `19:59 WAT` on day 30 passes with `remaining_amount > 0`, transition the contract to `Defaulted`, flag `device_serial` as defaulted, and block any new application whose customer matches the defaulted customer's `customer_id`, `NIN`, or `phone_number` until the contract is marked `Resolved` (`FR-09`). *Why:* Prevents repeat borrowing by a customer with an unpaid default.
- **BR-10 NDPA deletion control:** Refuse informal deletion requests (`"Submit a formal deletion request in Account Settings."`) and route formal requests through Owner/Co-owner retention review (`FR-10`, `ndpa-compliance.md`). *Why:* Prevents accidental destruction of active financial records while complying with NDPA right-to-erasure procedures.
- **BR-11 Role separation:** Separate `Store Worker` down-payment verification from `Owner` / `Co-owner` final approval (`permission-matrix.md`). *Why:* Dual control prevents a single worker from fabricating a payment and releasing a device (`PRD 7.3`).
- **BR-12 Immutable audit trail:** `AuditLog` is insert-only at both the application layer and PostgreSQL database permission level (`REVOKE UPDATE, DELETE, TRUNCATE`). *Why:* Preserves tamper-evident accountability for every verification, approval, price change, and deletion decision (`ndpa-compliance.md`).
- **BR-13 Same-user rule:** Enforce inside the `final-approve` database transaction that `approverUserId !== DownPaymentTransaction.recorded_by_worker_id` on the same application (`FR-06`, `PRD 13.1`). If equal, abort with `400 SAME_USER_FORBIDDEN` (`"Final approval must be by a different user than the verifier."`). *Why:* Enforces `BR-11` even if an Owner also acted as the verifying Worker on that application.
- **BR-14 Partial payments allowed without window extension:** Accept partial balance payments (`0 < amount < remaining_amount`), recalculate `remaining_amount`, and keep `Agreement.due_date` fixed at `19:59 WAT` on day 30 (`FR-08`). *Why:* Lets customers pay in installments without extending the store's 30-day FX exposure window.
- **BR-15 Platform-only purchase block:** The `BR-09` purchase block applies only to part-payment applications on this web platform; it does not block full-cash walk-in purchases at Shop ATF 03. *Why:* A customer paying 100% cash upfront poses zero credit risk.
- **BR-16 No late penalty, interest, or fees in Version 1:** `Settled` means `remaining_amount == 0` (total verified payments equal `locked_price` per `FR-08`, `FR-09`). *Why:* Keeps Version 1 commercial math simple and transparent (`out-of-scope.md`).
- **BR-17 OTP-verified agreement acceptance required:** Contract activation is blocked unless `Agreement.customer_accepted_at IS NOT NULL` and `Agreement.acceptance_otp_verified == true` (`FR-06`). *Why:* Proves the customer read and consented to the locked price and 30-day terms via their verified phone number.
- **BR-18 Stock reservation:** Reserve exactly `1` unit (`Inventory.reserved_count += 1`) per valid `Application Pending` submission, and release it (`reserved_count -= 1`) on `Expired` or `Rejected` (or decrement both `stock_count` and `reserved_count` on `Active Flexi-Pay Contract` activation). *Why:* Prevents two shoppers from locking the last physical unit simultaneously (`PRD 9.6`, `13.1`).
- **BR-19 No account sharing and IP collision alert:** Record client IP on down-payment verification (`DownPaymentTransaction.verifier_ip` and `AuditLog.ip_address`) and on final approval (`AuditLog.ip_address`). If `verifier_ip === approver_ip` on the same application, trigger the non-dismissible Owner/Co-owner in-app alert (`PRD 7.13`, `notification-matrix.md`). *Why:* Detects staff logging into both Worker and Owner accounts from the same device to bypass dual control.
- **BR-20 Additive-only migrations:** All Version 1 database migrations are strictly additive (`data-and-schema.md`). *Why:* Guarantees safe instant rollback on Vercel (`PRD 14.4`).

## Authoritative values table (`lib/constants.ts`)

| Constant name | Value | Validation rule / formula | PRD source |
|---|---|---|---|
| `DOWN_PAYMENT_MIN_PERCENT` | `70` (`70.0%`) | `downPaymentAmount >= Math.ceil(dynamicPrice * 0.70)` and `percent >= 70.0` (`PRD 13.1`) | `BR-02`, `FR-03`, `8.5` |
| `DOWN_PAYMENT_MAX_PERCENT` | `80` (`80.0%`) | `downPaymentAmount <= Math.floor(dynamicPrice * 0.80)` and `percent <= 80.0` (`PRD 13.1`) | `BR-02`, `FR-03`, `8.5` |
| `BALANCE_WINDOW_DAYS` | `30` days | `due_date` set to day `activationDateWAT + 30 days` at `19:59:00 WAT` (`18:59:00 UTC`) | `BR-03`, `8.5`, `13.1` |
| `DEFAULT_CRON_SCHEDULE_WAT` | `20:00 WAT` daily | `0 19 * * *` UTC in `vercel.json` (`cron.md`) | `BR-03`, `14.3` |
| `APPLICATION_EXPIRY_HOURS` | `24` hours | `expires_at = created_at + 24 hours` | `PRD 8.5`, `9.2` |
| `EXPIRY_CRON_INTERVAL_MINUTES` | `5` minutes | `*/5 * * * *` in `vercel.json` (`cron.md`) | `PRD 9.2`, `14.3` |
| `CRON_HEARTBEAT_STALE_MINUTES` | `15` minutes | Alert if `NOW() - last_expiry_cron_at > 15m` or `NOW() - last_default_cron_at > 24h 15m` | `PRD 9.2`, `14.3`, `cron.md` |
| `DUPLICATE_APPLICATION_WINDOW_HOURS` | `24` hours | Reject if same `customer_id` + `device_id` has a non-rejected/non-expired application within 24h | `PRD 9.2` |
| `PRICE_FRESHNESS_WINDOW_HOURS` | `24` hours (default) | Stored in `Settings` (`freshness_window = 24`); stale if multiplier changed or age `> 24h` | `PRD 8.5` |
| `APPROVAL_AND_ACCEPTANCE_ALERT_HOURS` | `24` hours | Alert Owner/Co-owner if `Awaiting Customer Acceptance` or `Awaiting Final Approval` exceeds 24h | `PRD 7.7`, `7.10`, `11` |
| `PASSWORD_RESET_LOCK_HOURS` | `24` hours | `User.locked_until = NOW() + 24 hours` on `POST /api/auth/reset-password` | `PRD 7.11`, `9.3` |
| `NIN_REGEX` | `/^\d{11}$/` | Exactly 11 ASCII numeric digits (`0`–`9`) | `FR-03`, `PRD 13.1` |
| `NIGERIAN_PHONE_REGEX` | `/^(?:\+234|234|0)[789][01]\d{8}$/` | Accepts `+234`, `234`, or `0` followed by valid 10-digit Nigerian mobile subscriber number (`PRD 13.1`), normalized to `+234XXXXXXXXXX` | `FR-03`, `PRD 13.1` |
| `OVERPAYMENT_RULE` | `amount <= remaining_amount` | Reject `amount > remaining_amount` with `"Amount exceeds remaining balance."` | `FR-08`, `PRD 7.9`, `13.1` |
| `RECONCILIATION_CADENCE` | Daily | Logged in `AuditLog` with `action = 'RECONCILIATION_DAILY'` | `PRD 4.2`, `7.3` |
