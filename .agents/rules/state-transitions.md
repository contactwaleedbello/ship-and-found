# state-transitions

Source: PRD Sections 3.4, 3.3 FR-14, 4.1, 8.2, 9.2, 13.1, 14.3

## Single job

This file is the authoritative state-machine specification for DG Tech Store Version 1. It defines the **7 Customer statuses** (`PRD 3.3 FR-14`), the **10 internal Application/Contract states** (`PRD 3.4`), how the two map to each other, the allowed transitions, the atomic side effects inside each transition's database transaction, and the countdown timer rules.

## Two distinct state sets — do not merge them

1. **The 7 Customer statuses (`FR-14`):**
   - `Application Pending`
   - `Active Flexi-Pay Contract`
   - `Defaulted`
   - `Completed`
   - `Rejected`
   - `Resolved`
   - `Expired`
   *Why 7:* High-level lifecycle stages defined in `PRD Structural Assumptions` and `FR-14`. While an application moves through internal verification and acceptance steps prior to activation, its high-level customer lifecycle status remains `Application Pending` until activated, rejected, or expired.

2. **The 10 internal Application states (`PRD 3.4`):**
   - `Application Pending`
   - `Awaiting Down Payment Verification` *(intermediate pre-activation state)*
   - `Awaiting Customer Acceptance` *(intermediate pre-activation state)*
   - `Awaiting Final Approval` *(intermediate pre-activation state)*
   - `Active Flexi-Pay Contract`
   - `Completed`
   - `Defaulted`
   - `Rejected`
   - `Resolved`
   - `Expired`
   *Why 10:* Store Worker and Owner/Co-owner queues (`Payments to Verify`, `Awaiting Final Approval`) and the customer `Application Status` screen (`ux-states.md` B.4) need to distinguish the 3 intermediate handoff steps between initial Owner review and final contract activation.

### Mapping between internal `application_status` and Customer status / `ux-states.md` B.4

| Internal `PartPaymentApplication.application_status` (`PRD 3.4`) | High-level Customer status (`FR-14`) | `Application Status` screen copy (`ux-states.md` B.4) |
|---|---|---|
| `Application Pending` | `Application Pending` | `"Application Pending. Expires in [countdown]."` |
| `Awaiting Down Payment Verification` | `Application Pending` | `"Approved for payment verification. Visit Shop ATF 03."` |
| `Awaiting Customer Acceptance` | `Application Pending` | `"Payment verified. Accept your agreement to activate contract."` |
| `Awaiting Final Approval` | `Application Pending` | `"Awaiting final approval from store management."` |
| `Active Flexi-Pay Contract` | `Active Flexi-Pay Contract` | `"Contract Active. [Countdown] to due."` |
| `Completed` | `Completed` | `"Contract Completed. Thank you."` |
| `Defaulted` | `Defaulted` | `"Contract Defaulted. Visit Shop ATF 03 to resolve."` |
| `Rejected` | `Rejected` | `"Application Rejected. Reason: [Reason]."` |
| `Resolved` | `Resolved` | Rendered on `Contract Detail` as `Resolved` |
| `Expired` | `Expired` | `"Application Expired. Reapply to try again."` |

## Authoritative transition and side-effect table (`PRD 3.4`)

Every transition below must execute inside a single `prisma.$transaction` (`data-and-schema.md`) using a conditional `WHERE application_status = '<From>'` guard so concurrent requests cannot double-transition a row (`PRD 13.1`). Manual WhatsApp sends are performed by the Store Worker after the database transaction commits:

