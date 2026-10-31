# workflows

Source: PRD Section 2.3, cross-checked against Sections 3.3 (FR-01 to FR-14), 3.4, 4.1 (BR-01 to BR-20), 6, 7.5, 7.10, 8.5, 11, 14.3

## Single job

This file specifies the 7 core operational workflows (`W1` through `W7`) with all branches (`Expired`, `Rejected`, `Approved for verification`) and workflow-level edge cases. Linear happy paths per persona live in `user-journeys.md`; formal state-machine tables live in `state-transitions.md`.

## Reconciled PRD 2.3 contradictions (normative rules for code)

Where earlier drafts of PRD 2.3 differed from Consolidated PRD v1.3 normative rules, enforce these exact rules so all workflows stay consistent with `business-rules.md`, `state-transitions.md`, and `functional-requirements.md`:

1. **Default cutoff time (`W5` step 1):** Consolidated PRD v1.3 `2.3.5` and `BR-03` pin the 30-day window expiry at **`19:59 WAT` on day 30** so the **`20:00 WAT` daily default cron** (`19:00 UTC`) transitions unpaid contracts on the same evening (`cron.md`). Never use `23:59 WAT`.
2. **Store Worker inventory updates (`W7` step 4):** Consolidated PRD v1.3 `FR-13` and `10` require Store Workers to **submit** stock or base-price updates for **Owner/Co-owner approval** (`POST /api/worker/inventory` -> `POST /api/admin/inventory-approvals/:id/approve`), because Workers cannot alter live prices or stock unilaterally.
3. **Receipt upload in `W3` step 6:** Excluded by PRD Section 6 (`out-of-scope.md`). Do not build receipt upload.
4. **Agreement acceptance OTP order (`W3` steps 9–11 & `FR-06`):** Customer clicks `Send OTP` (`POST /api/auth/accept-agreement-otp`), receives the 6-digit SMS OTP, and submits the OTP (`POST /api/applications/:id/accept-agreement`) to record `customer_accepted_at` and `acceptance_otp_verified = true` in a single atomic transaction (`state-transitions.md`).
5. **Empty filter state (`W1` step 3):** Render the exact string from `PRD 2.3.1` / `FR-01` / `ux-states.md` B.1: `"No devices match your filters. Clear filters to see all devices."`

## Workflow 1: Browse and Filter Inventory (10 steps — `PRD 2.3.1`)

1. Visitor opens `Home / Inventory Listing`.
2. Applies any combination of filters: `brand`, `category`, `performance_tier`, `battery_life`.
3. System queries matching devices and computes `available_stock = stock_count - reserved_count` and `dynamic_price = base_price * exchange_rate_multiplier`.
4. **Zero-match branch:** If 0 devices match, render `"No devices match your filters. Clear filters to see all devices."` (`ux-states.md` B.1).
5. Device cards display price and battery life with identical font size, font weight, and card prominence (`FR-01`).
6. Visitor clicks a device card and lands on `Device Detail`.
7. **Out-of-stock branch:** If `available_stock == 0`, disable `Apply for Part-Payment` and render `"Out of Stock. Confirm Current Price via WhatsApp."` (`ux-states.md` B.2, `Workflow 7`).
8. **Stale-price branch:** If price is stale (`exchange_rate_multiplier` changed after `last_updated_at` or `NOW() - last_updated_at > freshness_window`), disable `Apply for Part-Payment` and render `"Price may have changed. Confirm Current Price via WhatsApp."` (`ux-states.md` B.2, `Workflow 7`).
9. Visitor uses the part-payment calculator (`70%` to `80%` down payment) and sees the estimate disclaimer (`FR-02`).
10. Visitor clicks `Apply for Part-Payment`. If unauthenticated, redirect to `Login` / `Register`; if authenticated as `Customer`, open `Apply for Part-Payment`.

## Workflow 2: Apply for Part-Payment (9 steps + 3 branches = 12 steps — `PRD 2.3.2`)

1. Customer lands on `Apply for Part-Payment` with verified phone number prefilled.
2. Customer enters `full_name`, `nin`, `guarantor_name`, `guarantor_phone`, `personal_details`, and `down_payment_amount`.
3. **Inline validation on blur (`ux-states.md` B.3):**
   - `nin` must match `^\d{11}$` (`"NIN must be exactly 11 numeric digits."`).
   - `guarantor_phone` / phone must match valid Nigerian format (`"Enter a valid Nigerian phone number."`).
   - `down_payment_amount` must be between `70%` and `80%` (inclusive) of current `dynamic_price` (`"Down payment must be between [70% amount] and [80% amount]."`).
