# DG Tech Store — Privacy Policy (Draft with Broken Promise)

**Status:** ARCHIVED DRAFT — SUPERSEDED DUE TO STATUTORY LEGAL CONFLICTS  
**Origin Date:** October 15, 2026  
**Author:** Junior Frontend Engineering Contractor  
**Review Notice:** *This draft contains fatal legal and technical promises that cannot be fulfilled. Kept for compliance audit comparison.*

---

## The Broken Promise (Section 7: Account Deletion)

> ### "7. Instant and Absolute Data Deletion
> At DG Tech Store (Shop ATF 03, Banex Plaza), we believe your data belongs exclusively to you. If at any time you wish to delete your account, simply click the 'Delete My Account' button in your profile settings. 
> 
> **Our Promise to You:**
> 1. The moment you click delete, our servers will instantly and completely erase every single trace of your data from our database forever.
> 2. All your personal details, order histories, installment payment receipts, device serial numbers, and financing records will be permanently obliterated immediately with zero delay.
> 3. No records will be kept on any server, hard drive, or backup under any circumstances. Once deleted, it is as though you never existed."

---

## Why This Was a Broken and Illegal Promise:

1. **Criminal Violation of Tax Law (CITA 2004 s.55):**  
   Promising to obliterate installment payment receipts and order histories violates Section 55 of the Companies Income Tax Act, which legally compels businesses to maintain financial records for six (6) years. Following this promise would subject DG Tech Store to severe fines and criminal closure by the Federal Inland Revenue Service (FIRS).

2. **Commercial Self-Destruction (Unpaid Debts):**  
   If a customer who owes ₦600,000 on an iPhone 15 hire-purchase plan clicks 'delete', erasing their financing contract destroys the store's legal claim to collect the debt or repossess the device.

3. **Technical Impossibility of Instant Backup Wiping:**  
   Automated database backups run daily and are archived for 30 days in immutable cold storage. It is technically impossible to instantly excise a single database row from pre-existing binary snapshot files without corrupting the backup archive.

4. **Foreign Key Integrity Crash:**  
   Attempting a raw SQL deletion on a user with associated `Payment` records triggers `PrismaClientKnownRequestError: Foreign key constraint failed on the field: userId (onDelete: Restrict)`.
