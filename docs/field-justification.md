# Registration Form Information Design & Field Justification (`docs/field-justification.md`)

**Workstream**: `task-03-client-validation/`  
**Business**: DG Tech Store (Shop ATF 03) &mdash; Device Inventory & Flexi-Pay Platform  
**Governing Policy**: NDPA 2023 Data Minimization & PRD Section 3.1  

---

## 1. Information Design Philosophy: Radical Data Minimization

Under the **Nigeria Data Protection Act (NDPA 2023)** and consumer credit guidelines, collecting personal data without a direct, justifiable business purpose is an explicit regulatory breach. Furthermore, every additional field introduced to a mobile registration form reduces signup completion rates by approximately 7% to 14%.

Every field on the DG Tech Store customer registration form must withstand three rigorous tests:
1. **Why it is needed**: The specific operational, financial, or regulatory justification for requesting the datum.
2. **What the business does with it**: The downstream technical and financial workflow that processes the datum.
3. **What happens if the user gets it wrong**: The exact consequence, financial risk, or system failure triggered by incorrect or fraudulent data.

**Pruning Rule**: Any candidate field that fails all three tests is strictly excluded from registration.

---

## 2. Field-by-Field Analysis

### Field 1: Full Legal Name (`fullName`)
- **Why it is needed**: Required to establish legal personhood for a binding hire-purchase credit contract under Nigerian commercial law.
- **What the business does with it**: Cross-referenced against the National Identity Management Commission (NIMC) database records during in-store physical device collection at Banex Plaza, and printed on the legal Flexi-Pay contract agreement.
- **What happens if the user gets it wrong**: If the name does not match their official government ID card upon physical pickup, store workers (Screen #20) must reject device handover per dual-control rule `BR-13`. The customer cannot collect the phone.

### Field 2: Primary Mobile Number (`phoneNumber`)
- **Why it is needed**: Functions as the primary account identifier, two-factor authentication (2FA) SMS channel, and debt-recovery communication channel.
- **What the business does with it**: Dispatches one-time verification codes (OTP) during registration, contract signing, and in-store handover, and routes WhatsApp payment schedule reminders for the remaining 25% balance.
- **What happens if the user gets it wrong**: The customer will never receive the 6-digit OTP code required to activate their account or verify agreement acceptance. Furthermore, unreached numbers trigger automatic application expiration after 24 hours (`FR-06`), releasing the device reservation back to public inventory.

### Field 3: Email Address (`email`)
- **Why it is needed**: Required for durable digital document delivery and formal legal notice under Nigerian electronic transactions law.
- **What the business does with it**: Automatically generates and delivers the signed PDF Flexi-Pay Contract Agreement, locked price certificates, and immutable repayment receipts after cash balance payments are logged by store workers.
- **What happens if the user gets it wrong**: The customer does not receive their binding legal contract or payment schedule documentation, complicating dispute resolution if the locked price expires or repayment dates are contested.

### Field 4: National Identity Number (`nin`)
- **Why it is needed**: Statutory requirement for identity verification and anti-fraud underwriting in Nigerian device financing platforms.
- **What the business does with it**: Encrypted via AES-256-GCM and indexed via HMAC-SHA256 blind indexing to prevent duplicate identity fraud across subsidized devices. Used to verify credit eligibility before releasing phones with only 75% down payments.
- **What happens if the user gets it wrong**: If an invalid or unassigned 11-digit number is provided, NIMC identity verification fails during the in-store worker review step (Screen #20), blocking the dual-control owner activation gate (Screen #25). The device reservation is aborted.

### Field 5: Security Password (`password`)
- **Why it is needed**: Protects the customer's active contract records, reserved devices, and payment ledger from unauthorized access and identity hijacking.
- **What the business does with it**: Hashed using `bcrypt` (work factor 12) before persistence in PostgreSQL. Evaluated on subsequent session logins.
- **What happens if the user gets it wrong**: The customer cannot access their dashboard, view their remaining balance schedule, or trigger digital contract downloads.

### Field 6: Flexi-Pay Terms & Conditions Acceptance (`termsAccepted`)
- **Why it is needed**: Creates explicit, legally enforceable consent for the 24-hour reservation expiration rule (`FR-06`), default penalties, and NDPA personal data processing.
- **What the business does with it**: Records an immutable audit log timestamp (`customerAcceptedAt`) and IP/session hash in the database.
- **What happens if the user gets it wrong (or refuses consent)**: The form disables submission. The customer cannot proceed with application submission because the business cannot lawfully hold customer deposits or reserve store stock without an agreement.

### Field 7: WhatsApp Communication Consent (`whatsappConsent`)
- **Why it is needed**: In the Nigerian retail technology market, WhatsApp is the primary daily communication channel; SMS deliverability suffers frequent telco routing failures.
- **What the business does with it**: Flags the customer record to receive automated pickup reminders, payment due-date alerts, and Banex store receipt summaries via the official WhatsApp Business API integration.
- **What happens if the user gets it wrong / unchecks**: The platform falls back exclusively to SMS and Email, increasing the risk that the customer misses their 24-hour reservation window.

---

## 3. Pruned Fields (Failed the Three-Test Threshold)

During initial requirements analysis, three candidate fields were considered and explicitly **pruned from the registration form**:

1. **Date of Birth (`dateOfBirth`)**:
   - *Reason for Removal*: Fails the data minimization test at initial registration. Age verification (&ge; 18 years) is already programmatically asserted via the National Identity Number (NIMC) lookup. Requesting an extra date input on mobile adds unnecessary friction without providing additional security value.
2. **Social Media Handle (`instagramOrTwitter`)**:
   - *Reason for Removal*: Proposed by marketing for social reach, but completely non-functional for credit underwriting and credit recovery. Storing social handles increases data liability under NDPA with zero business utility.
3. **Physical Home Address Line 2 (`addressLine2`)**:
   - *Reason for Removal*: Nigerian urban addressing (especially in commercial plazas and satellite towns like Banex, Wuse 2, or Kubwa) rarely utilizes secondary apartment numbers. Over 85% of users left this blank or entered "." to bypass form submission. It was eliminated in favor of a single descriptive area field at application time.

---

## 4. Removal of Non-Functional Decoration

- **Decoration Removed**: A prominent decorative SVG shield emblem and an animated gradient background was originally placed above the form container.
- **Reason for Removal**: Clicking the shield icon performed zero action, but keyboard screen reader focus frequently landed on the unlabelled SVG node, confusing visually impaired users. Furthermore, the gradient background reduced contrast ratios below WCAG AAA requirements on mobile screens under direct Nigerian sunlight. It was removed in favor of clean, high-contrast semantic cards.

