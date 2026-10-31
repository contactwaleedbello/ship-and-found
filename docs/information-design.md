# Information Design and Screen Hierarchy (`docs/information-design.md`)

Source: Consolidated PRD v1.3 Sections 3.1, 3.2, 3.3 (`FR-01`–`FR-14`), Appendix B; [`.agents/rules/screen-inventory.md`](../.agents/rules/screen-inventory.md); [`.agents/rules/accessibility-baseline.md`](../.agents/rules/accessibility-baseline.md); [`.agents/rules/ux-states.md`](../.agents/rules/ux-states.md); [`docs/design-system.md`](./design-system.md).

## 1. Core Information Design Principles ("Minimal UX MO")

Per [`AGENTS.md`](../AGENTS.md) and PRD Section 3.1, every screen in DG Tech Store follows seven non-negotiable information design constraints:

1. **Equal Visual & Accessible Weight for Battery Life and Price (`FR-01`):**
   - Nigerian buyers at Shop ATF 03 evaluate devices under frequent power outages where battery endurance is as decisive as Naira price.
   - On every device card (`Home / Inventory Listing`) and on `Device Detail`, **Battery Life (`battery_life_spec`) and Dynamic Price (`dynamic_price`)** use the exact same typography token class (`.type-title-large` / `--type-title-large-size: 22px`, weight `600`/`700`), identical badge/container padding (`--spacing-padding-sm`), and adjacent placement at the same DOM heading/description level (`<dl>` with paired `<dt>`/`<dd>` elements per `accessibility-baseline.md`).
2. **Single Primary Action Per Screen (`PRD 3.1`, `screen-inventory.md`):**
   - Every screen renders at most **one** primary CTA button (`bg-[var(--color-primary)] text-[var(--color-on-primary)]`) so customers on `360px` mobile viewports and staff in busy shop conditions never face competing primary buttons.
3. **Mobile-First for Customer Flows, Desktop-First for Staff Flows:**
   - Public and Customer screens (`#1`–`#13`) are designed around the Compact (`360px`–`599px`, 4-column) viewport token scale first and expand cleanly to Medium (`600px+`, 8-column) and Expanded/Large (`840px+`/`1200px+`, 12-column).
   - Store Worker (`#14`–`#20`) and Owner/Co-owner (`#21`–`#29`) screens prioritize dense, scannable operational queues and verification tables on desktop while remaining keyboard-accessible and responsive.
4. **Progressive Disclosure & Zero Decorative Elements (`working-agreements.md`):**
   - No marketing carousels, promotional popups, decorative illustrations, or unrequested charts. Every visible element maps directly to the `Key Elements` column of [`.agents/rules/screen-inventory.md`](../.agents/rules/screen-inventory.md).
5. **Explicit Loading, Empty, and Error States (`ux-states.md`):**
   - Every list and form screen implements explicit loading (`aria-busy="true"`), empty, and error states using the exact verbatim copy defined in PRD Appendix B and [`.agents/rules/ux-states.md`](../.agents/rules/ux-states.md).

---

## 2. Complete 29-Screen Organization by Persona and Route Group

### Group A: Public Screens (`app/(public)/` — 7 Screens)
| # | Screen Name | Route | Primary Action | Information Hierarchy (Top to Bottom) |
|---|---|---|---|---|
| 1 | `Home / Inventory Listing` | `/` | Click device card | 1. Store header (`Shop ATF 03`) & auth nav -> 2. Filter bar (`brand`, `category`, `performance_tier`, `battery_life`) -> 3. Device grid where each card shows Device Name, equal-weight **Price (`₦`)** & **Battery Life (`hrs`/`mAh`)** (`FR-01`), performance tier, and available stock badge. |
| 2 | `Device Detail` | `/devices/[id]` | `Apply for Part-Payment` (or `Confirm Current Price via WhatsApp` if out of stock / stale price) | 1. Device title & stock badge -> 2. Equal-weight Price & Battery Life hero block -> 3. Interactive Part-Payment Calculator (`70%–80%` slider/input, remaining balance, 30-day window disclaimer `FR-02`) -> 4. Full specifications -> 5. Single primary CTA. |
| 3 | `Login` | `/login` | `Log in` | 1. Heading -> 2. Phone number input -> 3. Password input -> 4. `Log in` primary CTA -> 5. Secondary links (`Register`, `Forgot Password`). |
| 4 | `Register` | `/register` | `Register` | 1. Heading -> 2. Phone input -> 3. Password input -> 4. Mandatory Terms & WhatsApp consent checkboxes -> 5. `Register` primary CTA. |
| 5 | `OTP Verification` | `/verify-otp` | `Verify` | 1. Heading & masked phone target -> 2. 6-digit numeric OTP input (`inputMode="numeric"`) -> 3. `Verify` primary CTA -> 4. Resend link & `"Trouble receiving OTP?"` in-person shop fallback notice (`ux-states.md` B.6). |
| 6 | `Forgot Password` | `/forgot-password` | `Reset` | 1. Heading & 24-hour security lock notice (`PRD 9.3`) -> 2. Phone input & OTP trigger -> 3. 6-digit OTP & new password inputs -> 4. `Reset` primary CTA. |
| 7 | `Confirm Current Price via WhatsApp` | `/confirm-price/[deviceId]` | `Open WhatsApp` | 1. Out-of-stock / stale-price explanation -> 2. Prefilled `Template A.3` message preview -> 3. `Open WhatsApp` (`wa.me`) primary CTA -> 4. Offline fallback text (`"Call Shop ATF 03 or visit in person."`). |

