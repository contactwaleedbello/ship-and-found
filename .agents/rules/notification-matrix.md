# notification-matrix

Source: PRD Sections 11, Appendix F, 7.7, 7.8, 7.10, 7.12, 7.13, 8.3, 9.3, 2.3.2, 3.3 FR-05, FR-06, FR-07, 15.3, 6

## Single job

This file defines every delivered notification in DG Tech Store Version 1 (`4 SMS OTPs`, `8 manual WhatsApp sends`, and `in-app Owner dashboard alerts`) and separates them from **passive dashboard state displays** that must never trigger an outbound message. Exact message strings live in `message-templates.md`; third-party transport rules live in `third-party.md`.

## Why delivered notifications and passive state displays are separated

PRD Section 11's table lists 21 rows, mixing actual delivered messages (`SMS OTP`, `Manual WhatsApp`, `In-app dashboard alert`) with passive screen states (`In-platform status only`). Separating them prevents an agent from accidentally building an SMS, WhatsApp, or email sender for passive state changes like `Application submitted`, `Rejected`, or `Expired` (`PRD Appendix F`).

## Allowed notification channels (`PRD Appendix F`)

Only 3 notification mechanisms exist in Version 1:

1. **SMS (automated via Termii or Africa's Talking):** Used exclusively for the 4 6-digit OTP triggers below (`PRD 6`, `11`).
2. **Manual WhatsApp (human-sent by Store Worker via `wa.me` deep link or clipboard copy):** Used for the 8 customer communication triggers below (`FR-07`, `PRD 11`). Every send must be logged in `WhatsAppReminderLog` with `agreement_id` (or application reference), `trigger_type`, `sent_at`, `sent_by`, and `message_content`.
3. **In-app Owner/Co-owner dashboard alert banner:** Persistent, non-dismissible banner at the top of `Owner Dashboard` that clears only when the underlying database condition is resolved (`PRD 11`, `15.3`, `monitoring.md`).

**Banned channels (`out-of-scope.md`):** Email, web/mobile push, automated WhatsApp API, browser `Notification` API, ephemeral toast popups, and non-OTP SMS.

## Part 1: Delivered notifications

### A. SMS OTP notifications (4 triggers)

| # | Trigger event | Recipient | Calling route (`api-contracts.md`) | Template (`message-templates.md`) | PRD source |
|---|---|---|---|---|---|
| 1 | Account registration | `Visitor` | `POST /api/auth/register` | Composed OTP SMS (`6 digits`, `10m expiry`) | `PRD 11`, `9.3` |
| 2 | Forgot-password reset | `All roles` | `POST /api/auth/forgot-password` | Composed OTP SMS (`6 digits`, `10m expiry`) | `PRD 9.3`, `8.3` |
| 3 | Agreement acceptance | `Customer` | `POST /api/auth/accept-agreement-otp` | Composed OTP SMS (`6 digits`, `10m expiry`) | `PRD 11`, `FR-06` |
| 4 | Store Worker in-person OTP resend | `Customer` | `POST /api/worker/otp-resend` | Composed OTP SMS (`6 digits`, `10m expiry`) | `PRD 7.8`, `8.3` |

### B. Manual WhatsApp notifications sent by Store Worker (8 triggers)

| # | Trigger event | Recipient | When Worker sends it | Template ID (`message-templates.md`) | Logged in `WhatsAppReminderLog`? |
|---|---|---|---|---|---|
| 1 | Approved for payment verification | `Customer` | After Owner/Co-owner approves application for verification (`Awaiting Down Payment Verification`) | `Template A.6` | Yes (`APPROVED_FOR_VERIFICATION`) |
| 2 | Down payment verified | `Customer` | Immediately after Store Worker records and verifies down payment (`Awaiting Customer Acceptance`) | `Template A.5` | Yes (`PAYMENT_VERIFIED`) |
| 3 | Contract activated | `Customer` | Immediately after Owner/Co-owner grants final approval (`Active Flexi-Pay Contract`) | `Template A.2` | Yes (`CONTRACT_CONFIRMATION`) |
| 4 | Balance reminder — 7 days before due | `Customer` | From `Reminder Checklist` when `due_date - NOW()` is 7 days | `Template A.1 T-7` | Yes (`T-7`) |
| 5 | Balance reminder — 3 days before due | `Customer` | From `Reminder Checklist` when `due_date - NOW()` is 3 days | `Template A.1 T-3` | Yes (`T-3`) |
| 6 | Balance reminder — 1 day before due | `Customer` | From `Reminder Checklist` when `due_date - NOW()` is 1 day | `Template A.1 T-1` | Yes (`T-1`) |
| 7 | Balance reminder — on due date | `Customer` | From `Reminder Checklist` on the calendar day of `due_date` | `Template A.1 T-0` | Yes (`T-0`) |
| 8 | Balance reminder — 1 day after due | `Customer` | From `Reminder Checklist` 1 day after `due_date` | `Template A.1 T+1` | Yes (`T+1`) |

*(Note: Visitor/Customer-initiated `Confirm Current Price via WhatsApp` uses `Template A.3` outbound to Shop ATF 03 per `workflows.md` W7; it is a user-initiated inquiry rather than a store-sent notification.)*

### C. In-app Owner and Co-owner alert banners (`PRD 11`, `15.3`, `monitoring.md`)

All alerts below render as non-dismissible banners at the top of `Owner Dashboard` for both `Owner` and `Co-owner`, using the exact copy in `ux-states.md` B.8:

| # | Alert trigger | Condition that activates banner | Condition that clears banner | PRD source |
|---|---|---|---|---|
| 1 | Final approval delayed > 24h | Application is in `Awaiting Final Approval` and `NOW() - Agreement.customer_accepted_at > 24 hours` | Owner or Co-owner grants final approval | `PRD 7.7`, `11` |
| 2 | Customer acceptance missing > 24h | Application is in `Awaiting Customer Acceptance` and `NOW() - DownPaymentTransaction.verified_at > 24 hours` | Customer completes OTP agreement acceptance | `PRD 7.10`, `11` |
| 3 | Cron heartbeat stale | `NOW() - Settings.last_expiry_cron_at > 15m` OR `NOW() - Settings.last_default_cron_at > 24h 15m` (`monitoring.md` tracks both heartbeats) | Next successful cron run updates the timestamp in `Settings` | `PRD 7.12`, `11`, `15.3` |
| 4 | IP collision on verify and approve | `DownPaymentTransaction.verifier_ip === finalApprovalAuditLog.ip_address` on the same application | Owner reviews `AuditLog` and records acknowledgement (`monitoring.md`) | `BR-19`, `PRD 7.13`, `11` |

*(Note: `monitoring.md` and `PRD 15.3` also surface operational 5xx error-rate and deploy-failure visibility; see `monitoring.md` for threshold details.)*

## Part 2: Passive dashboard state displays (NEVER send a message)

The following events update database state and are visible when the user opens their dashboard or status screen. **Do not send an SMS, WhatsApp, or alert banner for any of these:**

- **Customer `Application Status` / `Contract Detail` / `Account Settings` screens:**
  - `Application submitted` (`Application Pending` with 24h countdown)
  - `Application rejected` (`Rejected` with `rejection_reason`)
  - `Application expired` (`Expired` with reapply button)
  - `Awaiting Final Approval`
  - `Contract completed` (`Completed`)
  - `Contract defaulted` (`Defaulted` — note that the manual `T+1` WhatsApp reminder is a Worker checklist item, not an automated cron message)
  - `Default resolved` (`Resolved`)
  - `Deletion request decided` (`Account Settings`)
- **Store Worker `Worker Dashboard` queues:** `Payments to Verify`, `Reminder Checklist`, `Reserved Units`, `Inventory Updates`.
- **Owner and Co-owner `Owner Dashboard` queues:** `New Applications` (new submissions appear silently in this queue with zero outbound notification), `Awaiting Final Approval`, `Defaulted Contracts`, `Deletion Requests`, `Inventory Approvals`, `Success Metrics`.

## Unresolved before build

Track in `working-agreements.md` and resolve on Day 0 (`build-plan.md`):

1. **Escalation after `T+1` reminder (`build-plan.md` decision 17 / `AGENTS.md` Q23):** Confirm that after the `T+1` manual WhatsApp reminder is sent and the contract is `Defaulted`, further follow-up is handled offline by Shop ATF 03 management with no additional in-app reminder triggers in Version 1.
2. **Schema link for pre-agreement WhatsApp logs (`Template A.6` and `Template A.5`):** `WhatsAppReminderLog` has `agreement_id` (`PRD 5.1`), and a pending `Agreement` row is generated at application submission (`FR-03`, `state-transitions.md` #1). Confirm that `Template A.6` and `A.5` logs reference that pending `Agreement.agreement_id`.
