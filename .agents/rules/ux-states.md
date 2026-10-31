# ux-states

Source: PRD Appendix B (B.1 through B.8), Sections 3.1, 3.3 FR-01, FR-02, FR-08, FR-10, FR-12, 3.4, 9.1, 9.2, 9.3, 10

## Single job

This file holds the exact UI copy for global states (auth expiry, 403, 404, offline, 500, submitting, 429) and per-screen empty, loading, error, and status states (`PRD Appendix B`). Delivered SMS and WhatsApp templates live in `message-templates.md`.

## How to use this file

- **Render exact strings verbatim:** Do not reword, paraphrase, or add emoji to any string in this file, because automated tests (`PRD 13.1`) and UAT scripts check for exact copy.
- **Single inline banner location (`accessibility-baseline.md`):** Render screen-level error and alert strings in a persistent inline banner (`role="alert"`) at the top of the primary `<main>` content area—never in ephemeral toast notifications, browser `alert()` popups, or modals, because toasts disappear before screen-reader users or distracted shop workers can read them.
- **Field-level validation errors:** Render inline directly beneath the invalid `<input>` connected via `aria-invalid="true"` and `aria-describedby` (`accessibility-baseline.md`).
- **Double-submit protection on every form (`PRD 3.1`):** Disable the primary submit button immediately on submit and change its label to `"Submitting..."` until the response returns.

## Global states (apply to all 29 screens)

| Condition | Exact UI display / behavior | Source |
|---|---|---|
| Session expired or unauthenticated (`401`) | `"Your session has expired. Please log in again."` and redirect to `/login` | `PRD 9.3` |
| Forbidden role (`403 FORBIDDEN`, e.g., Worker hits `/admin/*`) | `"You do not have permission to view this page."` | `PRD 10`, `permission-matrix.md` |
| Resource not found or cross-customer IDOR (`404 NOT_FOUND`) | `"The page you are looking for does not exist."` | `PRD 10`, `13.4`, `api-design.md` |
| Network offline or `fetch` network error | `"Could not connect. Check your connection and try again."` | `PRD 9.1` |
| Unhandled server error (`500` / `503`) | `"Something went wrong on our end. Try again."` | `PRD 9.2`, `security-baseline.md` |
| Form submission in flight | Primary button disabled (`disabled={true}`, `aria-busy="true"`), label shows `"Submitting..."` | `PRD 3.1` |
| Rate limit exceeded (`429 RATE_LIMIT_EXCEEDED`) | `"Too many requests. Wait a moment and try again."` | `PRD 9.3`, `api-design.md` |

## Per-screen states (`PRD Appendix B` verbatim)

### B.1 Home / Inventory Listing (`/`)
- **Empty (0 filter matches — `FR-01`):** `"No devices match your filters. Clear filters to see all devices."`
- **Loading:** Skeleton cards in device grid (`aria-busy="true"`).
- **Error:** `"Could not load devices. Check connection and try again."`

### B.2 Device Detail (`/devices/[id]`)
- **Out of stock (`available_stock == 0` — `FR-12`):** `"Out of Stock. Confirm Current Price via WhatsApp."`
- **Stale price (`!is_price_fresh` — `FR-12`):** `"Price may have changed. Confirm Current Price via WhatsApp."`
- **Calculator disclaimer (`FR-02`):** `"This is an estimate. Final amount is validated at application submission."`
- **Loading:** Skeleton layout for specs, stock, battery life, and price.
- **Error:** `"Could not load device. Refresh to try again."`