### Group B: Customer Screens (`app/(customer)/` — 6 Screens)
| # | Screen Name | Route | Primary Action | Information Hierarchy (Top to Bottom) |
|---|---|---|---|---|
| 8 | `Apply for Part-Payment` | `/apply/[deviceId]` | `Submit` | 1. Locked device & price summary -> 2. Personal details & 11-digit NIN (`^\d{11}$`) -> 3. Guarantor name & phone -> 4. Down payment input (`70%–80%` inline validation on blur) -> 5. `Submit` primary CTA. |
| 9 | `Application Status` | `/applications/[id]` | View contract or reapply | 1. Status badge (`ux-states.md` B.4) -> 2. 24-hour reservation expiry countdown -> 3. Next-step instructions (visit Shop ATF 03 or accept agreement) -> 4. Single primary CTA. |
| 10 | `My Applications` | `/applications` | Open application | 1. Heading -> 2. Chronological list of customer applications with device, locked price, and status badge. |
| 11 | `Contract Detail` | `/contracts/[id]` | View agreement or payment history | 1. Contract status & 30-day (`19:59 WAT`) countdown -> 2. Remaining balance & device serial -> 3. Verified payment ledger (`DownPaymentTransaction`, `BalancePaymentTransaction`, `SettlementLog`). |
| 12 | `Agreement Acceptance` | `/applications/[id]/accept` | `Accept with OTP` | 1. Full Flexi-Pay contract terms (`locked_price`, `down_payment_amount`, `remaining_amount`, 30-day default rule) -> 2. `Send OTP` & 6-digit OTP input -> 3. `Accept with OTP` primary CTA (`FR-06`). |
| 13 | `Account Settings` | `/settings` | `Submit deletion request` | 1. Customer profile summary -> 2. Consent record status -> 3. NDPA formal data deletion request section (`FR-10`). |

### Group C: Store Worker Screens (`app/(worker)/` — 7 Screens)
| # | Screen Name | Route | Primary Action | Information Hierarchy |
|---|---|---|---|---|
| 14 | `Worker Dashboard` | `/worker` | Open a queue | 4 operational queue cards with counts (`Payments to Verify`, `Reminder Checklist`, `Reserved Units`, `Inventory Updates`) + in-person Customer OTP resend action. |
| 15 | `Verify Down Payment` | `/worker/verify/[applicationId]` | `Submit verification` | Application summary (masked NIN `*******1234`), payment method (`CASH`/`BANK_TRANSFER`), amount, reference, mandatory attestation checkbox (`BR-06`), and manual WhatsApp `Template A.5`/`A.6` helper. |
| 16 | `Record Balance Payment` | `/worker/balance/[agreementId]` | `Submit payment` | Active contract summary, remaining balance, amount input (blocks `> remaining_amount` per `FR-08`), method, and reference. |
| 17 | `Record Settlement Payment` | `/worker/settlement/[agreementId]` | `Submit settlement` | Defaulted contract summary, remaining balance, settlement amount input (blocks overpayment), method, and reference. |
| 18 | `Reminder Checklist` | `/worker/reminders` | `Mark as Sent` | Contracts due for `T-7`, `T-3`, `T-1`, `T-0`, `T+1` reminders, rendered template preview (`message-templates.md`), `Open WhatsApp` (`wa.me`), `Copy to Clipboard` fallback, and `Mark as Sent` action. |
| 19 | `Reserved Units` | `/worker/reserved` | `Acknowledge` | Reserved stock list showing Application ID, Customer Name, 24h expiry countdown, and physical box tag confirmation (`PRD 7.4`). |
| 20 | `Inventory Update` | `/worker/inventory` | `Submit for Owner approval` | Device table with current vs proposed `stock_count` and `base_price` submitted for Owner approval (`FR-13`). |

