# State Management: Failed Login to Password Recovery Flow

**Application:** DG Tech Store (Shop ATF 03, Banex Plaza, Wuse 2, Abuja)  
**Document:** `docs/state-management.md`  
**Task:** Task 5 — Step 6: State Management & Password Recovery  

---

## 1. The Interaction & State Pipeline

When a customer attempts to log into DG Tech Store and enters an incorrect password, forcing them to navigate to the password reset screen and manually re-type their long email address (`ahmed.ibrahim.abdullahi@gmail.com`) on a mobile phone keyboard in a busy Abuja retail environment introduces substantial UX friction and typos.

To solve this, DG Tech Store implements a hardened, privacy-conscious state handover:

```
[ POST /api/auth/login ] -> 401 Unauthorized
           |
           v
[ User clicks "Forgot Password?" ]
           |
           v
[ Client routes to /reset-password?email=ahmed.ibrahim@gmail.com ]
           |
           v
[ Form component pre-populates email field; password input remains focused & empty ]
```

---

## 2. Storage Choice & Evaluation

We evaluated three potential architectural mechanisms for carrying state between these two views:

| Mechanism | Implementation | Privacy & Security Profile | Verdict for DG Tech Store |
| :--- | :--- | :--- | :--- |
| **`localStorage`** | Store email under `localStorage.setItem('last_attempted_email', email)` | **HIGH RISK.** Persists indefinitely on the device disk across browser restarts. On shared computers or Banex Plaza cybercafes, subsequent visitors can read the previous customer's email. | **REJECTED.** Violates NDPA storage limitation principles. |
| **`sessionStorage`** | Store email in memory for the active tab | **MODERATE.** Clears when tab closes, but persists across accidental redirects. Vulnerable to DOM-based exfiltration if any script on the page inspects session storage. | **ACCEPTABLE, BUT COMPLEX.** Does not survive external browser link openings. |
| **URL Query Parameter (`?email=...`)** | Pass normalized email via Next.js router query param | **OPTIMAL & CONTROLLED.** Ephemeral, zero disk persistence. Read synchronously on component mount via `useSearchParams()`. | **SELECTED ARCHITECTURE.** |

---

## 3. Security Hardening & Defences

Passing application state via URL query parameters requires strict cryptographic and privacy controls to prevent common vulnerabilities:

### 1. Data Minimization (Public Identifiers Only)
- **What is permitted:** Only the public account identifier (`email`) is passed.
- **What is strictly forbidden:** The user's typed password, partial passwords, session tokens, BVNs, or error traces are **never** included in query parameters. Placing secrets in URL query strings causes them to leak into browser history, web server access logs, reverse proxy headers, and HTTP `Referer` headers transmitted to third-party CDNs.

### 2. Immediate History Scrubbing (Clean URLs)
When the Reset Password page mounts in the customer's browser, the component reads the email parameter into local React component state, validates its format using Zod, and then calls `window.history.replaceState({}, '', '/reset-password')`.  
This immediately removes the `?email=...` parameter from the browser's address bar. If the user bookmarks the page, shares the URL on WhatsApp, or copies the link, the email parameter is no longer exposed.

### 3. Server-Side Boundary Validation
The pre-populated email is treated by the server as purely untrusted client input. When the user clicks "Submit Password Reset", the payload is re-validated at the server boundary against `serverResetPasswordSchema` before any verification code is generated.

---

## 4. Verification Evidence

- `evidence/15-state-management-working.png`: Displays the password reset page with the email field pre-populated from the failed login attempt, with clean input focus and zero secret exposure.
- `app/(public)/reset-password/page.tsx`: Demonstrates the `useSearchParams()` reader and Zod boundary validation.