### B.3 Apply for Part-Payment (`/apply/[deviceId]`)
- **NIN error (`FR-03`):** `"NIN must be exactly 11 numeric digits."`
- **Phone error (`FR-03`):** `"Enter a valid Nigerian phone number."`
- **Down payment error (`BR-02`):** `"Down payment must be between [70% amount] and [80% amount]."` *(Format `[70% amount]` and `[80% amount]` as Naira, e.g., `₦210,000` and `₦240,000`.)*
- **Price change notice (`FR-03`):** `"The price has changed. Old price: [X]. New price: [Y]. New range: [A] to [B]. Confirm to proceed."`
- **Out of stock block (`FR-12`):** `"Out of Stock. Confirm Current Price via WhatsApp."`
- **Stale price block (`FR-12`):** `"Price may have changed. Confirm Current Price via WhatsApp."`
- **Submit error:** `"Could not submit application. Refresh and try again."`

### B.4 Application Status (`/applications/[id]`)
- **Expired:** `"Application Expired. Reapply to try again."`
- **Rejected (`PRD Appendix B.4` verbatim):** `"Application Rejected. Reason: [Reason]."` *(Render alongside the `Reapply` action button per `screen-inventory.md` #9.)*
- **Pending (`Application Pending`):** `"Application Pending. Expires in [countdown]."`
- **Approved for verification (`Awaiting Down Payment Verification`):** `"Approved for payment verification. Visit Shop ATF 03."`
- **Awaiting acceptance (`Awaiting Customer Acceptance`):** `"Payment verified. Accept your agreement to activate contract."`
- **Awaiting final approval (`Awaiting Final Approval`):** `"Awaiting final approval from store management."`
- **Active (`Active Flexi-Pay Contract`):** `"Contract Active. [Countdown] to due."`
- **Completed (`Completed`):** `"Contract Completed. Thank you."`
- **Defaulted (`Defaulted`):** `"Contract Defaulted. Visit Shop ATF 03 to resolve."`

*(Note: As documented in `state-transitions.md`, `"Approved for verification"`, `"Awaiting acceptance"`, and `"Awaiting final approval"` map to the 3 intermediate `PartPaymentApplication.application_status` states while high-level customer status remains `Application Pending`.)*

### B.5 Contract Detail (`/contracts/[id]`)
- **Loading:** Skeleton for remaining balance, 30-day countdown, agreement terms, and payment history table.
- **Error:** `"Could not load contract. Refresh to try again."`

### B.6 Agreement Acceptance (`/applications/[id]/accept`) and OTP entry (`PRD Appendix B.6`)
- **OTP not received (`PRD 7.8`):** `"Trouble receiving OTP? Visit Shop ATF 03 for in-person verification."`
- **Incorrect OTP (`< 3` failed attempts):** `"Incorrect OTP. [Attempts remaining] attempts remaining."`
- **Expired OTP (`> 10` minutes):** `"OTP expired. Request a new one."`

### B.7 Store Worker Screens (applies to `Worker Dashboard`, `Verify Down Payment`, `Record Balance Payment`, `Record Settlement Payment`, `Reminder Checklist`, `Reserved Units`, `Inventory Update`)
- **Empty queue:** `"No items in this queue."`
- **Loading:** Skeleton table rows (`aria-busy="true"`).
- **Error:** `"Could not load queue. Refresh to try again."`
- **Overpayment block (`FR-08`, `PRD 7.9`):** `"Amount exceeds remaining balance."`
- **Same-user block (`BR-13`):** `"Final approval must be by a different user than the verifier."`

### B.8 Owner and Co-owner Screens (applies to `Owner Dashboard`, `Review Application`, `Final Approval`, `Exchange Rate Settings`, `Defaulted Contracts`, `Deletion Requests`, `Inventory Approvals`, `Audit Log`, `Success Metrics`)
- **Empty queue:** `"No items in this queue."`
- **Loading:** Skeleton table rows (`aria-busy="true"`).
- **Error:** `"Could not load queue. Refresh to try again."`
- **Same-user block (`BR-13`):** `"Final approval must be by a different user than the verifier."`
- **Missing customer acceptance block (`FR-06`):** `"Customer has not accepted the agreement. Final approval blocked."`
- **IP collision alert banner (`BR-19`, `PRD 7.13`):** `"Same IP performed verification and final approval on this application. Review before further approvals."`
- **Cron heartbeat warning banner (`PRD 7.12`, `15.3`):** `"Cron has not run in 15 minutes. Check system health."`
- **Concurrent approval conflict (`PRD 13.1`, `edge-cases.md` row 5):** `"Approved by another user."`

### Additional normative strings defined in `FR-10` and `FR-12`
- **Informal deletion refusal (`FR-10`):** `"Submit a formal deletion request in Account Settings."`
- **WhatsApp unavailable fallback on `Confirm Current Price via WhatsApp` (`FR-12`):** `"Call Shop ATF 03 or visit in person."`
- **Repeat browsing rate placeholder on `Success Metrics` (`success-metrics.md`):** `"Not available"` (and `"Baseline placeholder"` for `Applications per week` and `Repeat browsing rate`).

## Screen coverage reconciliation and remaining Day 0 strings

PRD Appendix B explicitly covers:
1. The 6 primary Customer/Public screens in `B.1`–`B.6` (`Home`, `Device Detail`, `Apply for Part-Payment`, `Application Status`, `Contract Detail`, `Agreement Acceptance`).
2. All **7 Store Worker screens** via `B.7 Store Worker Screens` (queue empty/loading/error + overpayment + same-user strings) and `B.3` form validation reuse.
3. All **9 Owner and Co-owner screens** via `B.8 Owner and Co-owner Screens` (queue empty/loading/error + same-user + missing acceptance + IP collision + cron warning strings).

The remaining **7 Public/Customer screens** (`Login`, `Register`, `OTP Verification`, `Forgot Password`, `Confirm Current Price via WhatsApp`, `My Applications`, `Account Settings`) reuse `B.3` phone validation (`"Enter a valid Nigerian phone number."`), `B.6` OTP states, `B.7`/`B.8` empty list pattern, and `FR-12` fallback text, except for the specific auth/account error strings listed under `Unresolved before build` below.

## Unresolved before build

Track in `working-agreements.md` and confirm exact strings on Day 0 before building Day 1 auth screens (`AGENTS.md` Q27–Q35, Q53):

1. **OTP lockout string after 3 failed attempts (`AGENTS.md` Q28, Q53):** Proposed default: `"Too many incorrect OTP attempts. Request a new OTP."`
2. **OTP rate-limit string (`10/hr` or `5/min` exceeded — `AGENTS.md` Q29):** Reuses global rate-limit string `"Too many requests. Wait a moment and try again."` unless a custom string is chosen on Day 0.
3. **`Login` error strings (`AGENTS.md` Q30):** Confirm exact strings for invalid credentials (`"Invalid phone number or password."`) and 24-hour password-reset lock (`"Account locked for 24 hours after password reset. Visit Shop ATF 03 for in-person verification."`).
4. **`Register` error strings (`AGENTS.md` Q31):** Confirm exact strings for duplicate phone (`"Phone number is already registered. Please log in."`) and password `< 8` chars (`"Password must be at least 8 characters."`).
5. **`Forgot Password` error strings (`AGENTS.md` Q32):** Confirm exact copy when phone is not found (or return generic OTP-sent message to prevent phone enumeration).
6. **`Confirm Current Price via WhatsApp` action states (`AGENTS.md` Q33):** Uses `FR-12` fallback `"Call Shop ATF 03 or visit in person."`
7. **`My Applications` empty and error strings (`AGENTS.md` Q34):** Confirm `"You have no applications yet."` and `"Could not load applications. Refresh to try again."`
8. **`Account Settings` deletion request confirmation string (`AGENTS.md` Q35):** Confirm `"Deletion request submitted for review."`
9. **Owner 24h delay alert banner strings (`PRD 7.7`, `7.10`, `11`):** Confirm exact banner strings for `Final approval delayed past 24h` and `Customer acceptance missing past 24h`.
