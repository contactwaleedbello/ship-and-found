# user-journeys

Source: PRD Section 2.2, cross-checked against Sections 3.2, 3.3, 3.4, 6, 7.13, 11, 15.1

## Single job

This file documents the linear happy-path step sequence for each of the 4 user personas (`Visitor`, `Customer`, `Store Worker`, `Owner and Co-owner`) and flags the 4 places where PRD Section 2.2's narrative text conflicts with authoritative normative sections (`PRD 3.4`, `FR-06`, `PRD 6`, `PRD 11`). Branching logic, rejections, expiries, and defaults live in `workflows.md`.

## How to use this file

- Use these journeys to verify end-to-end navigation flow across screens in `screen-inventory.md` and to run the Day 5 morning UAT script at Shop ATF 03 (`build-plan.md`).
- **Step counts are fixed to match PRD 2.2:** Visitor (`9 steps`), Customer (`20 steps`), Store Worker (`13 steps`), Owner and Co-owner (`13 steps`).
- Where a PRD 2.2 narrative step conflicts with a normative rule in `out-of-scope.md`, `state-transitions.md`, or `functional-requirements.md`, the inline `[NORMATIVE OVERRIDE]` note below tells the agent what to actually build and why.

## Journey 1: Visitor (9 steps — `PRD 2.2.1`)

1. Land on `Home / Inventory Listing`.
2. Apply filters: brand, category, performance tier, battery life (`FR-01`).
3. Scan device cards where price and battery life render with equal visual prominence (`FR-01`).
4. Click a device card.
5. Land on `Device Detail` showing specs, available stock, dynamic price, and part-payment calculator.
6. Adjust down-payment percentage from `70%` to `80%` in the calculator; view down payment, remaining balance, and 30-day window (`FR-02`).
7. Click `Apply for Part-Payment`.
8. Because the visitor is unauthenticated, redirect to `Login` or `Register` (`FR-03`).
9. After authentication, continue into the Customer Journey.

## Journey 2: Customer — Ahmed (20 steps — `PRD 2.2.2`)

1. Register on `Register` with phone number and password, then verify phone via 6-digit SMS OTP on `OTP Verification`.
2. Land on `Home / Inventory Listing`.
3. Browse and filter devices.
4. Click `Apply for Part-Payment` on `Device Detail`.
5. Complete `Apply for Part-Payment` form: full name, 11-digit NIN, guarantor name, guarantor phone, personal details, and down-payment amount (`70%–80%` of current dynamic price per `BR-02`).
6. Submit form; run inline validation and server-side revalidation against current price and available stock (`FR-03`, `BR-04`). *(No OTP at submission per `FR-03`.)*
7. Land on `Application Status` showing `Application Pending` and the 24-hour expiry countdown.
8. Wait for Owner or Co-owner initial review.
9. Receive manual WhatsApp message (`Template A.6`) from Store Worker when application is approved for payment verification.
10. Visit Shop ATF 03 in person and pay the down payment via cash or bank transfer.
11. Store Worker records and verifies the down-payment transaction in the platform.
12. Receive manual WhatsApp message (`Template A.5`): `"Payment verified. Accept your agreement to activate contract."`
13. Open `Agreement Acceptance`, read full agreement terms, request SMS OTP, and submit OTP to accept (`FR-06`, `BR-17`). *(Normative rule: `FR-06` OTP acceptance overrides the checkbox mention in `PRD 3.2`.)*
14. Owner or Co-owner (a different user than the verifying Store Worker per `BR-13`) grants final approval.
15. Receive manual WhatsApp contract confirmation (`Template A.2`); 30-day balance countdown begins (`BR-03`).
16. View `Contract Detail` showing remaining balance, 30-day countdown timer, agreement document, and payment history.
17. Receive manual WhatsApp balance reminders from Store Worker at `T-7`, `T-3`, `T-1`, `T-0`, and `T+1` (`FR-07`, `Template A.1`).
18. Pay remaining balance in cash or bank transfer at Shop ATF 03; Store Worker records the balance payment (`FR-08`).
19. View `Completed` status on `Contract Detail` / `Application Status` once total verified payments equal `locked_price`.
20. Optionally submit a formal data deletion request from `Account Settings` (`FR-10`).

## Journey 3: Store Worker (13 steps — `PRD 2.2.3`)

*(Note: Steps 1–9 occur during down-payment verification; steps 10–13 are separate daily queue actions across the 30-day lifecycle.)*

