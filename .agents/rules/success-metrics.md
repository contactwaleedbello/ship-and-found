# success-metrics

Source: PRD Sections 1.8, 3.2, 8.3, 12, 15.1

## Single job

This file defines the 5 business success metrics displayed to the `Owner` and `Co-owner`, their exact formulas, their targets, and how to handle metrics whose underlying data or definition has an unresolved PRD gap. Role access is in `permission-matrix.md`; API route is `GET /api/admin/metrics` in `api-contracts.md`.

## Why there are 5 metrics

PRD Section 3.2 describes `Success Metrics` as `"Four to five metrics with formulas"`, while PRD Sections 1.8, 8.3, and 15.1 explicitly define **5** metrics. Section 1.8 is authoritative: always return all 5 metric slots from `GET /api/admin/metrics` and render them as numbers only (no charts per `PRD 12` Day 5 scope).

## The 5 metrics (`PRD 1.8`)

### 1. Applications per week

- **PRD definition:** Count of submitted applications. Baseline placeholder.
- **Target:** None (`"Baseline placeholder"`). Render the integer count alongside the label `"Baseline placeholder"`—never invent a numeric target.
- **Formula:** `COUNT(PartPaymentApplication)` where `created_at` falls within the current 7-day window.
- **Unresolved gap (`Unresolved before build` item 1):** PRD 1.8 does not state whether "per week" means rolling last 7 days (`NOW() - INTERVAL '7 days'`) or Monday–Sunday WAT calendar week. Until confirmed on Day 0, default to rolling last 7 days or render `"Not available"`.

### 2. Approval to activation rate

- **PRD definition:** Activated contracts divided by approved applications.
- **Target:** **70% or higher** (`>= 70%`). Render both the computed percentage (rounded to 1 decimal place, or `"0.0%"` when denominator is 0 to avoid division-by-zero `NaN`) and `"Target: 70% or higher"`.
- **Formula:** `(COUNT(applications reaching Active Flexi-Pay Contract, Completed, Defaulted, or Resolved) / COUNT(approved applications)) * 100`.
- **Unresolved gap (`Unresolved before build` item 2):** PRD 1.8 does not specify whether the denominator `"approved applications"` means applications approved at initial review (`approved_at IS NOT NULL`, i.e., `Awaiting Down Payment Verification` and beyond) or final-approved applications. Track on Day 0 (`working-agreements.md`).

### 3. Default rate

- **PRD definition:** Defaulted contracts divided by activated contracts.
- **Target:** **10% or lower** (`<= 10%`). Render the percentage and `"Target: 10% or lower"`.
- **Formula:** `(COUNT(Agreement WHERE agreement_status IN ('Defaulted', 'Resolved')) / COUNT(Agreement WHERE customer_accepted_at IS NOT NULL AND device_serial IS NOT NULL)) * 100`. If denominator is `0`, return `0%`.
- **Why include `Resolved` in numerator (or confirm on Day 0):** A contract that defaulted and was later resolved still experienced a default event; confirm on Day 0 whether numerator is ever-defaulted (`Defaulted` + `Resolved` via `AuditLog`) or currently `Defaulted` only.

### 4. Average time from application to activation

- **PRD definition:** Average duration from application submission to contract activation.
- **Target:** **48 hours or lower** (`<= 48 hours`). Render duration in hours (to 1 decimal place) and `"Target: 48 hours or lower"`.
- **Formula:** Mean (or median per Day 0 confirmation) of `(activationAuditLog.timestamp - PartPaymentApplication.created_at)` in hours across all activated contracts.
- **Unresolved gap (`Unresolved before build` item 3):** Confirm whether `"Average"` is arithmetic mean (`AVG`) or median (`PERCENTILE_CONT(0.5)`), and whether activation timestamp is read from `AuditLog` (`action = 'FINAL_APPROVAL'`) or `Agreement`.

### 5. Repeat browsing rate

- **PRD definition:** Visitors returning at least twice in 7 days. Baseline placeholder.
- **Target:** None (`"Baseline placeholder"`).
- **Mandatory Version 1 behavior (`"Not available"`):** PRD Section 5.1 has no visitor-tracking or anonymous-session table, and `PRD 15.2` / `out-of-scope.md` forbid third-party analytics SDKs and per-user behavior tracking. Because adding an unapproved table violates `data-and-schema.md`, `GET /api/admin/metrics` must return `"Not available"` for `repeatBrowsingRate` and the UI must display `"Not available (Baseline placeholder)"`.

## Constraints

- **Read-only on-request computation:** Compute metrics on request in `GET /api/admin/metrics` from existing tables (`data-and-schema.md`); do not create a metrics table or background aggregation job (`monitoring.md`).
- **No schema changes authorized:** Never add a visitor-tracking table or cookie to compute Repeat Browsing Rate.
- **Cut-order priority (`build-plan.md`):** The standalone `Success Metrics` page is Cut Order item #1 if Day 1 or Day 5 slips past 18:00 WAT (moving to Version 1.1 while keeping core transaction flows intact).

## Unresolved before build

Track in `working-agreements.md` and resolve on Day 0 (`build-plan.md`):

1. **Week boundary for `Applications per week`:** Rolling 7 days vs Monday–Sunday WAT week.
2. **Denominator for `Approval to activation rate`:** Initial approval (`approved_at IS NOT NULL`) vs final approval.
3. **Mean vs median and activation timestamp source for `Average time from application to activation`.**
4. **`Repeat browsing rate` confirmation:** Confirm displaying `"Not available"` in Version 1 since visitor tracking is excluded by `PRD 5.1` and `15.2`.
5. **Screen placement (`PRD 3.2` vs `PRD 15.1`):** Confirm rendering the 5 metric cards at the top of `Owner Dashboard` and reusing the same component on the `/admin/metrics` route (`screen-inventory.md`).