4. Customer clicks `Submit`. (No OTP is sent at application submission per `FR-03`.)
5. **Server check — purchase block & duplicate:** Block with `403 PURCHASE_BLOCKED` if customer has an unresolved `Defaulted` contract (`BR-09`), or `409 DUPLICATE_APPLICATION` if same customer + device has a pending application in the last 24h (`PRD 9.2`).
6. **Server check — stock & freshness:** If `available_stock == 0`, refuse with `409 OUT_OF_STOCK` (`"Out of Stock. Confirm Current Price via WhatsApp."`). If price is stale, refuse with `409 STALE_PRICE` (`"Price may have changed. Confirm Current Price via WhatsApp."`).
7. **Server check — live price revalidation:** If `dynamic_price` changed since the form loaded, return `409 PRICE_CHANGED` and display `"The price has changed. Old price: [X]. New price: [Y]. New range: [A] to [B]. Confirm to proceed."` (`ux-states.md` B.3) so the customer explicitly confirms or cancels before locking.
8. **Atomic submission transaction (`data-and-schema.md`):** Lock `locked_price`, increment `Inventory.reserved_count` by 1, set `expires_at = NOW() + 24 hours`, create pending `Agreement`, set `application_status = 'Application Pending'`, and write `AuditLog`.
9. Customer is redirected to `Application Status` showing `"Application Pending. Expires in [countdown]."` (`ux-states.md` B.4).
10. **Branch A — 24-hour expiry:** If still in `Application Pending` when `NOW() > expires_at`, the 5-minute expiry cron sets status `Expired`, decrements `Inventory.reserved_count`, releases the price lock, and writes `AuditLog` (`cron.md`).
11. **Branch B — Owner/Co-owner rejection:** Owner or Co-owner rejects with a required `rejection_reason`; transaction sets status `Rejected`, decrements `Inventory.reserved_count`, releases the price lock, and writes `AuditLog`. Customer sees `"Application Rejected. Reason: [Reason]."` on `Application Status`.
12. **Branch C — Owner/Co-owner approval for verification:** Owner or Co-owner approves for verification; status moves to `Awaiting Down Payment Verification` and Store Worker sends manual WhatsApp `Template A.6` (`"Your application has been approved for payment verification. Please visit Shop ATF 03 to complete your down payment."`) with a logged `WhatsAppReminderLog` entry.

## Workflow 3: Verify Down Payment, Accept Agreement, and Activate Contract (16 steps + 3 edge cases — `PRD 2.3.3`)

1. Owner or Co-owner opens pending application on `Review Application`.
2. If rejected, execute Workflow 2 Branch B.
3. If approved for verification, status becomes `Awaiting Down Payment Verification`.
4. Store Worker opens the application from `Payments to Verify` on `Verify Down Payment`.
5. Store Worker confirms cash or bank transfer physically received at Shop ATF 03.
6. Store Worker enters `payment_method`, `amount` (must equal `PartPaymentApplication.down_payment_amount`), `received_at`, `receiving_account_or_drawer_reference`, and checks `verification_checkbox` (`FR-05`, `BR-06`). *(No receipt upload per `PRD 6`.)*
7. Server extracts `verifier_ip` (`BR-19`).
8. Store Worker submits verification.
9. Inside one transaction, system inserts `DownPaymentTransaction`, sets `application_status = 'Awaiting Customer Acceptance'`, and writes `AuditLog` with `ip_address`. Contract is **not** activated yet (`FR-05`).
10. Store Worker sends manual WhatsApp `Template A.5` (`"Payment verified. Accept your agreement to activate contract."`) and logs it in `WhatsAppReminderLog`.
11. Customer opens `Agreement Acceptance`, reads the agreement terms, and clicks `Send OTP` (`POST /api/auth/accept-agreement-otp`).
12. System sends 6-digit SMS OTP; customer enters OTP and clicks `Accept` (`POST /api/applications/:id/accept-agreement`); system verifies OTP and atomically records `Agreement.customer_accepted_at`, `acceptance_otp_verified = true`, `application_status = 'Awaiting Final Approval'`, `ConsentRecord`, and `AuditLog` (`FR-06`).
13. Owner or Co-owner opens the application from `Awaiting Final Approval` on `Final Approval`.
14. System validates the same-user rule (`BR-13`): if `session.userId === DownPaymentTransaction.recorded_by_worker_id`, block with `400 SAME_USER_FORBIDDEN` (`"Final approval must be by a different user than the verifier."`).
15. System validates `Agreement.customer_accepted_at IS NOT NULL` and `acceptance_otp_verified == true` (`FR-06`); otherwise block with `400 MISSING_ACCEPTANCE` (`"Customer has not accepted the agreement. Final approval blocked."`).
16. Owner or Co-owner enters `device_serial` and clicks `Approve`: inside one transaction (`data-and-schema.md`), system sets status `Active Flexi-Pay Contract`, records `device_serial`, sets `due_date` to `19:59 WAT` on day 30 (`18:59:00 UTC`), decrements `Inventory.stock_count` and `reserved_count` by 1, writes `AuditLog` with approver `ip_address`, and triggers IP collision alert if `approver_ip === verifier_ip`. Store Worker sends manual WhatsApp `Template A.2` (Contract Confirmation) and logs it.

