# screen-inventory

Source: PRD Section 3.2, cross-checked against Sections 1.8, 2.3.7, 3.1, 3.3 FR-06, 6, 9.3

## Single job

This file is the complete inventory of the **29 screens** in DG Tech Store Version 1 (`7 Public`, `6 Customer`, `7 Store Worker`, `9 Owner and Co-owner`), their canonical Next.js App Router paths, allowed roles, single primary action, and key elements. Role permissions are enforced per `permission-matrix.md`; empty, loading, and error states inside each screen are governed by `ux-states.md`.

## How to use this file

- **If a screen is not in the 4 tables below, do not build it** (`working-agreements.md`).
- **Do not build standalone 404, 500, or loading pages as separate product screens:** Next.js `loading.tsx`, `error.tsx`, and `not-found.tsx` render the inline state strings from `ux-states.md` inside the screen layout.
- **Exactly one primary action per screen (`PRD 3.1`):** Render one primary CTA button (`variant="primary"`) per screen so users on small mobile screens never face competing primary actions. Secondary links or buttons are allowed only when listed in `Key Elements`.

## Reconciled PRD 3.2 conflicts (normative rules)

1. **Screen count (`29 screens`):** PRD Section 3.2 defines 29 rows (`7 + 6 + 7 + 9 = 29`). An earlier summary in `AGENTS.md` said `22 screens`; `29` is the authoritative count (`AGENTS.md` updated to match).
2. **No receipt upload on `Verify Down Payment`:** PRD 6 cuts receipt upload (`out-of-scope.md`), overriding its mention in earlier drafts of PRD 3.2.
3. **OTP entry (not checkbox) on `Agreement Acceptance`:** Consolidated PRD v1.3 Section 3.2 (`Accept with OTP`) and `FR-06` require 6-digit SMS OTP verification to accept the agreement, not a simple checkbox.
4. **Five metrics on `Success Metrics`:** PRD Section 1.8 defines 5 metrics (`success-metrics.md`), which also render at the top of `Owner Dashboard` (`PRD 15.1`).
5. **`Confirm Current Price via WhatsApp`:** Rendered as the primary blocked-checkout CTA inside `Device Detail` and `Apply for Part-Payment` (`FR-12`) and accessible at `/confirm-price/[deviceId]` so deep links and fallback text (`"Call Shop ATF 03 or visit in person."`) work consistently.
6. **`OTP Verification` role scope:** Accessible to `Visitor` (during registration), `Customer` (during agreement acceptance if routed), and `All` roles (during `Forgot Password` reset per `PRD 9.3`).

## Public screens (7 — under `app/(public)/`)

| # | Screen | Canonical route | Role | Purpose | Primary action | Key elements |
|---|---|---|---|---|---|---|
| 1 | Home / Inventory Listing | `/` | Visitor, Customer | Browse and filter devices | Click device card | Filter bar (`brand`, `category`, `performance_tier`, `battery_life`), device grid, battery life and price rendered with equal font size, weight, and prominence (`FR-01`) |
| 2 | Device Detail | `/devices/[id]` | Visitor, Customer | View specs and calculate part-payment | Apply for Part-Payment | Full specs, available stock badge, dynamic price, battery life (equal weight to price), calculator, `Apply for Part-Payment` button (or `Confirm Current Price via WhatsApp` when out of stock / stale price) |
| 3 | Login | `/login` | All | Authenticate with phone and password | Log in | Phone number input, password input, `Log in` button, link to `Register`, link to `Forgot Password` |
| 4 | Register | `/register` | Visitor | Create customer account | Register | Phone number input, password input, consent checkboxes (`Terms`, `WhatsApp`), `Register` button (triggers registration OTP) |
| 5 | OTP Verification | `/verify-otp` | Visitor, Customer, All (reset) | Verify 6-digit SMS OTP | Verify | 6-digit OTP input, `Verify` button, resend link, `"Trouble receiving OTP?"` in-person fallback note (`ux-states.md` B.6) |
| 6 | Forgot Password | `/forgot-password` | All | Recover account via OTP and set new password (applies 24h lock) | Reset | Phone number input, OTP trigger, 6-digit OTP input, new password input, `Reset` button |
| 7 | Confirm Current Price via WhatsApp | `/confirm-price/[deviceId]` (and inline modal/card on `/devices/[id]`) | Visitor, Customer | Open WhatsApp with prefilled `Template A.3` | Open WhatsApp | Prefilled `Template A.3` message preview, `Open WhatsApp` (`wa.me`) button, fallback text `"Call Shop ATF 03 or visit in person."` |

