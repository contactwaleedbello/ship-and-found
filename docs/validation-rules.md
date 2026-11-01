# Client-Side Validation Rules & Derivations (`docs/validation-rules.md`)

**Workstream**: `task-03-client-validation/`  
**Domain**: DG Tech Store (Shop ATF 03)  
**Governing Standard**: Step 3 (Four Validation Categories & The Stated Cost to Legitimate Users)  

---

## 1. Overview of the Four Validation Categories

Validation in DG Tech Store is structured into four distinct UX and compliance categories:
- **Category 1**: Empty fields (on-blur inline warning when a field is focused and abandoned without input).
- **Category 2**: Length and structure (field-specific structural boundaries derived from Nigerian retail requirements).
- **Category 3**: Format enforcement timing (real-time validation on registration; submit-time validation on login).
- **Category 4**: ARIA accessibility associations, live announcements, and color independence.

---

## 2. Rule-by-Rule Derivation and Stated User Cost Matrix

Every validation rule creates a boundary, and every boundary inadvertently excludes a subset of legitimate, well-meaning human users. Pretending this cost does not exist is an engineering failure. Below is the complete derivation and explicit trade-off justification for every rule in our application:

### Rule 1: Full Legal Name &mdash; Minimum 2 Words Separated by a Space
- **What the rule is**: The name field must contain at least 3 characters and consist of at least two distinct word tokens separated by whitespace (`/^[^\s]+(\s+[^\s]+)+$/`).
- **What goes wrong without it**: Automated bots, scrapers, and careless users submit single-letter placeholders (e.g. "a", "test", "user"), polluting customer records. Under Nigerian commercial law and hire-purchase contract rules, a single token does not identify a legal individual, preventing enforceable debt recovery if the remaining 25% balance is unpaid.
- **What legitimate user it will wrongly block**:
  - **Mononymous individuals**: Many citizens across Northern Nigeria, traditional rural communities, and certain immigrant groups legally carry only a single name (e.g., "Danjuma", "Bello", "Mamman") on informal records or older affidavits.
  - **How we accept the cost**: For a high-value consumer device credit transaction (handling laptops worth ₦360,000+), NIMC national identity records require a First Name and a Surname. Mononymous users must input their official NIMC-registered familial patronymic to satisfy statutory compliance.

### Rule 2: Primary Phone &mdash; Nigerian Telecommunication Prefix (+234 / 070, 080, 081, 090, 091)
- **What the rule is**: Enforces an 11-digit local format (`0803...`) or 13-to-14 digit international E.164 format (`+234803...`) matching verified Nigerian GSM mobile network prefixes (MTN, Airtel, Glo, 9mobile).
- **What goes wrong without it**: International numbers, invalid 7-digit landlines, or dummy strings are submitted. Because OTP dispatch and automated WhatsApp repayment reminders route through local Nigerian telecom aggregators, invalid prefixes cause immediate SMS routing failures, leaving the user unable to verify their agreement.
- **What legitimate user it will wrongly block**:
  - **Diaspora Nigerians & Regional Travelers**: Legitimate Nigerian citizens residing abroad or visiting Abuja who currently utilize international roaming SIM cards (e.g., UK `+44`, US `+1`, or Ghanaian `+233` numbers) to conduct business at Banex Plaza.
  - **How we accept the cost**: Our physical store inventory policy requires local SIM ownership because local telecom KYC is a core component of the secondary fraud assessment. Diaspora customers must provide a local contact line or purchase in full via cash.

### Rule 3: National Identity Number (NIN) &mdash; Exactly 11 Numeric Digits
- **What the rule is**: Restricts input to digits (`[0-9]`) and requires an exact length of 11 digits upon completion.
- **What goes wrong without it**: Customers enter Bank Verification Numbers (BVN, also 11 digits but distinct), voter card numbers, driver's license alphanumeric codes, or truncated 9-digit strings. This triggers expensive, failing NIMC verification API calls during in-store physical device collection.
- **What legitimate user it will wrongly block**:
  - **Recent NIN Enrollees with Temporary Slips**: Citizens whose NIN enrollment is pending or who have a 16-digit tracking reference rather than an issued 11-digit National Identity Number.
  - **How we accept the cost**: Subsidized 75% down-payment financing cannot be extended without a verified NIMC digital identity. The customer must resolve their NIMC issuance before applying for credit.

### Rule 4: Email Address &mdash; Valid Syntactic Structure (`local-part@domain.tld`)
- **What the rule is**: Checks for non-empty local-part, single `@` symbol, and valid domain label with at least a 2-character top-level domain (`/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`).
- **What goes wrong without it**: Customers enter typos like `user@gmail` (missing TLD) or `user gmail.com`. Contract PDFs, legal price lock certificates, and repayment receipts bounce, creating legal ambiguity over agreement delivery.
- **What legitimate user it will wrongly block**:
  - **Users with newer internationalized or non-traditional email domains**: Legitimate users with email addresses on new top-level domains containing accented characters or niche ccTLDs that may trigger overly rigid regex patterns.
  - **How we accept the cost**: We utilize a relaxed regex that accommodates all standard TLD lengths while requiring the essential domain structure.

### Rule 5: Password &mdash; Minimum 8 Characters (Length Over Complexity)
- **What the rule is**: Requires at least 8 characters. Does not mandate arbitrary symbols (`!@#$%`) or forced uppercase/lowercase combinations.
- **What goes wrong without it**: Trivial passwords ("1234", "shop") are brute-forced easily, allowing unauthorized parties to access sensitive customer contract data and NIN hashes.
- **What legitimate user it will wrongly block**:
  - **Users with cognitive impairments or elderly retail shoppers**: Customers who struggle to remember lengthy 8-character passphrases and prefer shorter 4-digit PINs.
  - **How we accept the cost**: We provide a visibility toggle ("Show Password") so users can visually verify what they have typed, and support password managers via proper `autoComplete="new-password"` attributes.

---

## 3. Real-Time vs. Submit-Time Validation Timing

A key principle of defensive UX is understanding **when** validation belongs:

1. **Registration (Real-Time Enforcement)**:
   - On registration, the platform is collecting novel personal data for the first time. Real-time inline feedback (e.g. as the user types their email or blurs a field) guides them toward a compliant format before submission, preventing a frustrating page-level rejection after filling out 6 fields.
2. **Login (Submit-Time Enforcement)**:
   - On login, aggressive real-time validation while typing is actively hostile. Showing a red error saying *"Invalid phone number"* while the user is halfway through typing their digits creates needless anxiety.
   - On the login tab, format checks are strictly deferred until the user clicks **"Sign In"**.

---

## 4. Why Checking Email Existence is Pointless Even if Possible

Applications must check email **format**, never email **existence**. Attempting to verify whether an email mailbox actually exists before sending a message is technically futile and operationally counterproductive for two fundamental reasons:

> **1. Modern Mail Servers Reject SMTP Verification Pings**:  
> High-volume email providers (such as Google Workspace, Microsoft 365, and Yahoo) deliberately disable or return ambiguous `250 OK` responses to SMTP `VRFY` and `RCPT TO` commands to prevent spammers from harvesting active directory accounts. Consequently, existence checks produce unreliable false positives and false negatives.
>
> **2. Existence Does Not Prove Ownership or Access**:  
> Even if an API could definitively verify that `ceo@dangote.com` exists, that confirmation provides zero proof that the individual sitting at the keyboard owns that address, has access to its inbox, or is authorized to enter into a credit agreement with it. True ownership can only be established asynchronously by transmitting a time-limited one-time verification code (OTP) or magic link directly to that inbox and requiring the recipient to prove access.