- **Edge case 1 (Customer does not accept within 24h of verification — `PRD 7.10`):** Application remains in `Awaiting Customer Acceptance` (no auto-expiry because down payment was already received); system displays the non-dismissible in-app alert to Owner and Co-owner (`notification-matrix.md`).
- **Edge case 2 (Same user attempts both verify and final approve — `BR-13`):** Blocked inside the final-approval transaction (`400 SAME_USER_FORBIDDEN`). Note: an Owner *may* verify a down payment if acting as Worker, provided a *Co-owner* performs the final approval.
- **Edge case 3 (IP collision on verify and final approve — `BR-19`, `PRD 7.13`):** Final approval succeeds if `user_id`s differ, but the matching IP immediately raises the non-dismissible Owner/Co-owner IP collision alert banner (`ux-states.md` B.8) requiring `AuditLog` review before further approvals.

## Workflow 4: Track Balance and Complete Contract (7 steps + 3 edge cases — `PRD 2.3.4`)

1. Customer views `Contract Detail` showing remaining balance, 30-day countdown to `due_date`, agreement text, and payment history.
2. Store Worker opens `Reminder Checklist` on `Worker Dashboard`.
3. For each due trigger, Store Worker clicks the prefilled WhatsApp link (`wa.me`) or copies the template to clipboard and clicks `Mark as Sent` (`POST /api/worker/reminders/mark-sent`), which writes a `WhatsAppReminderLog` row (`FR-07`).
4. Reminder triggers occur at **`T-7` (7 days before due), `T-3` (3 days before due), `T-1` (1 day before due), `T-0` (on due date), and `T+1` (1 day after due)** using `Template A.1` (`message-templates.md`).
5. When the customer pays toward their balance at Shop ATF 03, the Store Worker records the payment on `Record Balance Payment` (`POST /api/worker/balance-payment`).
6. Partial payments (`0 < amount < remaining_amount`) are accepted and reduce `remaining_amount` without extending the original 30-day `due_date` (`BR-14`).
7. When a payment brings `remaining_amount` to `0` (`total verified payments == locked_price`), the transaction atomically updates `Agreement.agreement_status` and `PartPaymentApplication.application_status` to `Completed` and writes `AuditLog` (`FR-08`).

- **Edge case 1 (Overpayment — `FR-08`, `PRD 7.9`):** Any payment where `amount > remaining_amount` is rejected inside the transaction with `400 OVERPAYMENT_BLOCKED` (`"Amount exceeds remaining balance."`).
- **Edge case 2 (Partial underpayment — `BR-14`, `PRD 7.9`):** Recorded as partial payment; remaining balance updates immediately and 30-day countdown is unchanged.
- **Edge case 3 (Public holiday — `Appendix C`):** Public holidays never extend the 30-day window (`edge-cases.md` row 18).

## Workflow 5: Handle Default and Resolution (6 steps + 2 edge cases — `PRD 2.3.5`)

