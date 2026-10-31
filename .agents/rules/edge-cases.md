# edge-cases

Source: PRD Appendix C, Sections 7.4, 7.6, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13, 8.3, 10, 13.1, 14.3, 15.1, BR-13, BR-14, BR-19

## Single job

This file is the operational handling table for all **26 edge cases** (`8 High severity`, `9 Medium severity`, `9 Low severity`) from PRD Appendix C and Section 13.1. Every row must be exercised at least once during the Day 5 morning UAT walkthrough at Shop ATF 03 (`PRD 13.2`, `build-plan.md`). Underlying risk mitigations live in `failure-modes.md`.

## High severity edge cases (8 — money, asset, or security control at risk)

| # | Edge case | Responsible actor | Required system & human handling | Governing rule file |
|---|---|---|---|---|
| 1 | Customer overpays balance or settlement | System | Reject inside transaction with `400 OVERPAYMENT_BLOCKED` and exact string `"Amount exceeds remaining balance."` | `functional-requirements.md` `FR-08`, `ux-states.md` B.7 |
| 2 | Customer underpays balance partially | System | Accept partial payment (`0 < amount < remaining_amount`), recalculate `remaining_amount`, and keep `due_date` unchanged at `19:59 WAT` day 30. | `business-rules.md` `BR-14` |
| 3 | Two simultaneous applications for the last unit in stock (`PRD 13.1`) | System | Atomic `WHERE stock_count - reserved_count >= 1` update inside `prisma.$transaction`: first succeeds (`201`), second fails with `409 OUT_OF_STOCK` (`"Out of Stock. Confirm Current Price via WhatsApp."`). | `data-and-schema.md`, `non-functional.md` |
| 4 | Two simultaneous final approvals by the same user in two tabs (`PRD 13.1`) | System | Conditional `WHERE application_status = 'Awaiting Final Approval'` update inside transaction: first succeeds (`200`), second fails with `400`. | `state-transitions.md` #7, `non-functional.md` |
| 5 | Two simultaneous final approvals by different users (`Owner` and `Co-owner` — `PRD 13.1`) | System | Conditional update inside transaction: first succeeds (`200`), second fails with `409` / `400` and message `"Approved by another user."` | `state-transitions.md` #7, `ux-states.md` B.8 |
| 6 | Reserved device accidentally sold to walk-in customer while pending | Store Worker | Prevented by `Reserved Units` queue (`screen-inventory.md` #19) and physical reservation tag on the unit in Shop ATF 03; Worker acknowledges tag and blocks in-store sale of reserved stock. | `failure-modes.md` 7.4 |
| 7 | Device damaged or stolen after activation, before customer pickup (`PRD 7.6`) | Owner, Co-owner | **Unresolved schema/status gap (`AGENTS.md` Q36):** PRD 7.6 mentions pausing the 30-day timer, but no `Paused` state or column exists in `state-transitions.md` or `data-and-schema.md`. Do not invent a `Paused` status; handle via manual Owner resolution until resolved on Day 0. | `failure-modes.md` 7.6, `state-transitions.md` |
| 8 | Same IP address performs both Worker verification and Owner final approval | System, Owner | Final approval transaction detects `approver_ip === verifier_ip` (`BR-19`) and triggers the non-dismissible Owner/Co-owner alert banner (`"Same IP performed verification and final approval on this application. Review before further approvals."`). Owner audits `AuditLog` before further approvals. | `failure-modes.md` 7.13, `permission-matrix.md` #2 |

## Medium severity edge cases (9 — workflow stall or authentication recovery)

| # | Edge case | Responsible actor | Required system & human handling | Governing rule file |
|---|---|---|---|---|
| 9 | Customer loses phone network or cannot receive SMS OTP | Store Worker, Owner | Customer clicks `"Trouble receiving OTP? Visit Shop ATF 03 for in-person verification."` At Shop ATF 03, after identity verification, Store Worker triggers `POST /api/worker/otp-resend` (logged in `AuditLog`). | `failure-modes.md` 7.8, `api-contracts.md` |
| 10 | Thief with stolen phone resets customer password via OTP | System, Owner | `POST /api/auth/reset-password` locks account for 24 hours (`locked_until = NOW() + 24h`) and deletes all active sessions. Early unlock requires in-person verification by `Owner` or `Co-owner` at Shop ATF 03 (logged in `AuditLog`). | `failure-modes.md` 7.11, `security-baseline.md` |
| 11 | Customer pays down payment (`Awaiting Customer Acceptance`) but does not accept agreement within 24h | System, Owner | Application remains in `Awaiting Customer Acceptance` (no auto-expiry because cash was paid). At `+24 hours`, system displays the non-dismissible Owner/Co-owner in-app alert banner; staff follow up with the customer. | `failure-modes.md` 7.10, `notification-matrix.md` |
| 12 | Neither Owner nor Co-owner grants final approval within 24h of customer acceptance | System, Owner | Application remains in `Awaiting Final Approval` (no auto-approval per `BR-01`). At `+24 hours`, system displays the non-dismissible Owner/Co-owner in-app alert banner. | `failure-modes.md` 7.7, `notification-matrix.md` |
| 13 | Owner is the only staff member present and also verified the down payment | System | Same-user rule (`BR-13`) blocks that Owner from granting final approval (`"Final approval must be by a different user than the verifier."`). The `Co-owner` (or a separate verifying `Store Worker`) must perform one of the two roles. | `business-rules.md` `BR-13`, `permission-matrix.md` #1 |
| 14 | Store Worker unavailable when customer arrives to pay down payment | System, Owner | Application stays in `Awaiting Down Payment Verification` queue without auto-expiring (the 24-hour expiry applies only to `Application Pending` prior to Owner approval for verification). | `state-transitions.md` unresolved #2 |
| 15 | Scheduled cron job misses a run or fails | System, Owner | Heartbeat checker (`cron.md`) detects stale `last_expiry_cron_at` (`> 15m`) or `last_default_cron_at` (`> 24h 15m`) and raises the Owner alert banner (`"Cron has not run in 15 minutes. Check system health."`). Owner executes the manual catch-up runbook in `cron.md`. | `cron.md`, `failure-modes.md` 7.12 |
| 16 | WhatsApp is not installed on Worker or Customer device | Store Worker, Customer | For Worker sends: copy rendered template to clipboard, send via alternate device/WhatsApp Web, and click `Mark as Sent` (`FR-07`). For Customer `Confirm Current Price via WhatsApp`: display `"Call Shop ATF 03 or visit in person."` (`FR-12`). | `third-party.md`, `workflows.md` W7 |
| 17 | Customer submits a fabricated 11-digit NIN | System, Owner | Server validates `^\d{11}$` format; Owner/Co-owner manually inspects the decrypted NIN and guarantor details on `Review Application` and rejects if suspicious (`FR-04`). | `failure-modes.md` 7.5, `version-2-data.md` |

## Low severity edge cases (9 — policy boundaries with zero code exceptions)

| # | Edge case | Responsible actor | Required system & human handling | Governing rule file |
|---|---|---|---|---|
| 18 | Public holiday falls on or during the 30-day balance window | System | Window does not extend; `due_date` remains fixed at `19:59 WAT` on day 30 (`BR-03`). Do not build a holiday calendar or extension button. | `business-rules.md` `BR-03`, `workflows.md` W4 |
| 19 | Device dynamic price changes while Customer is filling the Apply form | System | Server detects price change on submit (`409 PRICE_CHANGED`) and renders `"The price has changed. Old price: [X]. New price: [Y]. New range: [A] to [B]. Confirm to proceed."` (`ux-states.md` B.3). | `functional-requirements.md` `FR-03`, `workflows.md` W2 |
| 20 | Customer asks to cancel a pending application | Customer, Owner | No customer self-cancel button in Version 1. Customer either waits for the 24-hour automatic expiry or asks staff so the Owner can reject the application (`Rejected`) to release the reservation immediately. | `state-transitions.md` |
| 21 | Customer requests an extension to the 30-day completion window | Owner | Strictly disallowed in Version 1 (`BR-03`, `BR-14`). Do not build a due-date edit input or extension override button. | `business-rules.md` `BR-03` |
| 22 | Customer requests data deletion informally (via WhatsApp or in person) | Store Worker, Owner | Refuse informal deletion and reply with the exact string in `FR-10`: `"Submit a formal deletion request in Account Settings."` | `ndpa-compliance.md`, `business-rules.md` `BR-10` |
| 23 | Customer with an `Active Flexi-Pay Contract` submits a deletion request | Owner, Co-owner | Reject request (`422 RETENTION_REQUIRED`) with `decision_reason = "retention required"` (`FR-10`). | `ndpa-compliance.md`, `workflows.md` W6 |
| 24 | Customer with a `Defaulted` contract submits a deletion request | Owner, Co-owner | Reject request (`422 RETENTION_REQUIRED`) with `decision_reason = "retention required"` (`FR-10`). | `ndpa-compliance.md`, `workflows.md` W6 |
| 25 | Customer attempts to return device after contract is `Completed` | Owner | Not supported in the platform (`PRD Appendix C`). Handled offline by Shop ATF 03 management; do not build a `Returned` or `Refunded` status. | `state-transitions.md`, `out-of-scope.md` |
| 26 | Customer dies or becomes permanently incapacitated during an active contract | Owner | Handled manually offline by the Owner (`PRD Appendix C`), followed by standard settlement/resolution once resolved; do not build a special status in Version 1. | `state-transitions.md` |

## Unresolved before build

Track in `working-agreements.md` and resolve on Day 0 (`build-plan.md`):

1. **Pre-pickup device damage handling (`AGENTS.md` Q36, Row 7 above):** Confirm manual offline handling vs any schema change, because `state-transitions.md` has no `Paused` state.
2. **Intermediate-state expiry (`AGENTS.md` Q37, Row 14 above):** Confirm that the 24-hour expiry cron applies only to `Application Pending` and not to `Awaiting Down Payment Verification`.
3. **24-hour customer acceptance timeout (`AGENTS.md` Q38, Row 11 above):** Confirmed as an Owner/Co-owner in-app alert banner only (`PRD 7.10`), with no automatic status change.
4. **Post-completion returns (`AGENTS.md` Q39, Row 25 above) and customer incapacity (`AGENTS.md` Q40, Row 26 above):** Confirmed as offline Owner policy outside platform state transitions.
5. **Deletion request during `Defaulted` contract (`AGENTS.md` Q41, Row 24 above):** Confirmed as mandatory rejection (`"retention required"`) per `FR-10` (`build-plan.md` decision 10).
