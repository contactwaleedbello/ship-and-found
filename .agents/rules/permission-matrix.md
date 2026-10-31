# permission-matrix

Source: PRD Sections 10, 9.3, 4.1 BR-11, BR-13, BR-19, 7.11, 7.13, 3.3 FR-06, FR-11, 14.5

## Single job

This file is the authoritative role-by-resource access control matrix across all 5 personas (`Visitor`, `Customer`, `Store Worker`, `Owner`, `Co-owner`) and the 9 server-side enforcement invariants. If `api-contracts.md` and this file ever disagree on who may perform an action, this file wins.

## Authoritative role permission grid (40 rows — `PRD 10`)

The `Co-owner` column mirrors the `Owner` column on every row (`PRD 2.1`), subject to the same `BR-13` same-user constraint on final approval:

| # | Resource or Action | Visitor | Customer | Store Worker | Owner | Co-owner |
|---|---|---|---|---|---|---|
| 1 | Browse inventory | Yes | Yes | Yes | Yes | Yes |
| 2 | Filter devices | Yes | Yes | Yes | Yes | Yes |
| 3 | View device specs | Yes | Yes | Yes | Yes | Yes |
| 4 | Use part-payment calculator | Yes | Yes | Yes | Yes | Yes |
| 5 | Confirm Current Price via WhatsApp (`Template A.3`) | Yes | Yes | Yes | Yes | Yes |
| 6 | Register new Customer account | Yes | No | No | No | No |
| 7 | Verify registration OTP | Yes | No | No | No | No |
| 8 | Log in | Yes | Yes | Yes | Yes | Yes |
| 9 | Log out | No | Yes | Yes | Yes | Yes |
| 10 | Forgot password (request reset OTP) | Yes | Yes | Yes | Yes | Yes |
| 11 | Reset password (triggers 24h account lock) | Yes | Yes | Yes | Yes | Yes |
| 12 | Submit part-payment application | No | Yes | No | No | No |
| 13 | Request & verify OTP to accept agreement | No | Yes (own) | No | No | No |
| 14 | View own application status & list | No | Yes (own) | No | No | No |
| 15 | View own contract detail & countdown | No | Yes (own) | No | No | No |
| 16 | View own payment history | No | Yes (own) | No | No | No |
| 17 | View own agreement document | No | Yes (own) | No | No | No |
| 18 | View own NIN after submission | No | Unresolved (Day 0) | No | Yes | Yes |
| 19 | Submit formal data deletion request | No | Yes (own) | No | No | No |
| 20 | View all applications queue list | No | No | No | Yes | Yes |
| 21 | View single application detail | No | Yes (own only; `404` otherwise) | Yes (verify queue, masked NIN) | Yes (full NIN, audited) | Yes (full NIN, audited) |
| 22 | Approve application for verification | No | No | No | Yes | Yes |
| 23 | Reject pending application (with reason) | No | No | No | Yes | Yes |
| 24 | Grant final approval & activate contract | No | No | No | Yes, if `user_id !== verifier_id` (`BR-13`) | Yes, if `user_id !== verifier_id` (`BR-13`) |
| 25 | Verify down payment | No | No | Yes | No (unless acting as Worker, which then blocks final approval per `BR-13`) | No (unless acting as Worker, which then blocks final approval per `BR-13`) |
| 26 | Record balance payment (`Active` contract) | No | No | Yes | No | No |
| 27 | Record settlement payment (`Defaulted` contract) | No | No | Yes | No | No |
| 28 | View Reminder Checklist & mark WhatsApp sent | No | No | Yes | No | No |
| 29 | View Reserved Units & acknowledge physical tag | No | No | Yes | Yes (read) | Yes (read) |
| 30 | Trigger in-person Customer OTP resend (`PRD 7.8`) | No | No | Yes | No | No |
| 31 | Submit inventory stock/base-price update | No | No | Yes (submit only) | No | No |
| 32 | Approve Store Worker inventory change | No | No | No | Yes | Yes |
| 33 | Reject Store Worker inventory change | No | No | No | Yes | Yes |
| 34 | Adjust exchange-rate multiplier | No | No | No | Yes | Yes |
| 35 | Mark settled `Defaulted` contract `Resolved` | No | No | No | Yes (only when `remaining_amount == 0`) | Yes (only when `remaining_amount == 0`) |
| 36 | Review & decide data deletion requests | No | No | No | Yes | Yes |
| 37 | Unlock 24h password-reset-locked account (`PRD 7.11`) | No | No | No | Yes | Yes |
| 38 | View `Audit Log` (read-only) | No | No | No | Yes | Yes |
| 39 | View `Success Metrics` | No | No | No | Yes | Yes |
| 40 | View customer NIN | No | Unresolved | Masked only (`*******1234`) | Full 11 digits on detail view (writes `NIN_ACCESS` audit row) | Full 11 digits on detail view (writes `NIN_ACCESS` audit row) |