## Customer screens (6 — under `app/(customer)/`)

| # | Screen | Canonical route | Role | Purpose | Primary action | Key elements |
|---|---|---|---|---|---|---|
| 8 | Apply for Part-Payment | `/apply/[deviceId]` | Customer | Submit part-payment application | Submit | Prefilled phone, full name, 11-digit NIN, guarantor name, guarantor phone, personal details, down-payment amount (`70%–80%`), inline validation on blur (`ux-states.md` B.3) |
| 9 | Application Status | `/applications/[id]` | Customer | View application progress and next step | View contract or reapply | Status badge (`ux-states.md` B.4), 24-hour expiry countdown (when pending), rejection reason (when rejected), link to `Agreement Acceptance` (when awaiting acceptance) |
| 10 | My Applications | `/applications` | Customer | List all own applications | Open one | Chronological list of customer's applications with device name, locked price, and status badges |
| 11 | Contract Detail | `/contracts/[id]` | Customer | View active, defaulted, completed, or resolved contract | View agreement or payment history | Remaining balance, 30-day countdown timer, device serial, agreement document view, verified payment history table, `Accept Agreement` button when pending acceptance |
| 12 | Agreement Acceptance | `/applications/[id]/accept` | Customer | Read and accept contract terms with OTP | Accept with OTP | Full agreement terms (`locked_price`, `down_payment_amount`, `remaining_amount`, 30-day rules), `Send OTP` trigger, 6-digit OTP input, `Accept with OTP` button, recorded acceptance timestamp |
| 13 | Account Settings | `/settings` | Customer | Manage profile, consent, and formal data deletion | Submit deletion request | Profile summary, WhatsApp consent status (`ConsentRecord`), formal `Submit deletion request` button and status (`FR-10`) |

## Store Worker screens (7 — under `app/(worker)/`)

| # | Screen | Canonical route | Role | Purpose | Primary action | Key elements |
|---|---|---|---|---|---|---|
| 14 | Worker Dashboard | `/worker` | Store Worker | View operational queues | Open a queue | Queue cards/tabs with counts: `Payments to Verify`, `Reminder Checklist`, `Reserved Units`, `Inventory Updates`, plus customer in-person `OTP Resend` action (`PRD 7.8`) |
| 15 | Verify Down Payment | `/worker/verify/[applicationId]` | Store Worker | Confirm cash or transfer down payment received | Submit verification | Application summary (customer name, masked NIN, device, locked price, expected down payment), payment method (`CASH` / `BANK_TRANSFER`), amount, received date/time, account/drawer reference, Worker ID, mandatory verification attestation checkbox (`FR-05`, `BR-06`), manual WhatsApp `Template A.5` / `A.6` send helper |
| 16 | Record Balance Payment | `/worker/balance/[agreementId]` | Store Worker | Record partial or full payment on `Active Flexi-Pay Contract` | Submit payment | Contract summary (remaining balance, due date), amount input (blocks `> remaining_amount`), payment method, received date/time, account/drawer reference (`FR-08`) |
| 17 | Record Settlement Payment | `/worker/settlement/[agreementId]` | Store Worker | Record payment on `Defaulted` contract | Submit settlement | Defaulted contract summary (remaining balance, device serial), amount input (blocks `> remaining_amount`), payment method, received date/time, account/drawer reference (`FR-08`) |
| 18 | Reminder Checklist | `/worker/reminders` | Store Worker | Send manual WhatsApp reminders for due triggers | Mark as Sent | List of contracts due for `T-7`, `T-3`, `T-1`, `T-0`, `T+1` (plus `A.2`, `A.5`, `A.6` triggers), rendered template preview, `Open WhatsApp` (`wa.me`) and `Copy to Clipboard` buttons, `Mark as Sent` button (`FR-07`) |
| 19 | Reserved Units | `/worker/reserved` | Store Worker | View reserved stock and confirm physical shop tag | Acknowledge | List of reserved devices with application ID, customer name, reservation expiry countdown, physical tag confirmation status (`PRD 7.4`) |
| 20 | Inventory Update | `/worker/inventory` | Store Worker | Submit stock count or base price changes for Owner approval | Submit for Owner approval | Device selector/table, `stock_count` input, `base_price` input, `Submit for Owner approval` button (`FR-13`) |