1. Log in on `Login`.
2. Land on `Worker Dashboard` displaying queues: `Payments to Verify`, `Reminder Checklist`, `Reserved Units`, and `InventoryUpdate` navigation.
3. Open an application from `Payments to Verify`; view customer name, masked NIN (`permission-matrix.md`), device, locked price, down-payment amount, and application ID.
4. Confirm physical cash or bank transfer receipt at Shop ATF 03.
5. Record exact down-payment transaction log on `Verify Down Payment`: payment method, amount, received timestamp, receiving account or cash-drawer reference, and Worker ID (`FR-05`).
6. *(PRD 2.2.3 text says "Optionally upload receipt.")* **[NORMATIVE OVERRIDE]:** Do **not** build receipt upload—PRD Section 6 explicitly cuts receipt upload (`out-of-scope.md`).
7. Check the mandatory verification attestation checkbox and submit (`BR-06`).
8. *(PRD 2.2.3 text says "See application move to Awaiting Final Approval.")* **[NORMATIVE OVERRIDE]:** Set application state to **`Awaiting Customer Acceptance`** per `PRD 3.4` and `state-transitions.md`, because the customer has not yet accepted the agreement with OTP (`FR-06`).
9. Send manual WhatsApp (`Template A.5`: `"Payment verified. Accept your agreement to activate contract."`) and log the send. *(Note: Worker also sends `Template A.6` when Owner first approves an application for verification per `PRD 11` and `notification-matrix.md`.)*
10. Open `Reminder Checklist`, send due reminders via `wa.me` or clipboard copy, and click `Mark as Sent` (`FR-07`).
11. Open `Reserved Units`, confirm physical tag on reserved device, and prevent in-store walk-in sale of reserved stock (`PRD 7.4`).
12. Open `Inventory Update`, enter updated stock count or base price, and submit for Owner approval (`FR-13`).
13. Open `Record Balance Payment` (for `Active Flexi-Pay Contract`) or `Record Settlement Payment` (for `Defaulted` contract) and record verified payment (`FR-08`).

## Journey 4: Owner and Co-owner (13 steps — `PRD 2.2.4`)

1. Log in on `Login`.
2. Land on `Owner Dashboard` displaying queues (`New Applications`, `Awaiting Final Approval`, `Defaulted Contracts`, `Deletion Requests`, `Inventory Approvals`), active health/security alert banners, and `Success Metrics` at the top (`PRD 15.1`).
3. Open a pending application from `New Applications` on `Review Application`; inspect customer details, decrypted 11-digit NIN (logged in `AuditLog`), guarantor name and phone, device, locked price, down payment, and remaining balance (`FR-04`).
4. Approve the application for payment verification (`Awaiting Down Payment Verification`) or reject it with a required reason (`Rejected`).
5. After Store Worker payment verification and Customer OTP agreement acceptance, open the application from `Awaiting Final Approval` on `Final Approval` (same-user rule `BR-13` blocks if current user verified the down payment).
6. Grant final approval (`FR-06`): enter `device_serial`, activate `Active Flexi-Pay Contract`, set 30-day `due_date`, and trigger contract confirmation WhatsApp.
7. Open `Exchange Rate Settings` and update the multiplier; dynamic prices across all devices recalculate in real time (`FR-13`).
8. Open `Defaulted Contracts` and mark a defaulted contract `Resolved` once 100% of the remaining balance has been recorded in `SettlementLog` (`FR-09`).
9. Open `Deletion Requests`, review customer contract/dispute status, and record the decision, reason, and anonymized fields (`FR-10`).
10. Open `Inventory Approvals` and approve or reject Store Worker stock and base-price submissions (`FR-13`).
11. Open `Audit Log` to filter and inspect immutable audit entries (`FR-11`).
12. Review the 5 `Success Metrics` (`success-metrics.md`).
13. When an in-app alert banner fires (`Cron heartbeat stale`, `IP collision`, `Final approval delayed > 24h`, or `Customer acceptance missing > 24h`), inspect `AuditLog` and resolve the underlying condition before granting further approvals on that application (`PRD 7.13`, `monitoring.md`).

## Constraints

- Every step maps to an approved screen in `screen-inventory.md` and an approved state in `state-transitions.md`.
- Always follow the `[NORMATIVE OVERRIDE]` notes on Worker steps 6 and 8 so excluded features (`receipt upload`) and wrong state jumps (`skipping Awaiting Customer Acceptance`) are never built.
