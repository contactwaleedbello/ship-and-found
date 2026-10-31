# out-of-scope

Source: PRD Sections 1.6, 1.7, and 6

## Single job

This file is the authoritative exclusion list for DG Tech Store Version 1. If a design frame, prompt, PR, or helper suggestion asks for any item listed here, do not build it—stop and log the conflict in `working-agreements.md`. Package-level bans live in `stack.md`; network service bans live in `third-party.md`.

## Why these exclusions exist

Version 1 has a strict 1-week delivery target with zero buffer (`PRD 12`, `build-plan.md`). Manual human operations at Shop ATF 03 replace complex third-party automations in Version 1, while `version-2-data.md` collects the underlying records needed for Version 2 automation.

## Excluded automated flows (`PRD 1.6`, `1.7`, `6`)

- **Automated payment gateway webhooks or online checkout** — excluded because cash and local bank transfers at Shop ATF 03 require human Store Worker verification anyway (`PRD 1.7`, `BR-06`). Manual payment logging (`FR-05`, `FR-08`) is in scope.
- **Automated WhatsApp Business API or inbound WhatsApp chatbots** — excluded to avoid Meta Business verification delays during a 1-week build (`PRD 6`). Manual `wa.me` deep links plus clipboard fallback with `WhatsAppReminderLog` logging (`FR-07`) are in scope.
- **Automated NDPA anonymization workflows** — excluded because deletion eligibility requires human verification of active contracts and legal disputes (`PRD 5.3`). Manual Owner/Co-owner review and triggered anonymization (`FR-10`) are in scope.
- **Automated remote device locking / MDM kill-switch** — excluded from Version 1 (`PRD 1.6`, `6`). Recording `Agreement.device_serial` and applying the administrative default flag (`BR-08`, `BR-09`) are in scope.
- **External NIN verification API calls** — excluded from Version 1 (`PRD 1.6`, `6`). Validating that NIN is exactly 11 numeric digits and displaying it for manual Owner/Co-owner review (`FR-03`, `FR-04`) are in scope.
- **Automated credit checks or credit scoring models** — excluded because a 1-week initial launch has no historical repayment dataset (`PRD 1.7`). Collecting transaction logs for Version 2 (`version-2-data.md`) is in scope.
- **Automated third-party bank debt recovery** — excluded because Version 1 relies on the 70%–80% down-payment cushion and local relationship follow-up (`PRD 1.7`, `7.1`).
- **Automated peer-to-peer or customer-support chat bots** — excluded (`PRD 6`).

## Excluded product features (`PRD 6`)

- **Receipt image upload** (`DownPaymentTransaction.receipt_image_url`) — explicitly cut in PRD Section 6 (`"Receipt upload (cut to protect 1-week timeline)"`), overriding earlier mentions in PRD 2.2.3, 3.2, and FR-05. Do not build file upload inputs, S3 signed URL routes, or receipt image viewers in Version 1.
- **Guarantor identity verification** — Version 1 collects `guarantor_name` and `guarantor_phone` on the Apply form (`FR-03`) for Version 2, but never calls an external service, sends an OTP to the guarantor, or gates approval on guarantor verification (`PRD 6`).
- **Customer self-service balance payment** — customers pay in person or by transfer verified by a Store Worker (`FR-08`).
- **Multi-store support beyond Shop ATF 03** — Version 1 serves a single physical store (`PRD Structural Assumptions`).
- **Multi-currency wallets or multi-currency pricing** — all prices and payments are in Nigerian Naira (`₦`), dynamically calculated from `base_price * exchange_rate_multiplier` (`FR-01`, `FR-13`).
- **PDF generation or export beyond native browser print (`window.print()`)** — excluded (`PRD 6`).
- **Analytics dashboards, charts, funnels, heatmaps, or session replay beyond the 5 numerical Success Metrics** — excluded (`PRD 6`, `15.2`, `build-plan.md`).

## Excluded notification channels (`PRD 6`, `11`)

- **Email notifications** — the `User` model has no email column (`PRD Structural Assumptions`).
- **Push notifications** (web push or mobile push) — excluded (`PRD 6`).
- **SMS messages beyond the 4 OTP flows** — SMS is strictly restricted to OTP codes (`notification-matrix.md`).

## Excluded commercial terms (`PRD 4.1 BR-16`, `6`)

- **Late payment penalties, interest charges, or administrative fees** — prohibited by `BR-16`. A `Defaulted` contract is settled when 100% of the original remaining balance is paid (`FR-09`).