## Owner and Co-owner screens (9 — under `app/(admin)/`)

| # | Screen | Canonical route | Role | Purpose | Primary action | Key elements |
|---|---|---|---|---|---|---|
| 21 | Owner Dashboard | `/admin` | Owner, Co-owner | View queues, non-dismissible health/security alerts, and top-level metrics | Open a queue | In-app alert banners (`ux-states.md` B.8), 5 `Success Metrics` summary cards (`PRD 15.1`), queues: `New Applications`, `Awaiting Final Approval`, `Defaulted Contracts`, `Deletion Requests`, `Inventory Approvals` |
| 22 | Review Application | `/admin/applications/[id]/review` | Owner, Co-owner | Approve for verification or reject pending application | Approve for verification or Reject | Customer full name, decrypted 11-digit NIN (writes `NIN_ACCESS` audit row), guarantor name and phone, personal details, device, locked price, down payment, remaining balance, 24h expiry countdown, required `rejection_reason` input for Reject (`FR-04`) |
| 23 | Final Approval | `/admin/applications/[id]/final-approve` | Owner, Co-owner | Grant final approval and activate contract | Approve | Application details, verifying Worker name and timestamp, customer OTP acceptance timestamp (`customer_accepted_at`), same-user rule check (`BR-13`), required `device_serial` input (`BR-08`), `Approve` button (`FR-06`) |
| 24 | Exchange Rate Settings | `/admin/exchange-rate` | Owner, Co-owner | Adjust global exchange-rate multiplier | Save | Current `exchange_rate_multiplier` input, live preview of recalculated `dynamic_price` across devices, `Save` button (`FR-13`) |
| 25 | Defaulted Contracts | `/admin/defaults` | Owner, Co-owner | Review defaulted contracts and mark settled ones Resolved | Mark Resolved | Defaulted contracts list with device serial, remaining balance, `SettlementLog` history, and `Mark Resolved` button (enabled only when `remaining_amount == 0` per `FR-09`) |
| 26 | Deletion Requests | `/admin/deletion-requests` | Owner, Co-owner | Process NDPA data deletion requests | Record decision | Request details, customer active/defaulted contract check, decision selector (`APPROVED` / `REJECTED`), `decision_reason` input, `anonymized_fields` checklist, `Record decision` button (`FR-10`) |
| 27 | Inventory Approvals | `/admin/inventory-approvals` | Owner, Co-owner | Approve or reject Store Worker stock/price updates | Approve or Reject | Pending Worker inventory changes showing old vs proposed `stock_count` and `base_price`, `Approve` and `Reject` buttons (`FR-13`) |
| 28 | Audit Log | `/admin/audit` | Owner, Co-owner | Inspect immutable system audit trail (50 rows/page) | Filter and view | Filters (`actor_id`, `action`, `entity_type`, date range), paginated table (50 rows/page) showing `timestamp`, `actor_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `metadata` (`FR-11`) |
| 29 | Success Metrics | `/admin/metrics` | Owner, Co-owner | Dedicated view of the 5 business metrics | View | The 5 numerical metrics with targets and formulas from `success-metrics.md` (no charts per `PRD 12`) |
