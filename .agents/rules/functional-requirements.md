# functional-requirements

Source: PRD Section 3.3 (FR-01 through FR-14), cross-checked against Sections 6, 7.4, 7.6, 7.8, 7.11, 8.3, 9.2, 9.3, 10, 11, 14.3

## Single job

This file reproduces PRD Section 3.3 (`FR-01` through `FR-14`) verbatim and maps the 8 cross-section requirements that live outside Section 3.3 so every feature built in Version 1 traces to an explicit FR or cross-section requirement. Numeric thresholds live in `business-rules.md`; state machines live in `state-transitions.md`.

## How to use this file

- **Cite the `FR-XX` identifier in code comments and PR descriptions** when implementing a feature (`code-conventions.md`).
- **Normative conflict resolution:**
  1. `FR-05` mentions `"Allow optional receipt image upload"`, which is explicitly excluded by PRD Section 6 (`"Receipt upload (cut to protect 1-week timeline)"`). **PRD Section 6 wins:** do not build receipt upload (`out-of-scope.md`).
  2. `FR-13` states both `"Store Worker updates stock counts and base prices"`, `"Owner approves inventory changes"`, and `"System updates stock status in real time when Store Worker updates stock."` **Reconciliation (`workflows.md` W7, `api-contracts.md`):** A Store Worker submits an inventory update via `POST /api/worker/inventory`, and live `Inventory.stock_count` / `base_price` updates in real time as soon as the Owner or Co-owner approves it via `POST /api/admin/inventory-approvals/:id/approve`.

## Functional Requirements (`PRD 3.3` verbatim with normative annotations)

### FR-01 Inventory Listing and Filtering

- Display device inventory with brand, category, performance tier, battery life specifications, stock status, and dynamic price.
- Support filters for brand, category, performance tier, and battery life specifications.
- Show battery life specifications with equal visual prominence to price.
- Show real-time stock status. Available stock equals `stock_count` minus `reserved_count`.
- Show dynamic price calculated from base price and exchange rate multiplier.
- Block checkout for devices with available stock of zero.
- Show empty state when filters return zero matches: `"No devices match your filters. Clear filters to see all devices."`

### FR-02 Part-Payment Calculator

- Allow unverified visitors to calculate part-payment breakdowns.
- Let visitor select a device and a down payment percentage from 70% to 80%.
- Display down payment amount, remaining 20% to 30% balance, and 30-day completion window.
- Calculator does not lock price and does not create an application.
- Show disclaimer below calculator: `"This is an estimate. Final amount is validated at application submission."`

### FR-03 Part-Payment Application

- Require authenticated customer account with OTP verified phone number.
- Collect full name, phone number, NIN, guarantor name, guarantor phone, personal details, selected device, and selected down payment amount.
- Validate NIN is exactly 11 numeric digits.
- Validate down payment amount is at least 70% and at most 80% of the current device price at submission.
- Validate phone number is present and in Nigerian format.
- Validate device has available stock.
- Validate price is not stale.
- Revalidate down payment against current price at submit. If price changed, show notice and require confirmation.
- Refuse submission when device has available stock of zero or price is stale. Show `"Confirm Current Price via WhatsApp"` action.
- On valid submission, lock price, reserve one stock unit, set `expires_at` to 24 hours, generate pending agreement, set status to `Application Pending`, and route to Owner or Co-owner dashboard.
- No OTP at application submission. *(Consolidated PRD v1.3 removed OTP at submission; OTP is required only at registration, forgot-password reset, and agreement acceptance.)*

### FR-04 Owner or Co-owner Review

- Show pending applications with customer details, NIN, guarantor details, device, locked price, down payment amount, remaining balance, submission timestamp, expiry countdown.
- Allow Owner or Co-owner to reject application with required reason. Rejection releases price lock and stock reservation and sets status `Rejected`.
- Allow Owner or Co-owner to approve application for payment verification.
- No automatic part-payment approval is permitted.

### FR-05 Store Worker Down-Payment Verification

