# False-Success Scenarios and Prevention (`docs/false-success.md`)

Source: [`.agents/rules/data-and-schema.md`](../.agents/rules/data-and-schema.md); [`.agents/rules/api-design.md`](../.agents/rules/api-design.md); [`.agents/rules/state-transitions.md`](../.agents/rules/state-transitions.md); [`.agents/rules/business-rules.md`](../.agents/rules/business-rules.md); [`.agents/rules/observability-baseline.md`](../.agents/rules/observability-baseline.md).

## 1. What Constitutes a "False Success" in DG Tech Store

A **false success** occurs when the application returns an HTTP `2xx` status code, displays a green confirmation state, or advances a workflow step when the underlying business invariant, database write, or external side effect actually failed or was only partially committed. In a retail part-payment platform handling physical inventory (`Shop ATF 03`) and Naira payments, false successes cause inventory double-selling, unverified contract activations, or silent audit trail gaps.

---

## 2. Catalog of Identified False-Success Scenarios & Prevention Controls

| # | False-Success Scenario | How Identified | Prevention / Architectural Control | Governing Rule | Verification Status |
|---|---|---|---|---|---|
| **FS-01** | **Final Approval Activates Contract Without All 3 Prerequisites** (e.g., missing Worker down-payment verification, missing Customer OTP agreement acceptance, or Approver `===` Verifier) | Root [`AGENTS.md`](../AGENTS.md) "One thing the agent must do well" & `BR-13` | Inside a single `prisma.$transaction`, re-query `DownPaymentTransaction` (`verification_checkbox === true` and `verifier_ip` present), `Agreement` (`customer_accepted_at !== null` and `acceptance_otp_verified === true`), and assert `approverUserId !== verifierUserId`. If any check fails, throw `AppError` (`400`/`409`) and roll back the entire transaction. | `AGENTS.md` line 32; `state-transitions.md`; `BR-13` | Constant & error codes scaffolded in Phase 1 (`lib/constants.ts`, `lib/errors.ts`); transactional test scheduled in Phase 3/4 |
| **FS-02** | **Last-Unit Stock Reservation Race Returns `201 Created` to Two Simultaneous Applicants** | PRD Section 7.1 & 13.1 concurrency requirement | Never check `stock_count - reserved_count >= 1` in application memory before a separate `UPDATE`. Execute an atomic conditional update inside `prisma.$transaction` (`WHERE stock_count - reserved_count >= 1`). If updated row count is `0`, roll back and return `409 OUT_OF_STOCK`. | `data-and-schema.md` Transaction Boundaries row 1; `FR-03` | Error code `OUT_OF_STOCK` (`409`) defined in `lib/errors.ts`; DB concurrency test scheduled in Phase 3 |
| **FS-03** | **Status Transition Commits Without `AuditLog` Entry** | `ndpa-compliance.md` & `data-and-schema.md` | Every write service passes its active Prisma transaction client (`tx`) into `auditService.log(tx, ...)`. If the `AuditLog` insert fails, the entire business transaction rolls back. | `ndpa-compliance.md`; `code-conventions.md` line 92 | Enforced by module boundary in `docs/architecture.md` |
| **FS-04** | **API Returns `200 OK` with `{ success: false }` or Swallowed Exception** | `api-design.md` & `code-conventions.md` forbidden pattern #13 | All route handlers use `handleApiError(error, requestId)` in `lib/errors.ts`, which maps `ZodError` to HTTP `400`, `AppError` to its exact HTTP `4xx` status code, and unhandled exceptions to HTTP `500` with `x-request-id`. Empty `catch {}` blocks are forbidden. | `api-design.md`; `code-conventions.md` | Verified in `lib/errors.ts` in Phase 1 |
| **FS-05** | **Health Endpoint Reports `200 OK / healthy` When Database Is Unconfigured or Unreachable** | `monitoring.md` & Prompt §10.15 ("Do not conceal incomplete work behind successful-looking interfaces") | `GET /api/health` (`app/api/health/route.ts`) inspects actual environment/database readiness and reports explicit component status (`database: "unconfigured"` in Phase 1 before DB setup, and real `SELECT 1` latency in Phase 2+) rather than faking a green DB connection. | `monitoring.md`; `observability-baseline.md`; Prompt §10.15 | Implemented and verified in `app/api/health/route.ts` in Phase 1 |
| **FS-06** | **Manual WhatsApp Reminder Marked "Sent" Before Worker Triggers Send/Copy** | `notification-matrix.md` & `FR-07` | Version 1 has no automated WhatsApp API (`out-of-scope.md`). The UI requires the Worker to click `Open WhatsApp` (`wa.me`) or `Copy to Clipboard` first, and only writes to `WhatsAppReminderLog` when the Worker explicitly clicks `Mark as Sent`. | `notification-matrix.md`; `FR-07` | Documented in `docs/information-design.md`; UI & API wired in Phase 4 |
| **FS-07** | **Balance or Settlement Payment Overpays Contract Balance (`amount > remaining_amount`)** | `FR-08` & `BR-14` | Lock the `Agreement` row inside `prisma.$transaction`, compute `remaining_amount`, and throw `AppError('OVERPAYMENT_BLOCKED', 422, 'Amount exceeds remaining balance.')` if `amount > remaining_amount`. | `FR-08`; `ux-states.md` B.5; `data-and-schema.md` | Error constant & `ux-states.md` string defined in `lib/constants.ts` and `lib/errors.ts` in Phase 1 |

---

## 3. Evidence Cross-Reference

- **Phase 1 Verification:** [`lib/errors.ts`](../lib/errors.ts), [`lib/constants.ts`](../lib/constants.ts), and [`app/api/health/route.ts`](../app/api/health/route.ts) implement typed error envelopes, exact `ux-states.md` rejection messages, and honest health reporting.
- **Phase 3 Database Write & Failure Evidence (Pending Phase 3 DB Approval):**
  - `evidence/11-write-succeeded-logs.txt` — Real structured JSON logs of a committed transactional write.
  - `evidence/12-database-rows.png` — Screenshot of actual committed PostgreSQL rows.
  - `evidence/13-write-failed-logs.txt` — Real structured JSON logs of a rejected/rolled-back write proving false-success prevention.

