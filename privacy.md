# DG Tech Store — Official Privacy & Data Retention Policy

**Entity:** DG Tech Store Nigeria Limited (Shop ATF 03, Banex Plaza, Wuse 2, Abuja, FCT)  
**Effective Date:** November 1, 2026  
**Governing Law:** Nigeria Data Protection Act (NDPA) 2023, Companies Income Tax Act (CITA) 2004, and FCCPC Consumer Protection Guidelines.  
**Contact:** `compliance@dgtechstore.ng` | Data Protection Officer (DPO): DPO Desk, Shop ATF 03  

---

## 1. Introduction & Scope

DG Tech Store operates a physical retail store in Banex Plaza, Wuse 2, Abuja, and an online financing platform for consumer electronics. We are committed to processing personal data transparently, lawfully, and securely in full compliance with the Nigeria Data Protection Act (NDPA) 2023.

This Policy explains how we collect, hold, process, anonymise, and retain your data when you use our website, mobile interface, or counter services at Shop ATF 03.

---

## 2. Lawful Bases for Processing (NDPA Section 24)

We process your data under the following statutory grounds:
- **Performance of a Contract (NDPA s.24(1)(b)):** Processing your name, phone number, BVN, and delivery address to deliver consumer electronics and service Flexi-Pay hire-purchase agreements.
- **Compliance with Legal Obligations (NDPA s.24(1)(c)):** Retaining sales transaction ledgers, VAT receipts, and customer payment references for six (6) years per Section 55 of the Companies Income Tax Act (CITA).
- **Legitimate Interests (NDPA s.24(1)(f)):** Preventing fraud, securing public sessions, and protecting physical inventory against theft and default.

---

## 3. Account Deletion & Right to Erasure (NDPA Section 34)

You have the statutory right under NDPA Section 34 to request the erasure of your personal data. To provide both security and regulatory compliance, DG Tech Store processes deletion requests through a structured legal workflow rather than an instant destructive wipe:

### The 7-Day Safety Grace Period:
1. When you initiate an account deletion request via your account settings, your account status is changed to `DELETION_PENDING`.
2. **Immediate Session Termination:** All active sessions across all your devices are instantly destroyed. You are logged out immediately, and further logins are blocked.
3. **Grace Period:** Your records enter a 7-day grace period during which you may contact `compliance@dgtechstore.ng` to cancel the deletion request if it was made accidentally or due to device theft.

### Processing After 7 Days:
At 02:00 WAT every morning, our automated compliance engine processes accounts that have completed the 7-day grace period:
- **Accounts with No Financial Transactions:** If you registered but never completed a payment, installment, or device purchase, your user row, profile data, and session logs are **completely and permanently deleted** from our primary database.
- **Accounts with Settled Financial Transactions:** If you completed device purchases or hire-purchase payments, **Irreversible Anonymization** is applied:
  - Your personal identifying data (`fullName`, `email`, `phoneNumber`, `ninEncrypted`, `bvnNumber`, and password hashes) is permanently overwritten with synthetic redacted strings.
  - Your transaction amounts, receipt numbers, and device serial numbers are preserved in an anonymized state for six (6) years to comply with FIRS CITA Section 55 and FCCPC audit regulations.

### Exceptions to Deletion (Active Debt Liabilities):
In accordance with NDPA Section 34(2)(b) and FCCPC Consumer Lending Regulations, **an account deletion request will be refused if you have an active, outstanding, or delinquent hire-purchase balance**. Your account and debt contract will remain active until all installment obligations are settled in full.

---

## 4. Backup Retention & Disaster Recovery Cycle

Database snapshots are encrypted and retained in secure cold storage for disaster recovery purposes for thirty (30) days. In the event of a catastrophic system restoration from an older backup snapshot, our automated restoration pipeline replays our append-only Compliance Deletion Log to ensure previously anonymized accounts are immediately re-anonymized before services resume.

---

## 5. Security & Session Integrity

We enforce strict cryptographic controls to protect your data:
- Passwords are encrypted using slow, memory-hard **Argon2id** (64MB memory cost, 3 time iterations).
- Sessions utilize cryptographically random 256-bit identifiers transmitted in hardened cookies configured with `HttpOnly`, `Secure`, and `SameSite=Lax`.
- All administrative routes enforce strict Role-Based Access Control (RBAC), returning `HTTP 403 Forbidden` for unauthorized customer sessions.

For inquiries or to exercise your NDPA data rights, contact our Data Protection Officer at `compliance@dgtechstore.ng`.

