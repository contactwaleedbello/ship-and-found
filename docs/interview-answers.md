# Engineering Screening Interview Defences & Answers

**Candidate:** Waleed Bello (Lead Software Engineer)  
**Organization:** DG Tech Store (Shop ATF 03, Banex Plaza, Wuse 2, Abuja)  
**Document:** `docs/interview-answers.md`  
**Task:** Task 5 — Step 9: The Hiring Defence  
**Format:** 22 Screening Questions (~200 words each) + RAG Knowledge Retrieval System  

---

### Question 1: Client-Side vs Server-Side Validation
**Question:** Explain the difference between client-side validation and server-side validation. Why is relying solely on client validation considered a catastrophic architectural flaw?  
**Answer:**  
Client-side validation runs inside the user's browser runtime (JavaScript/DOM) to provide immediate, accessible feedback as the user types. It highlights formatting errors—such as missing `@` signs in email addresses or malformed Nigerian phone numbers—before network transmission. However, client-side validation is strictly an ergonomic convenience, never a security control. The browser environment is completely untrusted and fully under the control of the user or an adversary.

Anyone attacking the application bypasses the form entirely, using automated tools like `curl`, Postman, or custom Python scripts to transmit payloads directly to the server's HTTP endpoints. If the server does not enforce independent boundary validation, arbitrary, unvalidated, or hostile data is injected directly into the database. This leads to phantom accounts, database constraint crashes, and severe injection vulnerabilities. Server-side validation—enforced via strict schemas like Zod at the API route boundary—is the sole and ultimate source of truth. It sanitizes, trims, lowercases, and validates every input field before any business logic or database query executes, guaranteeing data integrity regardless of how the request arrived.

---

### Question 2: Single-Page Architecture (SPA) Rationale
**Question:** Why was a single-page architecture (SPA) with conditional rendering chosen for the authentication flows instead of separate static HTML pages?  
**Answer:**  
In consumer electronics retail, especially in high-traffic commercial zones like Banex Plaza, Wuse 2, onboarding friction directly causes customer drop-off. If signup, login, and password reset are split into separate static pages, every transition requires a full browser document reload, re-executing CSS parsing, asset hydration, and DNS handshakes over potentially congested MTN/Airtel cellular networks.

Collapsing authentication into a single page using conditional rendering preserves shared client state and keeps the DOM footprint small. The active form state is synchronized with a clean URL query parameter (`?mode=login`, `?mode=register`, `?mode=reset`). This architecture guarantees that users can deep-link or bookmark a specific state while enjoying instant, zero-flicker transitions. Furthermore, when a user enters an incorrect password on the login form, the application transfers their email address into the password recovery view seamlessly without forcing them to re-type it on a mobile keyboard. The single-page architecture drastically reduces network roundtrips while maintaining a clean, accessible component hierarchy governed by unified layout tokens.

---

### Question 3: Conditional Rendering in Authentication Forms
**Question:** How does conditional rendering work in your authentication form, and how do you ensure state transitions do not confuse assistive technology?  
**Answer:**  
Conditional rendering is driven by a unified state machine coupled with Next.js router query parameters (`useSearchParams()`). A single parent container mounts the active child form component (`<LoginForm />`, `<RegisterForm />`, or `<ForgotPasswordForm />`) based on the active mode. To ensure assistive technologies like screen readers announce transitions accurately, we employ ARIA live regions (`aria-live="polite"` and `aria-atomic="true"`).

When the active mode switches, the heading level (`<h1>`) updates dynamically, and the live region announces the context change: *"Switched to Flexi-Pay Registration Form"*. Rather than unmounting fields destructively, shared non-sensitive fields (like the email input) retain their values across transitions, while sensitive fields (such as passwords) are explicitly wiped. We strictly avoid disorienting page jumps by managing keyboard focus programmatically: when switching to the registration view, focus moves immediately to the first input field (`fullName`), ensuring screen-reader users remain fully oriented within the document tab order.

---