- Show applications approved for payment verification.
- Allow Store Worker to confirm cash or bank transfer received.
- Record exact down-payment transaction log: payment method, amount, date and time, receiving account or drawer reference, and Worker ID.
- Allow optional receipt image upload. **[NORMATIVE OVERRIDE: Excluded by PRD Section 6. Do not build in Version 1 per `out-of-scope.md`.]**
- Require Store Worker to check the verification box as attestation.
- Log verification event in audit trail with IP address.
- Do not activate contract at this step.
- Notify customer via manual WhatsApp: `"Payment verified. Accept your agreement to activate contract."`

### FR-06 Final Approval and Contract Activation

- Require Owner or Co-owner final approval after Store Worker verification and customer agreement acceptance.
- Enforce same-user rule: final approver `user_id` must differ from verifier `user_id` on the same application. Block with error if same user.
- Require customer agreement acceptance with recorded timestamp (`customer_accepted_at`) and OTP verification (`acceptance_otp_verified`) before final approval. Block final approval if `customer_accepted_at` is null or OTP is not verified.
- Set status to `Active Flexi-Pay Contract` after final approval.
- Record device serial number and tie it to the contract.
- Start 30-day countdown timer.
- Display remaining 20% to 30% balance.
- Send contract confirmation message via manual WhatsApp.
- No contract activation without explicit Owner or Co-owner sign-off.
- Log IP address on final approval. If IP matches verifier IP, trigger Owner in-app alert.

### FR-07 Balance Tracking and WhatsApp Reminders

- Display remaining balance and 30-day countdown timer on `Contract Detail`.
- Show a manual reminder checklist in the `Worker Dashboard` for 7 days before due, 3 days before due, 1 day before due, on due date, and on first day after due.
- Show message template per trigger (`message-templates.md`). Template includes device, remaining amount, due date, store contact.
- Manual send via `wa.me` or clipboard copy. `Mark as Sent` logs each send with sender, timestamp, trigger type, and message content in `WhatsAppReminderLog`.
- Additional manual WhatsApp notifications: `"Your application has been approved for payment verification. Please visit Shop ATF 03 to complete your down payment."` (`Template A.6`) and `"Payment verified. Accept your agreement to activate contract."` (`Template A.5`).

### FR-08 Balance and Settlement Payment Recording

- Allow Store Worker to record balance payment by cash or bank transfer on `Active Flexi-Pay Contract` contracts.
- Allow Store Worker to record settlement payment by cash or bank transfer on `Defaulted` contracts.
- Record payment method, amount, date and time, receiving account or drawer reference, and Worker ID.
- Allow partial balance payments. Partial payments do not extend the 30-day window.
- Block amounts exceeding remaining balance with error `"Amount exceeds remaining balance."`
- Set status to `Completed` when total verified payments equal locked price.
- Log all settlements in `SettlementLog` tied to the contract.

### FR-09 Default Handling

- Set status to `Defaulted` at `20:00 WAT` daily cron for `Active Flexi-Pay Contract` contracts past `19:59 WAT` on day 30 when the 30-day window expires without full verified payment.
- Apply the administrative default flag in Version 1 by flagging device serial as defaulted in admin records. This does not remotely lock or recover the device.
- Block future platform purchases for the defaulted customer until resolved. Block keyed on NIN and phone number. Block is platform only.
- Allow Owner or Co-owner to mark default `Resolved` after full remaining balance is recorded as paid.

### FR-10 Data Deletion Request

- Allow customer to submit deletion request through `Account Settings`.
- Route request to Owner or Co-owner for NDPA-compliant retention and anonymization review.
- Record decision, decision reason, and anonymized fields.
- Reject deletion when customer has an `Active Flexi-Pay Contract` or `Defaulted` contract. Reason: `"retention required"`.
- Anonymize personal data after review unless retention is required.
- Replace audit log `actor_id` reference with pseudonymous ID (via new audit rows; never mutate existing `AuditLog` rows per `BR-12` and `ndpa-compliance.md`). Owner holds mapping for legal disputes only.
- Refuse informal deletion requests with message: `"Submit a formal deletion request in Account Settings."`

