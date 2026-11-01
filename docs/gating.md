# Gating Architecture: Soft vs Hard Gating Analysis

**Application:** DG Tech Store (Shop ATF 03, Banex Plaza, Wuse 2, Abuja)  
**Document:** `docs/gating.md`  
**Task:** Task 5 — Step 2: Gating: Soft or Hard  

---

## 1. The Decision & Defence

### The Choice: **Hard Gating**

At DG Tech Store, an account registration does **not** grant an active user session. Upon submitting the registration form, the user record is inserted with `isVerified: false`. No session cookie is issued. The user is strictly redirected to an email/SMS OTP verification screen. Only when the customer submits the correct 6-digit cryptographic verification code does the server call `createSession()`, set the `dg_session` cookie header, and permit access to authenticated application states.

### Why Hard Gating Fits DG Tech Store's Risk Profile & Business Model:

DG Tech Store does not sell low-risk digital subscriptions or read-only blog posts. The store operates a physical consumer electronics retail store in Shop ATF 03, Banex Plaza, Wuse 2, Abuja, specializing in high-value physical inventory (MacBook Pro M3 Max laptops worth ₦3,500,000, iPhone 15 Pro Max devices worth ₦1,850,000) financed via **Flexi-Pay Hire-Purchase Part-Payments**.

1. **Physical Asset Loss vs Friction:** In digital SaaS, losing an unverified user to onboarding friction costs pennies. In physical hire-purchase lending, handing over a ₦1.8M device to an unverified customer using an unowned or disposable email (`victim@gmail.com`) results in an unrecoverable capital loss.
2. **Legal Enforceability of Financing Agreements:** Under the Nigeria Data Protection Act (NDPA) 2023 Section 24 and the Federal Competition and Consumer Protection Commission (FCCPC) Consumer Lending Regulations, consumer credit agreements require verified contact identifiers. A hire-purchase debt contract tied to an unverified email address cannot be defended in an Abuja magistrate court if the debtor defaults.
3. **Database & SMS Cost Defences:** If soft gating were enabled, bot operators could flood the platform with thousands of fake accounts, each instantly receiving an active session. When those unverified accounts trigger financing inquiries or inventory reservations, DG Tech Store incurs SMS gateway costs, credit bureau check fees, and inventory lockouts.

---

## 2. Technical Comparison: What We Learned Building Both

To evaluate both models empirically, we implemented soft gating on git branch `experiment/soft-gating` and hard gating on our main branch `task-5`.

```
           [ Registration Submitted ]
                       |
       +---------------+---------------+
       |                               |
[ Soft Gating Branch ]      [ Hard Gating (Main Branch) ]
       |                               |
Issues Session Immediately   No Session Issued
Redirects to /portal         Redirects to /verify-otp
Displays Unverified Banner   Access Blocked until Code Entered
High State Complexity        Simple Binary Boundary
```

### What Was Harder About Soft Gating?

Building soft gating was substantially **more complex and error-prone** than hard gating:

1. **Pervasive Conditional UI Complexity:**  
   Under soft gating, every single component and page in the portal must understand a "half-authenticated" state:
   - Can the user view inventory? Yes.
   - Can the user add an item to the cart? Yes.
   - Can the user apply for hire-purchase? **No** (show banner + verification modal).
   - Can the user view account profile? Partial (mask phone number and credit limit).  
   This required conditional guards, warning banners, and edge-case testing in dozens of components.

2. **The "Abandoned Verification" Cleanup Burden:**  
   Under soft gating, thousands of phantom users accumulate in `prisma/dev.db` with active sessions and partial shopping carts. The system required background cleanup workers to garbage-collect unverified abandoned accounts while ensuring active carts were not destroyed prematurely.

3. **Session Hijacking via Mistyped Emails:**  
   If a user accidentally mistyped `ahmed.ibrahim@gnail.com` (with an "n") during soft registration, they were immediately logged in. But when they later logged out or switched devices, they could never log in again or reset their password, because verification emails went to a non-existent or wrong inbox.

By contrast, **Hard Gating** enforces a clean, binary state boundary:  
`isVerified === true` &harr; Session exists.  
`isVerified === false` &harr; No session exists.  
Every server route and client component can assume that any authenticated request originates from a customer whose communication channel has been verified.

---

## 3. Real-World Industry Benchmarks

### Company Choosing Soft Gating: **Notion** (or Substack / Medium)
- **Their Business Model:** Product-Led Growth (PLG) productivity and content consumption.
- **Why Soft Gating Fits Them:** Notion’s primary growth engine is immediate user activation (the "time-to-value" metric). If a new user signs up to take meeting notes, any verification roadblock causes immediate churn to Apple Notes or Google Docs. Notion grants an instant session, allows document creation immediately, and sends a passive verification email in the background. If the user never verifies, Notion loses nothing; no physical inventory is at risk.

### Company Choosing Hard Gating: **PiggyVest** (or Revolut / Flutterwave)
- **Their Business Model:** Financial services, savings, and peer-to-peer monetary transfers.
- **Why Hard Gating Fits Them:** In Nigerian fintech, regulatory Know-Your-Customer (KYC) compliance (CBN circulars and NDPA mandates) strictly prohibits unverified users from holding wallets, transferring funds, or executing financial contracts. Issuing a session before phone and email verification would invite money laundering, synthetic identity fraud, and chargeback scams. The friction of entering an OTP is a deliberate trust and security control.

---

## 4. Evidence References

- `evidence/03-soft-gating-flow.png`: Architecture and console trace from git branch `experiment/soft-gating`.
- `evidence/04-hard-gating-flow.png`: Architecture and network trace from main branch `task-5`.
- `lib/security/session-service.ts`: Enforces session generation strictly upon successful verification.
- `app/api/auth/login/route.ts`: Rejects unverified accounts with `HTTP 403 Forbidden` (`requiresVerification: true`).
