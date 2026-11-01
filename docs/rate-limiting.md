# Rate Limiting Architecture & Defense-in-Depth (`docs/rate-limiting.md`)

**Workstream**: `task-04-server-security/`  
**Domain**: DG Tech Store (Shop ATF 03)  
**Standard**: Step 8 (Rate Limiting and its Inherent Boundaries)  

---

## 1. Why IP-Based Rate Limiting Alone is Insufficient

In Step 8.2 (`evidence/14-rate-limit-defeated.txt`), we proved that our sliding-window rate limiter locked out IP `102.89.33.50` on request #6, returning `HTTP 429 Too Many Requests`. However, by rotating the client IP header to `102.89.33.99`, the lockout was instantly defeated and the request succeeded.

IP-only rate limiting fails because:
1. **Trivial IP Spoofing & Rotation**: Attackers utilize residential proxy networks (e.g., BrightData, Oxylabs), Tor exit nodes, or cellular modem IP cycling to obtain millions of unique IPv4 and IPv6 addresses. A limit keyed only on IP costs an attacker a few fractions of a cent in proxy bandwidth.
2. **Asymmetric Cost**: The server consumes memory tracking ephemeral IP addresses, while the attacker trivializes the control with a single command-line header change (`-H "X-Forwarded-For: ..."`).

---

## 2. Multi-Dimensional Keying (What Serious Applications Key On)

To build robust defenses that survive network rotation, production platforms key on composite multi-dimensional tuples:

1. **Target Account + Action (Composite Key)**:
   - For login and password reset routes: Key on `account:{email}` or `account:{phoneNumber}` regardless of incoming IP.
   - If 5 failed attempts target `customer.ahmed@gmail.com` across 5 different IP addresses within 10 minutes, the account itself enters a temporary verification challenge (CAPTCHA or OTP requirement), defeating distributed credential stuffing.
2. **Device & Browser Fingerprinting**:
   - Hardware and software canvas fingerprinting, WebGL renderer strings, screen depth, and audio context entropy create a composite device ID that persists across IP rotations.
3. **JA3 / TLS Fingerprinting & HTTP/2 Settings**:
   - Automated attack scripts (Python `requests`, Go `net/http`, curl) generate distinct TLS client hello fingerprints (ciphers, extensions, elliptic curves) compared to legitimate mobile Chrome or Safari browsers on iOS/Android.
4. **Autonomous System Number (ASN) & Datacenter Detection**:
   - Requests originating from commercial hosting providers (AWS, DigitalOcean, Hetzner) are heavily throttled or challenged with Cloudflare Turnstile, as retail customers purchase devices from residential or cellular ASNs (MTN, Airtel, Spectranet).

---

## 3. Rate Limit Counter Storage: Options & Trade-Offs

| Storage Mechanism | Latency | Distributed Scalability | Operational Complexity | Failure Behavior | Chosen in Task 4 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **In-Memory (`Map`)** | **<0.1 ms** | Single process only (fails across multi-instance clusters) | Zero (no external dependencies) | Resets on restart | **Yes** (Development & Single-Node Baseline) |
| **Distributed Redis (Token Bucket)** | **1–3 ms** | Scales horizontally across multiple container replicas | Requires Redis cluster, connection pooling, and eviction monitoring | Fail open vs. fail closed dilemma | Production Target |
| **Relational Database (`dev.db`)** | **5–20 ms** | Consistent across instances | Causes extreme table bloat, write lock contention, and high I/O | May bring down main DB during DDoS | Anti-pattern |

### Trade-Off of Our In-Memory Choice:
We chose an in-memory sliding-window store (`lib/security/rate-limiter.ts`) for Task 4. 
- **Advantage**: Sub-microsecond latency ($<0.05\text{ ms}$), zero network roundtrip overhead, and zero external infrastructure dependencies.
- **Accepted Trade-Off**: If the Next.js process restarts, active lockout state is reset, and in a multi-container deployment, an attacker can round-robin requests across pods. In production, this layer is promoted to an external Redis cluster utilizing the sliding-window log or token bucket algorithm.

---

## 4. The Shared NAT Campus & Office Impact

Every strict rate limiter creates collateral damage for legitimate human users sharing a single public IP address via Network Address Translation (NAT):

### The Scenario:
- Banex Plaza merchants sharing a single commercial Wi-Fi router, or 5,000 students connected to a University of Abuja campus Wi-Fi network, all egress through **one shared public IPv4 address**.
- If our rate limit is set to 5 registration requests per minute per IP:
  1. Student A registers their account.
  2. Student B registers.
  3. Student C, D, and E register.
  4. Student F (a completely legitimate, distinct customer) attempts to sign up 30 seconds later and receives **`HTTP 429 Too Many Requests: Rate limit exceeded`**.

### The Mitigation:
1. **Higher Thresholds for Residential/Commercial ISPs**: Differentiate known shared mobile NAT pools (e.g., MTN Nigeria CGNAT `100.64.0.0/10`) from isolated server IPs.
2. **Step-Up Verification Rather Than Hard Lockout**: When the IP threshold is exceeded, the server does not reject legitimate traffic with a hard 429; it prompts the user for an interactive **CAPTCHA challenge** or SMS OTP verification, allowing real humans on shared connections to proceed while halting headless bots.