### FR-11 Role-Based Access

- **Visitor:** browse inventory, filter devices, view specifications, calculate part-payment breakdown.
- **Customer:** apply for part-payment, accept agreement with OTP, view own application status, view own contract status, view own payment history, view own remaining balance, view own agreement document, submit deletion request.
- **Store Worker:** submit inventory updates for Owner approval, verify down payment, record balance and settlement payments, send logged WhatsApp reminders, view `Reserved Units`, trigger in-person OTP resend.
- **Owner or Co-owner:** review applications, grant final approval, adjust exchange rate multipliers, approve inventory changes, resolve defaults, review deletion requests, view audit log, view metrics.
- Audit log all approval, verification, price change, reminder send, agreement acceptance, and status change actions.
- IP address recorded on verification and final approval.

### FR-12 Stale Price and Out-of-Stock Checkout Refusal

- Block checkout when device has available stock of zero.
- Block checkout when price is stale.
- Show `"Confirm Current Price via WhatsApp"` action for blocked checkout.
- Do not lock price for blocked checkout.
- Show fallback message if WhatsApp is not installed: `"Call Shop ATF 03 or visit in person."`

### FR-13 Inventory and Price Updates

- Store Worker submits stock counts and base prices for Owner approval.
- Owner or Co-owner approves inventory changes, updating live stock status and base price in real time.
- Owner or Co-owner adjusts exchange rate multipliers.
- System recalculates dynamic prices in real time when exchange rate multipliers change.

### FR-14 Status Lifecycle

- Unverified visitor can browse and calculate.
- Customer status changes to `Application Pending` after valid application submission.
- Customer status changes to `Expired` when a pending application passes its 24-hour expiry. Price lock and stock reservation release.
- Customer status changes to `Rejected` when application is rejected.
- Customer status changes to `Active Flexi-Pay Contract` after down payment verification, OTP-verified acceptance, and Owner or Co-owner final approval.
- Customer status changes to `Defaulted` when 30-day window lapses (`19:59 WAT` on day 30) without full payment.
- Customer status changes to `Completed` when full payment is verified.
- Customer status changes to `Resolved` when default is settled (`remaining_amount == 0`) and cleared by Owner or Co-owner.

## Cross-section dependencies (required behaviors defined outside PRD 3.3)

| Requirement | Source section | Governing rule file | Why required |
|---|---|---|---|
| Physical tag confirmation on reserved units | PRD 7.4, 2.2.3 | `edge-cases.md` row 6 | Prevents a Store Worker from selling a reserved unit to a walk-in shopper |
| Customer pickup sign-off & pre-pickup damage handling | PRD 7.6, App C | `edge-cases.md` row 7 | Tracks physical custody handover; pause mechanism is unresolved (`edge-cases.md`) |
| Store Worker in-person OTP resend fallback | PRD 7.8, 8.3 | `api-contracts.md` (`POST /api/worker/otp-resend`) | Unblocks customers at Shop ATF 03 when cellular SMS fails |
| 24-hour account lock after password reset + Owner unlock | PRD 7.11, 9.3, 14.5 | `security-baseline.md`, `failure-modes.md` 7.11 | Prevents stolen-phone OTP password reset from immediately applying for credit |
| Cron heartbeat writes and 15-minute staleness alerts | PRD 7.12, 9.2, 14.3, 15.1 | `cron.md`, `monitoring.md` | Detects silent Vercel Cron failures before expiries or defaults are missed |
| 24-hour delay alerts for missing acceptance or missing final approval | PRD 7.7, 7.10, 11 | `notification-matrix.md`, `monitoring.md` | Alerts Owner/Co-owner when a paid application stalls |
| Health check endpoint (`GET /api/health`) | PRD 15.1 | `monitoring.md`, `api-contracts.md` | Required by Vercel uptime monitoring |
| ConsentRecord creation on registration and agreement acceptance | PRD 5.3, 13.1, 16.2 | `ndpa-compliance.md`, `data-and-schema.md` | Required for NDPA lawful basis and Version 2 readiness |