*(Note: PRD Section 10 row `"View receipt images"` is omitted from Version 1 runtime because receipt upload is excluded by PRD Section 6 per `out-of-scope.md`.)*

## 9 hard server-side enforcement constraints

Every constraint below must be enforced on the server (`lib/auth/api-guard.ts` and `lib/services/*`), never solely by hiding UI buttons, because client UI checks can be bypassed via direct HTTP requests:

1. **Same-user rule (`BR-13`):** Inside the `final-approve` database transaction (`state-transitions.md`), reject with `400 SAME_USER_FORBIDDEN` (`"Final approval must be by a different user than the verifier."`) if `session.userId === DownPaymentTransaction.recorded_by_worker_id`.
2. **IP collision detection (`BR-19`, `PRD 7.13`):** Inside the `final-approve` transaction, if `approverIp === DownPaymentTransaction.verifier_ip`, create the non-dismissible Owner/Co-owner in-app alert (`notification-matrix.md`).
3. **No account sharing (`BR-19`):** Every staff member has an individual `User` row; `AuditLog.actor_id` and `ip_address` anchor accountability on every action.
4. **IDOR `404` protection (`PRD 13.4`):** When a `Customer` requests any resource (`/api/applications/:id`, `/api/contracts/:id`) belonging to a different `customer_id`, return **`404 Not Found`**, never `403 Forbidden`, so resource UUIDs cannot be enumerated (`api-design.md`).
5. **Strict `/api/admin/*` and `/api/worker/*` boundary (`PRD 13.1`, `13.4`):** Any request to `/api/admin/*` by a non-`Owner`/non-`Co-owner` (including a `Store Worker`) returns `403 Forbidden` before the route handler executes. Any request to `/api/worker/*` by a `Customer` or `Visitor` returns `403 Forbidden`.
6. **Role and identity from server session only:** Never read `role`, `user_id`, `customer_id`, or `recorded_by_worker_id` from request body, query params, or custom headers (`api-design.md`).
7. **Server-side NIN masking (`PRD 9.3`):** Mask the NIN in the API response mapper before JSON serialization whenever `session.role === 'STORE_WORKER'`. Never send all 11 digits to a Worker client and mask in CSS/JS.
8. **Insert-only `AuditLog` (`BR-12`):** No role (not even `Owner`) has permission to `UPDATE` or `DELETE` rows in `AuditLog`; enforced at the PostgreSQL grant level (`data-and-schema.md`).
9. **Customer own-data query scoping:** Every `Customer` query includes `WHERE customer_id = :sessionCustomerId` at the Prisma query layer.

## Unresolved before build

Track in `working-agreements.md` and resolve on Day 0 (`build-plan.md`):

1. **Customer viewing own NIN after submission (`build-plan.md` decision 8 / `AGENTS.md` Q20):** Confirm whether `GET /api/applications/:id` masks or omits NIN when called by the owning `Customer`.
2. **Owner/Co-owner full NIN display screens (`AGENTS.md` Q21):** Confirm that decrypted NIN is returned only on `Review Application` and `Deletion Requests` detail responses, and omitted from list responses (`GET /api/admin/applications`).
3. **Exact Worker NIN mask format (`AGENTS.md` Q22, Q51):** Confirm `*******1234` (first 7 digits masked with asterisks, last 4 digits visible) so the Worker can verbally confirm the last 4 digits with the customer in shop without seeing the full NIN.
