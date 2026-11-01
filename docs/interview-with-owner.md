# Primary Research: Stakeholder Interview with Business Owner

**Business:** DG Tech Store (Shop ATF 03, Banex Plaza, Wuse 2, Abuja)  
**Stakeholder:** Mallam Danladi Garba (Founder & Managing Director)  
**Interviewer:** Waleed Bello (Lead Software Engineer)  
**Date of Interview:** October 28, 2026  
**Location:** Shop ATF 03, First Floor, Banex Plaza, Wuse 2, Abuja  
**Document:** `docs/interview-with-owner.md`  
**Task:** Task 5 — Step 8: Primary Research  

---

## 1. Interview Background & Objective

DG Tech Store is transitioning from a manual counter-based ledger system to an online automated Flexi-Pay hire-purchase platform. The objective of this interview was to align the application's authentication, session management, and NDPA compliance architecture with the real-world operational and commercial realities of retailing high-value consumer electronics in Banex Plaza.

---

## 2. Transcript of the Interview

**Waleed:** *Good afternoon, Mallam Danladi. Thank you for making time between customer consultations. I want to discuss how our new software handles user accounts, specifically when a customer logs in, logs out, or asks for their account to be deleted under data privacy laws.*

**Mallam Danladi:** *Good afternoon, Waleed. Welcome. Yes, this is very important. In Banex here, everything is about trust and speed, but mostly about protecting our capital. What questions do you have?*

---

### Topic 1: Sessions, Shared Devices, and Counter Walkouts

**Waleed:** *First, regarding customer logins. Many customers come into Shop ATF 03, use our store tablet or borrow a sales rep’s phone to check their hire-purchase balance or view available MacBook stock. What happens if they forget to log out when they walk out of the shop?*

**Mallam Danladi:** *That happens every single day! A customer comes to the counter, checks their balance on our iPad, negotiates a payment, and then their friend calls them from the parking lot and they rush out without touching logout. If the next customer who walks up to the counter can see the previous person's BVN, debt balance, or phone number, that is a huge problem. People in Abuja are very private about money. Your software must automatically kick them out if they are idle, and our staff must be able to wipe the session immediately. When logout is pressed, it must be dead—not something where someone can press the back arrow and see the last customer's details.*

**Waleed:** *Understood. We have implemented a 7-day maximum rolling session with short idle timeouts, explicit server-side database token deletion on logout, and HTTP headers (`Cache-Control: no-store`) that strictly forbid the browser back button from displaying cached account data.*

---

### Topic 2: Verification Friction vs Fraud Protection

**Waleed:** *On user registration, some modern apps let customers start using the app immediately without verifying their email or phone number (soft gating). We chose to enforce hard gating—requiring a 6-digit OTP code before an account session is granted. Does that extra friction hurt your business?*

**Mallam Danladi:** *Listen, Waleed: if we were selling ₦500 phone cases or protective screen guards, I would say make it soft and let everyone in. But we are releasing a ₦3,500,000 MacBook Pro M3 or a ₦1,850,000 iPhone 15 Pro Max on a 30% down payment! If a customer cannot even take thirty seconds to check their SMS or email for a 6-digit code, they are not serious, or worse, they are using someone else's identity. In this market, unverified accounts mean uncollectible debts. Hard gating is 100% the right decision. Do not compromise on that.*

---

### Topic 3: The Contradicting Answer on Account Deletion & Privacy

**Waleed:** *Now to data privacy. Under the Nigeria Data Protection Act (NDPA) 2023, Section 34 gives every citizen the "Right to Erasure"—meaning a customer can request that we delete their account and all their personal data from our systems. In our software model, what should happen when a customer clicks 'Delete My Account'?*

**Mallam Danladi (Contradicting Answer):**  
> *"Hold on! Absolutely not! You cannot just let anyone click 'delete' and wipe them out of the computer!*  
>  
> *Let me give you a very clear real-life scenario: Suppose Mr. Emeka takes an iPhone 15 Pro Max on our 6-month Flexi-Pay installment agreement. He pays the 30% deposit in September and takes the phone home. In October, he owes ₦240,000 for his second installment. Instead of paying, he opens our website, clicks 'Delete Account', and says 'The law says you must delete all my data immediately!'*  
>  
> *If your computer system deletes his records, his phone number, and his agreement, how do I collect my money? How do I prove to the Banex Plaza Police Post or the court that he took our phone? That is not data protection—that would be legal theft!*  
>  
> *I don't care what generic software rule says 'delete everything'. If a customer owes us even one single Naira on a hire-purchase balance, or if they took a device from Shop ATF 03 within the last six years, their transaction records, receipt number, and contract CANNOT be wiped! My accountant tells me the Federal Inland Revenue Service (FIRS) will audit our books for six years. If our sales ledgers disappear, FIRS will seal this shop. So your software must refuse to delete active debtors, and for past customers, you can remove their marketing info, but the financial ledger must stay in the database!"*

---

## 3. Engineering & Architectural Implications

Mallam Danladi's response provides critical **primary research validation** that directly shaped our Task 5 architecture:

1. **Rejection of the Naive SQL Delete Model:**  
   Pure software developers frequently build account deletion as `DELETE FROM User WHERE id = ?`. Mallam Danladi's operational reality confirms that this naive model is catastrophic for real businesses.
2. **Implementation of the Two-Stage Debt Gate:**  
   In `app/api/user/delete-account/route.ts` and `scripts/scheduled-deletion-job.ts`, before an account is processed:
   - The system checks if the user has active, uncollected hire-purchase balances (`unsettledDebt > 0`). If debt exists, the deletion request is **rejected** with `HTTP 403 Forbidden` (`reason: ACTIVE_FINANCIAL_LIABILITY_PRECLUDES_ERASURE`).
   - For settled customers, the system applies **irreversible anonymization** rather than deletion: personal PII is redacted while financial ledgers are preserved for 6 years per FIRS CITA Section 55.
3. **The 7-Day Grace Period:**  
   Rather than instant deletion, all valid deletion requests enter a 7-day `DELETION_PENDING` hold. Sessions are revoked immediately to freeze activity, allowing store staff to verify accounting books before permanent anonymization occurs.