1. At **`20:00 WAT` (`19:00 UTC`) daily**, `GET /api/cron/default-contracts` selects all contracts with `agreement_status = 'Active Flexi-Pay Contract'` and `due_date < NOW()` (where `due_date` was set to `19:59 WAT` on day 30 per `BR-03`).
2. For each overdue contract with `remaining_amount > 0`, a transaction sets status to `Defaulted`, applies the administrative default flag (`BR-09`), activates the platform purchase block keyed on customer NIN and phone, and writes `AuditLog` (`cron.md`).
3. While a customer has any `Defaulted` contract, `POST /api/applications` blocks new applications (`BR-09`, `BR-15` platform-only).
4. When the customer pays toward a `Defaulted` contract at Shop ATF 03, the Store Worker records it on `Record Settlement Payment` (`POST /api/worker/settlement-payment`), which writes `BalancePaymentTransaction`, `SettlementLog`, and `AuditLog` (`FR-08`).
5. Once `remaining_amount == 0` (`Settled`), the Owner or Co-owner opens `Defaulted Contracts` and clicks `Mark Resolved` (`POST /api/admin/defaults/:id/resolve`).
6. Inside one transaction, the server verifies `remaining_amount == 0`, sets status to `Resolved`, lifts the platform purchase block, and writes `AuditLog` (`FR-09`).

- **Edge case 1 (No Owner action after settlement):** Contract remains `Defaulted` until an Owner or Co-owner explicitly clicks `Mark Resolved` (`BR-07`, `FR-09` — no auto-resolution).
- **Edge case 2 (Partial settlement payments after day 30):** Store Worker can record multiple partial settlement payments against a `Defaulted` contract (`FR-08`); `Mark Resolved` remains blocked until `remaining_amount == 0`.

## Workflow 6: Handle Data Deletion Request (7 steps + 2 edge cases — `PRD 2.3.6`)

1. Customer submits a formal deletion request on `Account Settings` (`POST /api/customer/deletion-request`).
2. Request appears in the `Deletion Requests` queue on `Owner Dashboard`.
3. Owner or Co-owner reviews the customer's contracts, disputes, and NDPA retention obligations (`ndpa-compliance.md`).
4. Owner or Co-owner submits `POST /api/admin/deletion-requests/:id/decide` with `decision` (`APPROVED` or `REJECTED`), `decision_reason`, and `anonymized_fields`.
5. If approved (only when no `Active Flexi-Pay Contract` or `Defaulted` contract exists and the retention period in `ndpa-compliance.md` has elapsed), the transaction anonymizes `CustomerProfile` identifying fields via `UPDATE` while preserving financial transaction amounts, dates, device serials, and contract records in pseudonymized form (`FR-10`).
6. Existing `AuditLog` rows are never modified (`BR-12`); future audit references use the pseudonymous ID whose mapping is held offline by the Owner for legal disputes (`PRD 5.3`).
7. Any informal deletion request (via WhatsApp or in-person) is refused with the exact string in `FR-10`: `"Submit a formal deletion request in Account Settings."`

- **Edge case 1 (Customer has an `Active Flexi-Pay Contract` — `FR-10`):** Deletion must be rejected (`422 RETENTION_REQUIRED`, reason: `"retention required"`).
- **Edge case 2 (Customer has a `Defaulted` contract — `FR-10`):** Deletion must be rejected (`422 RETENTION_REQUIRED`, reason: `"retention required"`).

## Workflow 7: Confirm Current Price via WhatsApp (5 steps + 2 edge cases — `PRD 2.3.7`)

1. When a device on `Device Detail` or `Apply for Part-Payment` has `available_stock == 0` or a stale price, the UI blocks checkout and renders the `Confirm Current Price via WhatsApp` action (`FR-12`).
2. Clicking the action opens `https://wa.me/<shopWhatsAppNumber>?text=<encodedTemplateA3>` (`message-templates.md` `Template A.3`).
3. **Edge case — WhatsApp unavailable:** Alongside the link (or if opening `wa.me` fails), display the fallback text: `"Call Shop ATF 03 or visit in person."` (`FR-12`).
4. Store Worker receives the inquiry, submits a stock or base-price update on `Inventory Update` (`POST /api/worker/inventory`), Owner approves it on `Inventory Approvals` (`POST /api/admin/inventory-approvals/:id/approve`) or adjusts the exchange-rate multiplier (`FR-13`), and Worker replies to the customer on WhatsApp.
5. Customer manually refreshes `Device Detail` and sees the fresh price and updated stock. *( Edge case: if the customer does not refresh, the page stays stale until refreshed or revalidated on submit.)*