| # | From state | Trigger / Endpoint | To state | Transactional database side effects | Post-commit notification (`notification-matrix.md`) |
|---|---|---|---|---|---|
| 1 | `(none)` | Valid submission (`POST /api/applications`) | `Application Pending` | Verify `available_stock >= 1`, price fresh, no active `Defaulted` block (`BR-09`), no 24h duplicate (`PRD 9.2`). Increment `Inventory.reserved_count += 1`, insert `PartPaymentApplication` (`locked_price`, `expires_at = NOW() + 24h`), insert pending `Agreement`, insert `AuditLog`. | None (appears in Owner `New Applications` queue) |
| 2 | `Application Pending` | `NOW() > expires_at` (`GET /api/cron/expire-applications`) | `Expired` | Decrement `Inventory.reserved_count -= 1`, release price lock, set status `Expired`, insert `AuditLog`. (Idempotent) | None |
| 3 | `Application Pending` | Owner/Co-owner rejects (`POST /api/admin/applications/:id/reject`) | `Rejected` | Require non-empty `rejection_reason`, decrement `Inventory.reserved_count -= 1`, release price lock, set status `Rejected`, insert `AuditLog`. | None |
| 4 | `Application Pending` | Owner/Co-owner approves for verification (`POST /api/admin/applications/:id/approve-for-verification`) | `Awaiting Down Payment Verification` | Set `reviewed_by`, `approved_at = NOW()`, set status `Awaiting Down Payment Verification`, insert `AuditLog`. | Worker sends manual WhatsApp `Template A.6` and logs in `WhatsAppReminderLog` |
| 5 | `Awaiting Down Payment Verification` | Store Worker verifies down payment (`POST /api/worker/down-payment`) | `Awaiting Customer Acceptance` | Require `verification_checkbox == true` and `amount == down_payment_amount`. Insert `DownPaymentTransaction` with `verifier_ip`, set status `Awaiting Customer Acceptance`, insert `AuditLog` with `ip_address`. | Worker sends manual WhatsApp `Template A.5` and logs in `WhatsAppReminderLog` |
| 6 | `Awaiting Customer Acceptance` | Customer verifies OTP and accepts (`POST /api/applications/:id/accept-agreement`) | `Awaiting Final Approval` | Verify 6-digit OTP (`security-baseline.md`), set `Agreement.customer_accepted_at = NOW()` and `acceptance_otp_verified = true`, set status `Awaiting Final Approval`, upsert `ConsentRecord`, insert `AuditLog`. | None (appears in Owner `Awaiting Final Approval` queue) |
| 7 | `Awaiting Final Approval` | Owner/Co-owner final approves (`POST /api/admin/applications/:id/final-approve`) | `Active Flexi-Pay Contract` | Validate inside transaction: (1) `DownPaymentTransaction` exists with `verifier_ip`, (2) `Agreement.customer_accepted_at IS NOT NULL` and `acceptance_otp_verified == true`, (3) `approverUserId !== verifierUserId` (`BR-13`), (4) `device_serial` provided (`BR-08`). Set application & agreement status to `Active Flexi-Pay Contract`, set `device_serial`, set `due_date` to `19:59 WAT` on day 30 (`18:59:00 UTC`), decrement `Inventory.stock_count -= 1` and `Inventory.reserved_count -= 1`, insert `AuditLog` with approver `ip_address`. If `approver_ip === verifier_ip`, record IP collision alert (`BR-19`). | Worker sends manual WhatsApp `Template A.2` (Contract Confirmation) and logs in `WhatsAppReminderLog` |
| 8 | `Active Flexi-Pay Contract` | Store Worker records balance payment (`POST /api/worker/balance-payment`) where `newRemainingBalance == 0` | `Completed` | Reject if `amount > remaining_amount` (`FR-08`). Insert `BalancePaymentTransaction`, update `remaining_amount = 0`, set application & agreement status to `Completed`, insert `AuditLog`. (If `newRemainingBalance > 0`, status remains `Active Flexi-Pay Contract`.) | None |
| 9 | `Active Flexi-Pay Contract` | `NOW() > due_date` (`19:59 WAT` day 30) with `remaining_amount > 0` (`GET /api/cron/default-contracts`) | `Defaulted` | Set application & agreement status to `Defaulted` (applying administrative default flag on `device_serial` and deriving `BR-09` purchase block on NIN/phone), insert `AuditLog`. (Idempotent) | None |
| 10 | `Defaulted` | Owner/Co-owner resolves (`POST /api/admin/defaults/:id/resolve`) after Worker recorded settlement payment(s) bringing `remaining_amount == 0` | `Resolved` | Verify inside transaction that `remaining_amount == 0` (`FR-09`). Set application & agreement status to `Resolved` (lifting `BR-09` purchase block), insert `AuditLog`. | None |
| 11 | `Rejected` or `Expired` | Customer submits a new application (`POST /api/applications`) | `Application Pending` (new `application_id`) | Creates a brand-new `PartPaymentApplication` row following Transition #1; prior `Rejected` or `Expired` row remains immutable for history. | None |

## Countdown timer rules

- **24-hour pending application countdown (`BR-18`, `PRD 9.2`):** Computed as `PartPaymentApplication.expires_at - NOW()`. Applies only while `application_status == 'Application Pending'`. Viewing or opening the application never resets `expires_at`.
- **30-day contract balance countdown (`BR-03`, `BR-14`):** Computed as `Agreement.due_date - NOW()`, where `due_date` is fixed at `19:59:00 WAT` (`18:59:00 UTC`) on the 30th calendar day after activation (`PRD 13.1`). Partial balance payments and public holidays never extend `due_date`.

## Unresolved before build (3 intermediate-state PRD gaps)

Do not invent transitions for the 3 cases below unless approved on Day 0 (`working-agreements.md`):

1. **Owner rejection after initial approval (`Awaiting Down Payment Verification`, `Awaiting Customer Acceptance`, `Awaiting Final Approval`):** PRD 3.4 only defines `Application Pending -> Rejected`. Confirm on Day 0 whether an Owner can reject an application that stalled in `Awaiting Down Payment Verification` (before cash is paid) to release the reserved unit (`edge-cases.md` row 14).
2. **24-hour expiry scope (`AGENTS.md` Q37):** `edge-cases.md` row 14 states that once approved to `Awaiting Down Payment Verification`, auto-expiry does not run. Confirm that `GET /api/cron/expire-applications` filters strictly on `application_status = 'Application Pending'`.
3. **Stalled `Awaiting Customer Acceptance` > 24h (`AGENTS.md` Q38, `PRD 7.10`):** Triggers the Owner/Co-owner in-app alert banner after 24 hours without changing `application_status`.