### Group D: Owner & Co-owner Screens (`app/(admin)/` — 9 Screens)
| # | Screen Name | Route | Primary Action | Information Hierarchy |
|---|---|---|---|---|
| 21 | `Owner Dashboard` | `/admin` | Open a queue | Non-dismissible security/cron health alert banners (`ux-states.md` B.8), 5 `Success Metrics` summary cards (`PRD 15.1`), and 5 governance queues. |
| 22 | `Review Application` | `/admin/applications/[id]/review` | `Approve for verification` or `Reject` | Full customer details, decrypted 11-digit NIN (logs `NIN_ACCESS`), guarantor info, financial breakdown, and required rejection reason input (`FR-04`). |
| 23 | `Final Approval` | `/admin/applications/[id]/final-approve` | `Approve` | Verifying Worker identity & timestamp, Customer OTP acceptance timestamp, Same-User rule check (`BR-13`), required `device_serial` input (`BR-08`), and `Approve` button (`FR-06`). |
| 24 | `Exchange Rate Settings` | `/admin/exchange-rate` | `Save` | Current `exchange_rate_multiplier` input, live recalculated `dynamic_price` preview across inventory, and `Save` button (`FR-13`). |
| 25 | `Defaulted Contracts` | `/admin/defaults` | `Mark Resolved` | Defaulted contracts list with device serial, remaining balance, `SettlementLog` history, and `Mark Resolved` button (enabled only when `remaining_amount === 0` per `FR-09`). |
| 26 | `Deletion Requests` | `/admin/deletion-requests` | `Record decision` | NDPA deletion request details, active/defaulted contract blocker check, decision selector (`APPROVED`/`REJECTED`), `decision_reason`, and `anonymized_fields` checklist (`FR-10`). |
| 27 | `Inventory Approvals` | `/admin/inventory-approvals` | `Approve` or `Reject` | Pending Store Worker stock/price updates showing old vs proposed values (`FR-13`). |
| 28 | `Audit Log` | `/admin/audit` | Filter and view | Filter bar (`actor_id`, `action`, `entity_type`, date range) and 50-row/page immutable audit table (`FR-11`). |
| 29 | `Success Metrics` | `/admin/metrics` | View | Dedicated numerical breakdown of the 5 business metrics and formulas (`success-metrics.md`). |

---

## 3. Token Mapping Reference (`styles/tokens/roles.css`)

All visual styling in `app/` and `components/` traces directly to these semantic roles:
- **Canvas & Surfaces:** `--color-surface` (page background), `--color-surface-container-low` (cards), `--color-surface-container` (filter bars/headers), `--color-surface-container-high` (emphasized callouts).
- **Text Hierarchy:** `--color-on-surface` (primary copy & headings), `--color-on-surface-variant` (secondary metadata & labels).
- **Brand & Actions:** `--color-primary` / `--color-on-primary` (single primary CTA), `--color-primary-container` / `--color-on-primary-container` (price highlight badge), `--color-tertiary-container` / `--color-on-tertiary-container` (equal-weight battery life highlight badge).
- **Semantic Statuses:** `--color-success-container` / `--color-on-success-container` (in-stock, active, completed), `--color-warning-container` / `--color-on-warning-container` (pending verification, low stock), `--color-error-container` / `--color-on-error-container` (out of stock, rejected, defaulted, inline errors).
- **Typography Scale:** `.type-headline-large` (`32px`/`45px` `h1`), `.type-headline-small` (`24px`/`34px` section `h2`), `.type-title-large` (`22px`/`31px` equal-weight Battery Life & Price display), `.type-body-medium` (`14px`/`22px` body copy), `.type-label-large` (`14px`/`21px` button & input labels).

