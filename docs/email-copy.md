# Email Design System Adherence & Copy Critique (`docs/email-copy.md`)

**Workstream**: `task-04-server-security/`  
**Domain**: DG Tech Store (Shop ATF 03)  
**Standard**: Step 11 (Brand Token Consistency and Transactional Copywriting)  

---

## 1. Design Token Integration & Visual Consistency

In class, an agentic failure occurred where email templates rendered in arbitrary purple hex colors instead of the product brand blue because different LLM models selected arbitrary styles.

In DG Tech Store, our email template (`lib/mail/email-service.ts`) adheres strictly to the **Task 1 Design System Tokens** (`styles/tokens/roles.css`):

| Design System Role Token | Hex Color Code | Applied Email Element |
| :--- | :---: | :--- |
| `role.surface.background` | `#0F172A` | Outer email background and verification code container |
| `role.surface.container` | `#1E293B` | Central card container with subtle shadow |
| `role.brand.primary` | `#0284C7` | Top brand header banner (`DG TECH STORE`) |
| `role.accent.border` | `#38BDF8` | Dashed border surrounding the 6-digit OTP code |
| `role.text.primary` | `#F8FAFC` | Main heading and high-contrast OTP typography |
| `role.text.secondary` | `#94A3B8` | Body instructions and security advisory notes |
| `role.accent.warning` | `#F59E0B` | Advisory callout indicator |

As verified in `evidence/23-rendered-email.png`, the rendered email visually mirrors the main application interface, preventing brand disorientation or customer phishing suspicions.

---

## 2. Copywriting Critique: Developer/Agent vs. Real Customer Marketing

Transactional emails are frequently the very first direct contact a business has with a customer after signup. In agent-built applications, the copy is typically functional, sterile, and written like an engineering log entry:
> *"Confirm Your Account Registration. To complete your account activation and access the Flexi-Pay part-payment platform, enter this 6-digit verification code. If you did not request this registration, please disregard."*

### Why the Current Copy is Incomplete for Real Customers:
1. **The Copy is the Marketing**: A customer signing up for a high-value phone (Samsung Galaxy A15 or iPhone 13) on a part-payment plan is experiencing financial anxiety. Sterile verification copy misses the opportunity to establish trust, reassure the customer about device authenticity, and set clear expectations regarding in-store pickup at Banex Plaza.
2. **Missing Local Nigerian Context**: Customers in Abuja want to know: *Can I pick up today? Is the phone original with warranty? Where exactly in Banex is Shop ATF 03?*
3. **Over-Technical Phrasing**: Words like *"activation"*, *"single-use"*, and *"disregard"* sound like IT bureaucracy rather than a welcoming merchant relationship.

---

## 3. What We Would Change for Real Commercial Customers

If launching to live retail customers tomorrow, we would revise the email copy as follows:

```html
<!-- Revised Customer-Centric Copy -->
Subject: Your DG Tech Store Verification Code: [749201] (Banex Plaza Shop ATF 03)

Hello Ahmed,

Welcome to the DG Tech Store family! We are excited to help you get your next device with our zero-stress Flexi-Pay part-payment plan.

Here is your 6-digit activation code:
[ 7 4 9 2 0 1 ]
(Valid for the next 10 minutes)

What happens after you verify:
1. Select your device from our verified inventory (Samsung, Apple, Google Pixel).
2. Choose your part-payment schedule (60% down-payment, up to 90 days for balance).
3. Walk into Shop ATF 03, Banex Plaza, Wuse 2, Abuja to inspect and collect your phone today!

Questions? Chat directly with Chief Danladi or Ibrahim on WhatsApp: +234 803 999 0001.

Warm regards,
The DG Tech Store Team
Shop ATF 03, Banex Plaza, Wuse 2, Abuja
```

**Key Improvements**:
- Immediately establishes store physical location and credibility.
- Demystifies the next steps so the customer feels empowered rather than interrogated.
- Provides direct WhatsApp contact for real human assistance.

