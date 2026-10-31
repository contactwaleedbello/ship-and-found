# Technical and Implementation Review Answers (`docs/interview-answers.md`)

Source: [`AGENTS.md`](../AGENTS.md); [`Context files/DG Tech Store PRD.md`](../Context%20files/DG%20Tech%20Store%20PRD.md); [`docs/architecture.md`](./architecture.md); [`docs/design-system.md`](./design-system.md); [`.agents/rules/`](../.agents/rules/).

## 1. Architecture & Source-of-Truth Hierarchy

### Q1: How is the repository structured to prevent business logic from leaking into UI components or HTTP route handlers?
- **Answer:** The codebase enforces a strict three-layer architecture defined in [`docs/architecture.md`](./architecture.md) and [`.agents/rules/code-conventions.md`](../.agents/rules/code-conventions.md):
  1. **Presentation Layer (`app/(public)`, `app/(customer)`, `app/(worker)`, `app/(admin)`, `components/`):** React Server Components by default, with `'use client'` restricted to leaf interactive controls. Presentation files never import `@/lib/db` or `@/lib/crypto`.
  2. **Application Controller Layer (`app/api/**/route.ts`):** Thin HTTP route handlers that validate incoming requests with Zod, invoke a domain service in `lib/services/*`, and format responses with `x-request-id` via `lib/errors.ts`. Route handlers never call `prisma.$transaction` directly.
  3. **Service & Data Layer (`lib/services/*`, `lib/db.ts`, `prisma/schema.prisma`):** Encapsulates all business rules (`BR-01`–`BR-20`), state transitions (`state-transitions.md`), atomic `prisma.$transaction` blocks (`data-and-schema.md`), and immutable `AuditLog` writes (`ndpa-compliance.md`).

### Q2: How does Task 2 consume the Task 1 Design System without drifting or inventing styles?
- **Answer:** The verified `styles/` directory from `/Users/macbookpro/Desktop/Dev & Design To/task-01-design-system/styles` (`fonts.css`, `fonts/*.woff2`, `tokens/index.css`, `tokens/primitives.css`, `tokens/roles.css`) is integrated verbatim into `Task-02-SCAFFOLD-IT-SHIP-THE-REPOSITORY/styles/` (verified with `diff -rq` showing zero differences). [`tailwind.config.ts`](../tailwind.config.ts) maps every color, spacing token, border radius, border width, and box shadow directly to the CSS custom properties in `styles/tokens/roles.css` and `styles/tokens/primitives.css`, and [`app/globals.css`](../app/globals.css) imports `../styles/fonts.css` and `../styles/tokens/index.css`. Hardcoded hex values or arbitrary pixel styling are forbidden per [`docs/design-system.md`](./design-system.md).

---

## 2. Critical Business Invariants & Financial Safety

### Q3: What is the single most critical transactional invariant in DG Tech Store, and how is it enforced?
- **Answer:** Per root [`AGENTS.md`](../AGENTS.md) ("One thing the agent must do well"), `BR-13`, and `FR-06`, **Final Approval (`POST /api/admin/applications/:id/final-approve`)** must validate three previously committed events inside a **single `prisma.$transaction`** before activating a contract (`Active Flexi-Pay Contract`):
  1. A committed Store Worker `DownPaymentTransaction` exists for the application with `verification_checkbox = true` and `verifier_ip` recorded.
  2. A committed Customer `Agreement` acceptance exists with `customer_accepted_at IS NOT NULL` and `acceptance_otp_verified = true`.
  3. **Same-User Separation (`BR-13`):** The `Owner` or `Co-owner` granting Final Approval is not the same `User` (`approverUserId !== recorded_by_worker_id`) who verified the down payment.
  Additionally, if the final approver's IP address matches `DownPaymentTransaction.verifier_ip`, the transaction writes an IP-collision audit event (`BR-19`) that triggers a non-dismissible alert banner on the Owner Dashboard (`ux-states.md` B.8).

### Q4: Why are Battery Life and Price given equal visual and accessible weight on device views (`FR-01`)?
- **Answer:** Customers at Shop ATF 03 evaluate devices in an environment with frequent power interruptions, making battery life (`battery_life_spec`) a primary purchase criterion alongside Naira price (`dynamic_price`). Per [`.agents/rules/functional-requirements.md`](../.agents/rules/functional-requirements.md) (`FR-01`) and [`.agents/rules/accessibility-baseline.md`](../.agents/rules/accessibility-baseline.md), both values render inside a shared semantic `<dl>` with identical font family, font size (`.type-title-large` / `22px`), font weight (`600`/`700`), and badge container prominence on every device card and on `Device Detail`.

### Q5: How does the platform comply with the Nigeria Data Protection Act (NDPA) while preserving financial audit integrity?
- **Answer:** Per [`.agents/rules/ndpa-compliance.md`](../.agents/rules/ndpa-compliance.md) and [`.agents/rules/security-baseline.md`](../.agents/rules/security-baseline.md):
  - `CustomerProfile.nin` and `CustomerProfile.phone_number` are encrypted at rest using `AES-256-GCM` with distinct keys (`NIN_ENCRYPTION_KEY`, `PHONE_ENCRYPTION_KEY`).
  - Store Workers see only masked NINs (`*******1234`), and every Owner/Co-owner read of a full NIN writes a mandatory `NIN_ACCESS` row to `AuditLog`.
  - `AuditLog` is insert-only (`REVOKE UPDATE, DELETE, TRUNCATE`) and every foreign key uses `ON DELETE RESTRICT`.
  - When an NDPA deletion request (`FR-10`) is approved (only permitted when the customer has no active or defaulted contract), personal identifiers on `CustomerProfile` and `User` are overwritten via `UPDATE` with a pseudonymous ID while preserving non-identifying financial transaction amounts and `Version 2` credit-history metrics (`version-2-data.md`).

---

## 3. Unresolved Production Questions

See [`docs/model-choices.md`](./model-choices.md) Section 3 and [`AGENTS.md`](../AGENTS.md) (`## Open questions`) for the operational parameters (production Shop ATF 03 WhatsApp number, `[Store Contact]` label, live Termii credentials, and legal retention sign-off) tracked for production cutover.