### Question 4: The Danger of Disabled Submit Buttons
**Question:** What is the accessibility and UX danger of disabling the submit button on an invalid form? What should be done instead?  
**Answer:**  
Disabling a submit button (`disabled` attribute) until all form fields are valid is a common, anti-accessible design anti-pattern. When a button is disabled, browsers remove it from the keyboard tab order and suppress all pointer/click events. For sighted mouse users, the button looks greyed out; but for a blind user navigating with a screen reader (such as Hauwa in our scenario), the button completely vanishes from navigation. The screen reader falls silent, providing zero explanation as to why the form cannot be submitted or which field failed validation. The user assumes the site is frozen and abandons the session.

Instead, the submit button must **always remain enabled and focusable**. When a user clicks or tabs to the button and activates it while fields are invalid, the form handler intercepts the event, cancels submission, scrolls to the first invalid field, focuses it, and renders clear, descriptive error messages linked via `aria-describedby`. This ensures that every user—sighted, keyboard-only, or using assistive technology—receives explicit, actionable feedback explaining exactly what needs correction.

---

### Question 5: Accessible Error States & Non-Color Cues
**Question:** How does your form support a user who cannot see colour or who navigates using a screen reader?  
**Answer:**  
Under WCAG 2.1 Success Criterion 1.4.1 (Use of Color), color must never be the sole visual means of conveying information, indicating an action, or distinguishing an visual element. At DG Tech Store, invalid inputs do not merely display a red border. We enforce a triple-redundancy error pattern:

1. **Visual Text & Icons:** Every invalid field renders an explicit error message below the input, accompanied by an SVG warning icon, ensuring that someone with protanopia, deuteranopia, or monochrome vision immediately recognizes the error.
2. **Programmatic Association:** The input element includes `aria-invalid="true"` and `aria-describedby="field-error-id"`. When the screen reader focuses the input, it reads the label, the current value, and the exact error string in a single announcement.
3. **Contrast Compliance:** All text and border tokens meet WCAG Level AA contrast ratios (minimum 4.5:1 against the dark background, utilizing our design system's `--text-primary` and `--badge-danger-fg` tokens). This guarantees full legibility across low-contrast displays and outdoor sunlight conditions in Banex Plaza.

---

### Question 6: Defeating Account Enumeration
**Question:** Explain what an account enumeration attack is and how your login endpoint defeats it.  
**Answer:**  
An account enumeration attack occurs when an external attacker submits usernames or email addresses to an authentication endpoint to discover whether specific individuals have an account on the platform. If the server responds with *"Email does not exist"* when an email is not registered, but responds with *"Incorrect password"* when the email is registered, the attacker can systematically test thousands of emails to compile a list of verified customers. In high-value retail lending, this exposes customer identities and enables targeted phishing.

DG Tech Store defeats account enumeration through **Strict Response Equivalence**:
1. **Identical Status Code:** Both non-existent emails and incorrect passwords return `HTTP 401 Unauthorized`.
2. **Identical Response Body:** Both cases return the exact JSON payload: `{"error":"Unauthorized", "message":"Incorrect email or password."}`.
3. **Timing Equalization:** When a non-existent email is queried, the server executes a dummy Argon2id verification using an internal baseline hash to prevent attackers from using timing side-channels to distinguish between database lookup misses and password hash verification cycles.

---

### Question 7: Slow Hashing: Why Slow is Correct
**Question:** Why did you choose a slow hashing algorithm like Argon2id over a fast one like SHA-256 for passwords?  
**Answer:**  
In cryptography, the ideal speed of an algorithm depends entirely on its purpose. For message integrity or digital signatures, fast algorithms (like SHA-256) are desirable. For password storage, **speed is catastrophic**. 

When a database is breached, attackers use high-powered GPU clusters to execute offline dictionary and brute-force attacks. SHA-256 takes approximately **0.001323 ms** ($1.323\ \mu\text{s}$) per hash on standard hardware, allowing an attacker to test hundreds of millions of passwords per second. In our scenario, Chijioke’s driving school passwords were recovered in 24 hours because SHA-256 gave the attacker zero resistance.

We selected **Argon2id** (winner of the Password Hashing Competition). Configured with $m=65536$ (64MB RAM), $t=3$ time iterations, and $p=4$ parallelism threads, Argon2id takes **61.780 ms** on our Intel Core i7 server hardware. Because it is memory-hard, an attacker cannot mass-parallelize guesses on ASICs or GPUs without dedicating vast amounts of physical RAM. Slow is correct because it forces the attacker to spend unacceptable amounts of time and electricity on every guess.

---

### Question 8: Password Salting Mechanics & Storage
**Question:** What is the purpose of salting a password, and where is the salt stored?  
**Answer:**  
A salt is a unique, cryptographically random sequence of bytes generated independently for every password before hashing. Its purpose is to defeat pre-computed lookup attacks—specifically **Rainbow Tables**—and to prevent identical passwords from producing identical hash digests. If two customers at Banex Plaza choose `Password123!`, hashing them without a salt produces identical strings in the database, allowing an attacker to crack both simultaneously. With distinct salts, identical passwords produce completely different digests.

The salt is **not a secret** and does not need to be stored in an encrypted vault or environment variable. In modern hashing standards like Argon2id and bcrypt, the salt is encoded directly into the resulting modular crypt format hash string:
`$argon2id$v=19$m=65536,t=3,p=4$<salt>$<digest>`  
The salt is stored openly in the `passwordHash` column of the `User` table. When the user logs in, the algorithm parses the salt and tuning parameters from the stored string, combines the salt with the incoming password attempt, and verifies whether the computed digest matches.

---

### Question 9: The Three-Phase Database Migration Pattern
**Question:** Explain the Three-Phase Database Migration pattern and why adding a non-null column directly into a production database causes catastrophic failure.  
**Answer:**  
Executing `ALTER TABLE "User" ADD COLUMN "bvnNumber" TEXT NOT NULL;` against an existing production database fails immediately if the table already contains rows. The database engine cannot fulfill the `NOT NULL` constraint because existing records have no value for the new column, aborting the migration and taking the application offline.

To evolve database schemas safely under zero downtime, we enforce the **Three-Phase Migration Pattern**:
1. **Phase 1 (Add Optional):** Add the new column as nullable (`bvnNumber String?` in Prisma). Deploy this migration; existing application code continues to run without interruption.
2. **Phase 2 (Backfill Data):** Run an asynchronous data migration script that populates every existing row with verified data or a valid default placeholder (e.g. `UPDATE "User" SET "bvnNumber" = 'BVN-22200000' WHERE "bvnNumber" IS NULL;`). Update application code to write to both new and old fields if applicable.
3. **Phase 3 (Enforce Required):** Once every row in the database contains a valid value, deploy the final migration making the column required (`bvnNumber String @notnull`). The migration executes instantaneously without constraint violations.

---

### Question 10: Rate Limiting Placement & Configuration
**Question:** What is rate limiting, where should it be applied, and how did you configure it for DG Tech Store?  
**Answer:**  
Rate limiting throttles the number of HTTP requests a client can make to a specific endpoint within a given time window. It protects the application from credential-stuffing attacks, denial-of-service floods, and costly third-party API exhaustion (such as SMS OTP gateways). Rate limiting must be applied on the server side, as close to the network edge or application boundary as possible, keyed on the client's IP address and target account identifier.

At DG Tech Store, we implemented sliding-window rate limiting in `lib/security/rate-limiter.ts` configured as follows:
- **Registration & Password Reset Endpoints:** Strictly limited to **5 requests per 60 seconds** per IP address. This prevents automated bot registration floods and spamming expensive SMS verification gateways.
- **Login Endpoint:** Configured for **10 requests per 60 seconds** per IP address. This allows legitimate users to recover from occasional typos while shutting down brute-force dictionary attacks. When the limit is exceeded, the server returns `HTTP 429 Too Many Requests` with a mandatory `Retry-After` header.

---

### Question 11: Privacy-Preserving Breach Checking (k-Anonymity)
**Question:** Explain how your application checks whether a customer's password has been exposed in a data breach without sending the password to HaveIBeenPwned.  
**Answer:**  
Transmitting a customer's plaintext password—or even its full hash—over the internet to a third-party service violates fundamental data protection principles and creates severe supply-chain exposure. Instead, DG Tech Store utilizes the **k-Anonymity Mathematical Model** implemented by the HaveIBeenPwned Pwned Passwords API.

The process operates as follows:
1. The server computes the SHA-1 hash of the candidate password locally (e.g., `21BD04CB5321FD719FDDACEE574D1880F12BF823`).
2. The server splits the hash into a 5-character **prefix** (`21BD0`) and a 35-character **suffix** (`4CB5321FD719FDDACEE574D1880F12BF823`).
3. The server sends **only the 5-character prefix** to `https://api.pwnedpasswords.com/range/21BD0`.
4. The API returns a list of approximately 500 to 1,000 hash suffixes that share that same prefix, along with their breach counts.
5. The server checks locally whether our suffix exists in the returned list.  
HaveIBeenPwned never learns what password was entered, nor even its full hash. Privacy is 100% preserved through mathematical k-anonymity.

---

### Question 12: Decoupling Email Delivery from HTTP Lifecycles
**Question:** Why must transactional email delivery be decoupled from the HTTP request/response cycle, and what happens if you send email synchronously?  
**Answer:**  
SMTP connections are notoriously slow, unpredictable, and prone to network latency. Establishing a TLS handshake with a remote mail server (such as SendGrid, Postmark, or Mailgun), transmitting MIME body parts, and waiting for SMTP server acknowledgment typically takes between 1.5 to 5.0 seconds. Under congested network conditions or temporary mail server throttling, it can take up to 30 seconds or timeout entirely.

If email delivery is executed synchronously inside the HTTP handler:
1. **User Experience Degrades:** The customer sits watching a frozen loading spinner for 4 seconds after clicking "Register".
2. **Server Thread Starvation:** Web server worker threads are held open waiting on external network I/O, drastically reducing application concurrency and throughput.
3. **Cascading Failures:** If the SMTP server drops the connection, the entire HTTP transaction fails, returning an error to the user even though their database account was already created.

Decoupling email delivery—using an asynchronous background job queue (e.g. BullMQ, Redis, or Next.js background workers)—allows the HTTP endpoint to return `HTTP 201 Created` in **under 15 ms**, while mail delivery executes reliably in the background with automatic retries.

---

### Question 13: Soft Gating vs Hard Gating
**Question:** What is the architectural difference between soft gating and hard gating, and why did DG Tech Store choose hard gating?  
**Answer:**  
**Soft Gating** grants an active session immediately upon registration, allowing the user to explore the application while displaying a passive banner reminding them to verify their email. **Hard Gating** refuses to issue a session upon registration, redirecting the user to an OTP verification screen and withholding authenticated access until the verification code is entered.

We chose **Hard Gating** because of DG Tech Store’s risk profile:
- We finance physical consumer electronics (MacBooks and iPhones worth millions of Naira) under Flexi-Pay hire-purchase contracts. Releasing high-value assets to an unverified email address creates immediate, unrecoverable fraud risks.
- Under NDPA Section 24 and FCCPC Consumer Lending Regulations, credit contracts require verified customer contact channels to remain legally enforceable in Abuja courts.
- While soft gating fits low-risk digital products (like Notion or Medium) where instant activation is paramount, hard gating is the established regulatory standard for financial services (like Revolut or PiggyVest) where identity assurance precedes capital exposure.

---

### Question 14: The Split-Secret Session Token Pattern
**Question:** Explain the Split-Secret Session Token pattern and why raw session tokens must never be stored in the database.  
**Answer:**  
In naive web architectures, developers generate a random session token and insert it directly into the database: `INSERT INTO Session (token) VALUES ('abc123')`. If an attacker later breaches the database through SQL injection, local file inclusion, or an exfiltrated backup snapshot, the attacker gains access to every active session token. They can copy the tokens into their browser cookies and instantly hijack all active accounts without cracking passwords.

To defeat this, DG Tech Store implements the **Split-Secret Session Token Pattern**:
1. **The Client Holds the Secret:** The server generates a 256-bit CSPRNG token (`node:crypto.randomBytes(32)`). The raw token is sent to the client browser inside an `HttpOnly` cookie.
2. **The Database Holds the Digest:** The server computes a SHA-256 hash of the raw token (`crypto.createHash('sha256').update(rawToken).digest('hex')`) and stores only the hash in `prisma/dev.db`.
3. **Verification:** When a request arrives, the server hashes the cookie token and looks up the hash in the database.  
Because SHA-256 is an irreversible one-way cryptographic function, a leaked database provides an attacker with useless hashes that cannot be converted back into valid browser cookies.

---

### Question 15: The Three Critical Cookie Flags
**Question:** Explain what the three cookie flags (HttpOnly, Secure, SameSite) do and what attack each prevents in DG Tech Store.  
**Answer:**  
The `dg_session` cookie enforces all three standard security flags:
1. **`HttpOnly`:** Forbids client-side JavaScript (`document.cookie`) from reading or modifying the cookie. It prevents **XSS Session Theft**: even if an attacker injects a malicious script via a customer product review, the script cannot exfiltrate the session token.
2. **`Secure`:** Directs the browser to transmit the cookie strictly over encrypted TLS/HTTPS connections. It prevents **Man-in-the-Middle (MitM) Packet Sniffing**: customers accessing the store over open, untrusted Wi-Fi routers at Banex Plaza cannot have their session tokens intercepted in cleartext.
3. **`SameSite=Lax`:** Restricts cross-site cookie transmission on state-changing requests (POST/PUT/DELETE) initiated by third-party origins, while allowing top-level navigation. It prevents **Cross-Site Request Forgery (CSRF)**: malicious external websites cannot silently submit unauthorized hire-purchase financing orders on behalf of an authenticated customer.

---

### Question 16: The Logout Network Failure Edge Case
**Question:** What happens if a logout request fails mid-flight due to a network drop? How did you make your logout robust to this edge case?  
**Answer:**  
If a user taps "Logout", the browser clears its cookie optimistically, but the HTTP request to delete the session drops mid-flight due to flaky cellular coverage, a dangerous split-brain state occurs:
- The browser believes the user is logged out.
- The server never received the request; the session row in SQLite remains completely valid for up to 7 days.
- If an adversary previously intercepted that token, they can continue using it to drain funds or place orders.
- If the user presses the back button, an unhardened browser might display sensitive data from its Back-Forward Cache (bfcache).

**Our Fix:**  
1. **Asynchronous Transport Guarantee:** Client logout uses `navigator.sendBeacon('/api/auth/logout')` with a fallback to `fetch({ keepalive: true })`, ensuring the OS completes the HTTP POST even if the tab unloads.
2. **Server-Side Cache Invalidation:** Protected routes transmit `Cache-Control: no-store, no-cache, must-revalidate, private`, forcing the browser back button to revalidate with the server, which immediately returns `HTTP 401`.
3. **Idempotent Destruction:** `destroySession` gracefully handles already-deleted sessions, ensuring retries succeed cleanly.

---

### Question 17: Password Reset Global Session Invalidation
**Question:** Why must a password reset immediately kill all active sessions across all devices, and how is this implemented?  
**Answer:**  
A password reset is an explicit, definitive signal that an account's credentials have been compromised or that the user has lost control of an authorized device. If an attacker stole Ahmed's laptop at Banex Plaza while his session was active, and Ahmed rushes to his phone to reset his password, allowing existing sessions to remain valid would permit the thief to continue accessing Ahmed’s account. Naive JWT architectures suffer from this flaw because issued tokens cannot be revoked before their expiration timestamp without complex distributed blocklists.

Because DG Tech Store uses server-stored session records, global revocation is instantaneous:
In `app/api/auth/reset-password/route.ts`, immediately after updating the password hash with Argon2id, the server executes:
`await destroyAllUserSessions(user.id);`  
This executes `prisma.session.deleteMany({ where: { userId } })`, purging every session row belonging to that user. The thief’s laptop on its very next HTTP request receives `HTTP 401 Unauthorized` and is ejected to the login screen.

---

### Question 18: Deleting vs Anonymising Under NDPA 2023
**Question:** Explain the difference between deleting data and anonymising data under the Nigeria Data Protection Act (NDPA) 2023.  
**Answer:**  
Under Section 65 of the NDPA 2023:
- **"Deleting" (Erasure):** Involves the physical or electronic destruction of personal data so that the records cease to exist on the storage medium (e.g. SQL `DELETE FROM User`). While it eliminates personal data, it also destroys all relational integrity, historical ledger links, and non-personal audit attributes.
- **"Anonymising":** Refers to processing personal data in such an irreversible manner that the data subject can no longer be identified, directly or indirectly, by any means reasonably likely to be used by anyone.

Crucially, under NDPA Section 3(2), **anonymized data ceases to be classified as personal data**. Once names, phone numbers, BVNs, and emails are overwritten with synthetic redacted strings, the data subject’s privacy is completely and permanently protected under Section 34 (Right to Erasure), while the mathematical accounting record (amount, date, receipt number) is preserved to satisfy tax and financial regulations.

---

### Question 19: The Statutory Legal Conflict (NDPA vs FIRS CITA)
**Question:** Identify a specific conflict between data protection law and another business regulation governing DG Tech Store, and explain how you resolved it with statutory citations.  
**Answer:**  
A direct statutory conflict exists between:
1. **The Privacy Law:** **Nigeria Data Protection Act (NDPA) 2023, Section 34 ("Right to Erasure"):** Grants customers the right to have all their personal data erased upon request.
2. **The Tax Law:** **Companies Income Tax Act (CITA) 2004 (as amended), Section 55:** Mandates that every Nigerian business must maintain complete books of account, sales ledgers, and transaction receipts for a minimum of **six (6) years**. Under Section 55(3), failure to preserve these records is a criminal offense punishable by fines and business sanctions from the Federal Inland Revenue Service (FIRS).

**The Resolution:**  
Under NDPA Section 34(2)(b), the Right to Erasure is explicitly subordinate where processing is necessary *"for compliance with a legal obligation to which the data controller is subject by a law in Nigeria."*  
We resolve the conflict via **Irreversible Anonymization**: personal identifiers (`fullName`, `email`, `bvnNumber`, `ninEncrypted`) are purged from the database, while the `Payment` and `PaymentAttempt` ledger rows are preserved for six years. The books balance, FIRS audits pass, and privacy is legally respected.

---

### Question 20: Cross-Task Engineering Metric Verification
**Question:** State your exact type scale ratio, Argon2id vs SHA-256 hashing benchmark numbers, and rate limiting configuration from earlier tasks.  
**Answer:**  
The engineering benchmarks verified across Tasks 1, 2, 3, 4, and 5 in this codebase are strictly consistent and verified by automated machine evidence:

1. **Modular Type Scale Ratio:**  
   - Scale: **`1.250` (Major Third)**  
   - Base Size: **16.00px** (`--text-body-md` / 1.000rem)  
   - Display Size: **39.06px** (`--text-display` / 2.441rem)  
   - Proportional Steps: Caption (12.80px), Body Sm (14.00px), Body Md (16.00px), Title Sm (20.00px), Title Md (25.00px), Title Lg (31.25px), Display (39.06px).

2. **Password Hashing Benchmark Timings (Intel Core i7-9750H macOS Host):**  
   - **Argon2id:** **`61.780 ms`** per hash (Configured with $m=65536$ [64MB], $t=3$ iterations, $p=4$ parallelism).  
   - **SHA-256:** **`0.001323 ms`** ($1.323\ \mu\text{s}$) per hash.  
   - Ratio: Argon2id is approximately **46,700 times slower** than SHA-256, mathematically defeating GPU brute-force attacks.

3. **Rate Limiting Thresholds:**  
   - **Registration & Password Reset:** **5 requests per 60 seconds** per IP.  
   - **Login Endpoint:** **10 requests per 60 seconds** per IP.

---

### Question 21: RBAC: 401 Unauthorized vs 403 Forbidden
**Question:** What is the technical difference between HTTP 401 Unauthorized and HTTP 403 Forbidden in Role-Based Access Control (RBAC)? How does your middleware enforce this on administrative routes?  
**Answer:**  
In RFC 9110 HTTP semantics:
- **`401 Unauthorized`:** Specifically means **Unauthenticated**. The client has provided no credentials or invalid/expired session credentials. The server informs the client: *"I do not know who you are; please log in."*
- **`403 Forbidden`:** Means **Unauthorized**. The server successfully verified the client’s identity, but that authenticated identity **does not possess the required permissions or role** to access the requested resource. The server informs the client: *"I know who you are, but you are not allowed in here."*

In `middleware.ts`, when a user accesses `/admin/inventory-approvals`:
- If the `dg_session` cookie is missing or invalid: The middleware redirects to `/login` (for pages) or returns `401 Unauthorized` (for APIs).
- If the session is valid, the middleware resolves `user.role`. If `user.role === 'CUSTOMER'`, the middleware **must never redirect to login** (because the user is already logged in!). Instead, it halts execution and returns **`HTTP 403 Forbidden`**, rendering our dedicated access denial boundary page.

---

### Question 22: Secure State Handover from Failed Login
**Question:** How does state travel from a failed login attempt to the password recovery screen without leaking credentials or violating user privacy?  
**Answer:**  
When a login fails due to an incorrect password, forcing the user to re-type their long email address on a mobile device creates severe friction. DG Tech Store implements an ephemeral, zero-leakage state handover:

1. **Public Identifier Only:** Only the normalized `email` string is transferred; the entered password, partial password, or error codes are **strictly forbidden** from transfer.
2. **Transport via Ephemeral Query Param:** The client navigates to `/reset-password?email=encodeURIComponent(email)`. We explicitly reject `localStorage` because local storage persists on shared Banex Plaza computers indefinitely.
3. **Immediate URL History Sanitization:** Upon mounting, the React component reads the email into component memory via `useSearchParams()`, validates it via Zod, and immediately invokes `window.history.replaceState({}, '', '/reset-password')`. This removes the email from the browser address bar, ensuring it does not leak into browser history, bookmarks, or external referrer headers.

---

## 3. RAG Retrieval Knowledge Chunk Integration

To prepare for the oral viva evaluation regarding our Retrieval-Augmented Generation (RAG) architecture, the following knowledge chunk is persisted in `prisma/dev.db` under table `KnowledgeChunk`:

```json
{
  "documentTitle": "Banex Plaza Flexi-Pay Hire-Purchase Terms 2026",
  "sourceUrl": "/docs/retention-matrix.md",
  "chunkIndex": 0,
  "content": "DG Tech Store (Shop ATF 03, Banex Plaza, Wuse 2, Abuja) retains customer financial transactions and hire-purchase contracts for 6 years in accordance with Section 55 of the Companies Income Tax Act (CITA) and Federal Competition and Consumer Protection Commission (FCCPC) regulations. Right to Erasure requests under Section 34 of the Nigeria Data Protection Act (NDPA) 2023 result in the irreversible anonymization of PII while preserving accounting ledger integrity.",
  "tokenCount": 78
}
```

### Viva Explanation:
This chunk is embedded and stored in the database to allow our automated support and compliance assistant to answer legal inquiries regarding data deletion. When a customer or auditor asks *"Why was my payment record preserved after I deleted my account?"*, the RAG pipeline retrieves this chunk, citing Section 55 of CITA and Section 34 of the NDPA, providing mathematically sound, legally defensible justifications directly from our verified store policies.

