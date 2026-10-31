# version-2-data

Source: PRD Sections 5.2, 6, 16.2

## Single job

This file specifies the 7 categories of data Version 1 must capture and retain so Version 2 can introduce credit scoring, remote device locking, external NIN verification, and guarantor verification without a database backfill—while strictly forbidding any Version 2 feature code or schema scaffolding in Version 1.

## The 7 data categories Version 1 collects (`PRD 5.2`, `16.2`)

Every field below has both a legitimate operational use in Version 1 (satisfying NDPA data minimization in `ndpa-compliance.md`) and a Version 2 forward-compatibility role:

| # | Data category | Where stored (`data-and-schema.md`) | Version 1 operational use | Why Version 2 needs it without backfill |
|---|---|---|---|---|
| 1 | Customer identity data | `User`, `CustomerProfile.full_name`, `personal_details` | Account authentication and Owner application underwriting (`FR-03`, `FR-04`) | Anchors customer repayment history across multiple contracts |
| 2 | 11-digit NIN | `CustomerProfile.nin` (AES-256-GCM encrypted) | Validated as `^\d{11}$`, reviewed manually by Owner/Co-owner (`FR-04`), and used as a key for the `BR-09` default purchase block | Version 2 will re-verify stored NINs against the external NIMC registry for bureau credit scoring |
| 3 | Customer phone number | `User.phone_number`, `CustomerProfile.phone_number` (encrypted) | SMS OTP delivery (`PRD 11`), manual WhatsApp reminders (`FR-07`), and `BR-09` default purchase block key | Primary identity and contact key across Version 1 and Version 2 |
| 4 | Guarantor name and phone | `CustomerProfile.guarantor_name`, `guarantor_phone` | Collected on `Apply for Part-Payment` and displayed to Owner/Co-owner on `Review Application` (`FR-03`, `FR-04`) | Version 2 adds guarantor identity verification without requiring historical customers to re-submit guarantor contacts (`PRD 16.2`) |
| 5 | Exact payment transaction logs | `DownPaymentTransaction`, `BalancePaymentTransaction`, `SettlementLog` | Down-payment verification (`FR-05`), remaining balance math (`FR-08`), default resolution (`FR-09`), and daily Owner reconciliation (`PRD 7.3`) | Provides the timestamped repayment ledger required to train and compute Version 2 credit scores (`PRD 16.2`) |
| 6 | Device serial number | `Agreement.device_serial` | Recorded at contract activation (`BR-08`), displayed on `Reserved Units` / `Defaulted Contracts`, and flagged on default (`BR-09`) | Serves as the hardware tie key for Version 2 automated remote device locking (`PRD 16.2`) |
| 7 | Customer consent records | `ConsentRecord` | Recorded at registration and agreement acceptance (`PRD 5.3`, `13.1`) for Terms and WhatsApp communications | Proves historical NDPA consent scope from Day 1 (`PRD 16.2`) |

## Strict Version 1 boundaries (what NOT to build)

Even though Version 1 collects the 7 categories above, Version 1 must **never** build any of the following (`out-of-scope.md`, `code-conventions.md`):

1. **No remote device locking or MDM endpoints** — Version 1 only sets `Agreement.agreement_status = 'Defaulted'` (`BR-09`).
2. **No credit-score calculation, column, query, or UI badge** — Version 1 only records raw payment transactions.
3. **No external NIN registry call or `nin_verified` column** — Version 1 only checks `^\d{11}$` and shows NIN to the Owner (`PRD 7.5`).
4. **No guarantor OTP, call, or verification status column** — Version 1 only stores `guarantor_name` and `guarantor_phone`.
5. **No Version 2 scaffolding in code or schema:** Do not add `"reserved for Version 2"` columns to `DownPaymentTransaction`, `BalancePaymentTransaction`, or `Agreement` (`PRD 16.2` confirms existing PRD 5.1 fields suffice); do not add `if (version === 2)` branches, feature flags, or `TODO: Version 2` comments (`code-conventions.md`).

## Constraints

- **Never drop, rename, or stop populating any of the 7 data categories above** during a Version 1 refactor, because omitting any of them silently breaks Version 2 migration without causing a visible Version 1 error.
- **Record `Agreement.device_serial` at final-approval activation only (`BR-08`)**—never at application submission or down-payment verification.
- **Respect NDPA retention (`ndpa-compliance.md`):** Do not prematurely purge or anonymize payment logs, device serials, or active/defaulted customer records before the legal retention period expires.
