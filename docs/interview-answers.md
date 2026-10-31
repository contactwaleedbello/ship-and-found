# Technical Viva Defence & Interview Answers (`docs/interview-answers.md`)

**Workstream**: `task-04-server-security/`  
**Domain**: DG Tech Store (Shop ATF 03)  
**Standard**: Comprehensive answers for all 19 viva defence questions (~200 words each), plus viva preparation notes.

---

## Hashing (Questions 1 to 5)

### Question 1: Why should you hash passwords?
We hash passwords to protect user credentials in the event of an inevitable database compromise or data leakage. In modern software engineering, security architects operate under the assumption of breach: databases can be leaked via SQL injection, stolen backup snapshots, compromised replica credentials, or insider threats. If passwords were stored in plaintext, an attacker possessing the database immediately acquires full access to every user account on the platform. More severely, because human beings frequently reuse the exact same password across personal banking, corporate email, and retail accounts, storing plaintext passwords turns a breach of our retail store into a catastrophic breach of our customers' entire digital lives.

A cryptographic hash is a one-way mathematical function: it transforms arbitrary input bytes into a fixed-length string such that recovering the original plaintext from the hash is computationally infeasible. When a user logs in, the server hashes the submitted password and compares the resulting digest against the stored hash. The server never needs to know the plaintext password to authenticate the user; it only needs mathematical proof of equality. Hashing ensures that even if our database table is dumped and published on a hacker forum, the cleartext credentials of our customers remain shielded.

---

### Question 2: Why use bcrypt (or Argon2id) instead of SHA-256 for passwords?
Using SHA-256 for passwords is a fundamental architectural failure because SHA-256 is designed to be **fast**, whereas password verification algorithms must be **slow and computationally expensive**. SHA-256 was engineered for high-throughput data integrity, cryptographic signing, and network packet verification; modern processors and consumer GPUs can compute hundreds of billions of SHA-256 hashes per second. As measured on our development hardware, a single CPU core computes a SHA-256 hash in approximately $0.0013\text{ ms}$ (over 750,000 hashes per second per core). On a standard 8x NVIDIA RTX 4090 GPU cracking rig running Hashcat, an attacker executes ~200 billion SHA-256 guesses per second, cracking an 8-character password in roughly 14 seconds.

In contrast, adaptive password algorithms like bcrypt and Argon2id are specifically designed to be slow and resource-intensive. Argon2id incorporates a tunable work factor across time, parallelism, and crucially, **memory hardness** ($m=64\text{MB}$ per hash instance). On our machine, an Argon2id hash requires $61.78\text{ ms}$&mdash;over 46,000 times slower than SHA-256 on CPU, and millions of times slower on GPUs because the 64 MB memory requirement starves the GPU's memory bus. Slow algorithms neutralize brute-force attacks by shifting the computational cost entirely onto the attacker.

---

### Question 3: What is a salt and why do you need it?
A salt is a cryptographically secure random sequence of bytes generated independently for every user account and prepended or appended to the plaintext password prior to hashing. The resulting salt and hash are stored together in the user database record (or embedded directly into the serialized hash string, as in Argon2id and bcrypt). 

We need a salt for two decisive reasons:
1. **Preventing Precomputed Rainbow Table Attacks**: Without a salt, common passwords always produce identical hashes (e.g., `password123` always produces the exact same digest). An attacker can precompute the hashes of millions of common passwords into a lookup table ("rainbow table") and crack stolen database hashes in $O(1)$ constant time. Salting makes precomputation mathematically impossible because the attacker would have to compute a separate multi-gigabyte rainbow table for every unique salt.
2. **Eliminating Password Collision Correlation**: If two users (or thousands of users) choose the same password, salting guarantees that their database hashes share zero identical characters. An attacker cannot look at the table and immediately deduce that User A and User B share the same password. Each account must be attacked individually from scratch.

---

### Question 4: What salt rounds, or what work factor, should you use? Give a number and defend it.
For bcrypt, the current production standard is **12 salt rounds** (a cost factor of $2^{12} = 4,096$ iterations). For Argon2id, our adopted configuration is **$m=65536\text{ KiB}$ (64 MB of RAM), $t=3\text{ iterations}$, and $p=4\text{ parallel threads}$** (aligned with OWASP Password Storage Guidelines).

We defend these numbers through the balance between authentication latency and attacker work factor:
- **Human Ergonomics**: The target execution time for password hashing on production server hardware is between **50 milliseconds and 250 milliseconds**. On our hardware, Argon2id ($m=64\text{MB}, t=3, p=4$) measures exactly **$61.78\text{ ms}$**; bcrypt at 12 rounds measures approximately **$85\text{ ms}$**. To a human customer logging into DG Tech Store on a mobile connection, a 60–80ms server response is instantaneous and imperceptible, easily absorbed within normal network packet transit times.
- **Server Capacity & DoS Defense**: Setting the cost factor excessively high (e.g., bcrypt 15 rounds taking ~2 seconds) would allow an adversary to launch a trivial denial-of-service attack: sending 20 concurrent login requests would peg all server CPU cores at 100%, starving the application.
- **Attacker Asymmetry**: A 61ms work factor limits an attacker's single-core cracking rate to ~16 guesses per second, converting an 8-character brute-force keyspace from 14 seconds into nearly 9 years of sustained compute time.

---

### Question 5: Storing passwords in a database: plain text, SHA-256, AES-256 encryption, and adaptive hashing. Which is correct and why are the other three wrong?
The only correct choice is **adaptive hashing** (such as Argon2id or bcrypt). The other three options are fundamentally defective, with AES-256 failing for a completely different architectural reason than plaintext and SHA-256.

1. **Plain Text is Wrong**: Zero security boundary. Any accidental log dump, database backup misplacement, or SQL injection discloses all customer passwords in cleartext instantly.
2. **SHA-256 is Wrong**: Too fast. Even with a salt, SHA-256 allows billions of brute-force attempts per second on consumer GPU clusters, rendering dictionary and pattern cracking trivial.
3. **AES-256 Encryption is Wrong for a Completely Different Reason**:
   - Plaintext and SHA-256 fail because they do not protect the password from recovery. AES-256 is strong encryption, but encryption is a **two-way reversible function** designed for retrieval. Passwords should **never** be retrievable.
   - The fundamental flaw of encryption is **key management**: the decryption key must exist somewhere on the server to verify incoming passwords. If an attacker compromises the server infrastructure, they obtain both the encrypted database and the decryption key, allowing them to decrypt every single customer password back into cleartext. Adaptive hashing is a **one-way function** with no decryption key in existence anywhere.

---

## Validation (Questions 6 to 11)

### Question 6: Why is client-side validation not enough?
Client-side validation is solely an ergonomic convenience for cooperative human users using standard graphical web browsers; **it is not a security control**. As proven conclusively in Task 3 and Task 4, any request originating from the client can be generated, manipulated, or replayed by an attacker who bypasses the browser completely using tools like `curl`, Postman, automated Python scripts, or custom HTTP clients.

When an attacker interacts with an application, they do not click form buttons or execute browser JavaScript. They inspect network traffic, discover the underlying HTTP endpoint (`POST /api/auth/register`), and construct raw TCP/HTTP requests directly to the server. If the backend relies on the frontend to check that a full name has at least two words or that an email format is valid, an attacker sends `{"fullName": "a"}` and the server obediently writes corrupt, malicious, or unvalidated data into the database. Furthermore, client-side validation code can be disabled, bypassed via browser developer tools, or modified in client memory. The server is the only boundary that cannot be modified by the user; therefore, the server must be the absolute source of truth.

---

### Question 7: What security checks belong in the frontend, and what must the server enforce regardless?
**Frontend Security Responsibilities (Ergonomics & Fast Feedback)**:
The frontend is responsible for immediate, user-friendly feedback that assists cooperative users in entering correct data before making an expensive network roundtrip. This includes:
1. Inline format guidance (e.g., reminding a Nigerian user to include the `+234` prefix or informing them of an 8-character password length).
2. Field presence checks on blur to assist color-blind or screen-reader users before form submission.
3. Obvious syntactic checks (basic email structure, numeric input restrictions).
4. Preventing accidental double-clicks on submit buttons via `aria-disabled="true"`.

**Server Enforcement Responsibilities (Absolute Authority Regardless)**:
The server must treat every incoming request as potentially malicious and enforce the complete security boundary independently:
1. Complete structural and type validation (Zod schema checking data types, minimum/maximum lengths, regex patterns, and string trimming).
2. Authorisation and session validity (verifying cryptographic signatures, token expiration, and role-based permissions).
3. Business logic constraints (ensuring down-payments meet minimum percentage thresholds, verifying device stock availability).
4. Uniqueness checks and foreign key referential integrity in database transactions.
5. Rate limiting, IP throttling, and breached password detection.

---

### Question 8: The user interface hides the delete button for non-administrators. Is that enough? If not, what does an attacker do instead?
Hiding the delete button in the UI is **completely ineffective as a security control**. Hiding UI elements is a cosmetic presentation choice known as "security through obscurity"; it provides zero authorization enforcement at the application protocol layer.

An attacker does not rely on clicking buttons rendered in HTML:
1. **Endpoint Discovery**: The attacker inspects the application's compiled JavaScript bundles, observes network API traffic generated by administrators, or guesses standard REST conventions (e.g., `DELETE /api/devices/dev-a15` or `POST /api/admin/deletion-requests`).
2. **Direct API Dispatch**: The attacker opens a terminal or API client and sends the raw HTTP request directly to the endpoint, attaching their own customer authentication token in the `Authorization` or `Cookie` header.
3. **Exploitation**: If the server route handler only checks that the user is authenticated without explicitly validating that `user.role === 'OWNER'` or `'ADMIN'`, the server executes the deletion, resulting in Broken Object Level Authorization (BOLA / IDOR).

**Required Defense**: The backend route handler must independently evaluate role-based access control (RBAC) on the server session before executing any destructive query.

---

### Question 9: What is the difference between validation, encoding, and sanitisation?
While often conflated, these three concepts operate at distinct stages of data processing:

1. **Validation (Verification of Shape & Invariants)**:
   - Validation is the process of evaluating incoming data against an explicit structural contract. It checks: *Is this data acceptable according to our domain rules?*
   - Validation accepts or rejects data without altering it. For example, verifying that `phoneNumber` matches `/^\+234[789][01]\d{8}$/`. If it matches, the request proceeds; if it fails, the server rejects it with `HTTP 422 Unprocessable Content`.
2. **Encoding (Contextual Escaping for Safe Rendering)**:
   - Encoding transforms data into an alternate format so that downstream interpreters (HTML parsers, SQL engines, JSON serializers) treat it strictly as data rather than executable code.
   - Example: Converting `<script>` into `&lt;script&gt;` when rendering text into an HTML page to prevent Cross-Site Scripting (XSS). Encoding preserves the original meaning while neutralizing execution in that specific context.
3. **Sanitisation (Mutating or Stripping Unwanted Content)**:
   - Sanitisation modifies incoming input to strip dangerous elements (e.g., using DOMPurify to strip `<script>` tags from rich text while preserving `<b>` and `<i>` tags, or trimming leading/trailing whitespace). Sanitisation alters the user's input before processing.

---

### Question 10: Why would you replace the incoming request body with the parsed and validated data rather than leaving both available?
In modern backend engineering (such as with Zod schemas: `const data = serverRegisterSchema.parse(rawBody)`), you must discard the original raw request body and strictly pass the parsed, validated `data` object to downstream business logic.

Leaving the unparsed raw body accessible creates severe vulnerabilities:
1. **Mass Assignment Vulnerability (Over-Posting)**: An attacker submits a valid registration payload with an extra injected property: `{"fullName": "Ahmed Danjuma", ..., "role": "OWNER"}`. If downstream handlers read from the raw body rather than the validated schema (which strips unknown keys), the extra `role: "OWNER"` property is passed directly into `prisma.user.create({ data: rawBody })`, granting the attacker administrative access.
2. **Type Coercion & Normalization Inconsistencies**: The schema may trim whitespace or lowercase an email (`ahmed@gmail.com`). If a developer downstream references `rawBody.email`, they use the un-normalized uppercase string (`Ahmed@Gmail.com`), reintroducing case-mismatch bugs.
3. **Prototype Pollution**: Schema parsers strip dangerous prototype-polluting keys (`__proto__`, `constructor`) that may linger on raw JSON objects.

---

### Question 11: Why validate route parameters and query strings, not just the body?
Every input vector that reaches the server is an attack surface. Route parameters (e.g., `/api/devices/[id]`) and URL query strings (e.g., `?mode=signup&limit=10`) are just as accessible to an attacker as the JSON body and must be validated with equal rigor:

1. **SQL / ORM Query Injection**: Route parameters are frequently passed directly into database queries (e.g., `prisma.device.findUnique({ where: { id: params.id } })`). If `params.id` is not validated as a string or UUID, an attacker can pass unexpected types, nested objects, or database operators to trigger runtime crashes or unintended query logic.
2. **Path Traversal & Resource Exhaustion**: If a route parameter is used in file lookups or template rendering (`/api/docs/[filename]`), unvalidated parameters containing `../` allow an attacker to traverse the server filesystem and read sensitive environment files (`/etc/passwd`, `.env`).
3. **Business Logic Manipulation via Query Parameters**: Query parameters frequently control pagination limits, sorting orders, and tenant IDs (`?limit=10000000`). If unvalidated, an attacker requests a 10-million-row page, exhausting server memory and crashing the database connection pool.

---

## Rate Limiting (Questions 12 to 16)

### Question 12: How do you rate limit unauthenticated requests, and what is the problem with the header you would reach for first?
To rate limit unauthenticated requests (such as public registration, login, and password reset endpoints), the server tracks the frequency of incoming HTTP requests originating from the client's network address over a sliding time window (e.g., 5 requests per 60 seconds).

The header developers instinctively reach for first is **`X-Forwarded-For`** (or `X-Real-IP`).
The fatal problem with `X-Forwarded-For` is that **it can be trivially spoofed by the client unless strictly controlled by a trusted reverse proxy**:
- In standard HTTP, an attacker can set arbitrary headers: `curl -H "X-Forwarded-For: 1.2.3.4"`.
- If our backend application directly trusts the incoming `X-Forwarded-For` header without verifying that it was set by a trusted reverse proxy (like Cloudflare, NGINX, or AWS ALB), the attacker rotates the header on every single request (`1.2.3.4`, `1.2.3.5`, `1.2.3.6`). The rate limiter sees a different IP on every iteration and never triggers a lockout.
- To use `X-Forwarded-For` securely, the server must extract only the client IP appended by the **innermost trusted proxy layer** and strip all client-supplied spoofed headers at the network ingress boundary.

---

### Question 13: Which rate limiting algorithm would you choose for a production API, and what is the boundary burst problem?
For a production API, the optimal choice is the **Token Bucket** algorithm (or **Sliding Window Log / Sliding Window Counter**).

**The Boundary Burst Problem (Fixed Window Defect)**:
The simplest algorithm is the **Fixed Window Counter** (e.g., allowing 100 requests per clock minute: 12:00:00 to 12:01:00).
The boundary burst problem occurs because the fixed window resets at exact clock intervals:
- An attacker sends 100 requests at 12:00:59 (the very end of Window 1).
- The window resets at 12:01:00.
- The attacker immediately sends another 100 requests at 12:01:01 (the start of Window 2).
- Across a 2-second time span, the server receives **200 requests**&mdash;double the intended rate limit. This burst can overwhelm downstream database connections.

**Why Token Bucket / Sliding Window Solves It**:
The Token Bucket algorithm continuously replenishes tokens at a constant fractional rate while allowing defined burst capacity. The Sliding Window Counter measures the request rate over a rolling time window calculated continuously from the current millisecond ($T - 60\text{s}$), completely eliminating the boundary reset burst.

---

### Question 14: Why use a shared store for your counters rather than in-memory counters on each server?
In modern production cloud architectures, applications do not run as a single monolithic process on one server; they run across multiple horizontally scaled containers, serverless instances, or Kubernetes pods behind a load balancer.

If rate limit counters are stored in local in-memory structures (like a JavaScript `Map`), each server instance maintains its own private counter:
1. **Multiplied Attack Capacity**: If 5 server replicas run behind a round-robin load balancer and each enforces a limit of 10 requests per minute, an attacker can distribute requests across the pool and make **50 requests per minute** before being locked out. As the cluster scales up to handle traffic, the attacker's attack capacity increases proportionally.
2. **Ephemeral Reset on Deployments**: In cloud environments, pods restart, auto-scale, or re-deploy continuously. Every time a container restarts, its in-memory counters reset to zero, erasing active lockout state.

**The Solution**: A fast, centralized in-memory datastore like **Redis** (or AWS ElastiCache) shared across all application instances. Redis executes atomic counter increments (`INCR` and `EXPIRE`) in sub-millisecond time, ensuring a unified rate limiting boundary across the entire fleet.

---

### Question 15: What HTTP status code should a rate limiter return, and why is 403 the wrong choice?
A rate limiter must return **`HTTP 429 Too Many Requests`** (defined in RFC 6585), accompanied by a **`Retry-After: <seconds>`** response header informing the client exactly how long to wait before retrying.

**Why `403 Forbidden` is the Wrong Choice**:
1. **Semantics of Permanence vs. Transience**: `403 Forbidden` indicates an **authorization failure**. It tells the client: *"I understand who you are, but you lack permission to access this resource, and repeating the request will not change the outcome."* A rate limit lockout is not a permanent permission denial; it is a **temporary throughput throttle**.
2. **Client Automated Handling & SDK Retries**: Modern HTTP client libraries, API SDKs, and mobile apps are programmed to handle status codes automatically. When an SDK encounters `429`, it inspects `Retry-After` and applies automated exponential backoff and jitter. If the server returns `403`, the SDK assumes an unrecoverable credential failure, terminates the session, and logs the user out.
3. **Observability & Alerting**: Operations teams monitor `403` rates to detect permission privilege escalation attempts and `429` rates to detect traffic spikes or DDoS attacks. Conflating the two pollutes security monitoring dashboards.

---

### Question 16: What do you do when your rate limit store is unavailable: fail open or fail closed? Answer for your own application specifically.
When the rate limit store (e.g., Redis) becomes unreachable, the system must make an explicit architectural trade-off between **availability (fail open)** and **security (fail closed)**.

**Decision for DG Tech Store Specifically**:
For our retail part-payment application, we implement a **hybrid model based on route criticality**:
1. **Fail Open on Public Browsing & Catalog Routes**:
   - For `GET /api/devices`, device details, and price calculator routes, we **fail open**. If Redis crashes, retail customers at Banex Plaza must still be able to browse inventory and view prices. Dropping legitimate retail sales because a cache node failed is unacceptable to business revenue.
2. **Fail Closed on Authentication & Financial Mutations**:
   - For `POST /api/auth/register`, `POST /api/auth/login`, and payment execution endpoints, we **fail closed** (or fallback to an emergency local in-memory circuit breaker). If rate limiting on login fails open, an attacker can launch an unmitigated multi-million-request brute-force attack against our customer accounts while the monitoring is down. 
   - Protecting our customers' identity and financial part-payment contracts takes strict precedence over transient registration availability during an infrastructure outage.

---

## Assessment Work (Questions 17 to 19)

### Question 17: You have two timing numbers for hashing, from your own machine. Walk me through what they mean for an attacker who has stolen your user table.
On our development machine, benchmarking produced two empirical numbers:
- **Argon2id Average Time**: **`61.780 ms`** per hash ($16.19\text{ guesses/sec/core}$)
- **SHA-256 Average Time**: **`0.001323 ms`** per hash ($755,619.63\text{ guesses/sec/core}$)
- **Slowdown Factor**: **`46,683x`** slower on CPU

**What This Means for the Attacker**:
Suppose an adversary dumps our database containing 10,000 customer hashes. The attacker sets up an 8x NVIDIA RTX 4090 cracking rig running Hashcat to crack an 8-character lowercase alphanumeric password ($36^8 \approx 2.82\times 10^{12}$ combinations):
1. **If We Had Used SHA-256**: The GPU rig computes ~200 billion hashes per second. The attacker exhausts the entire 2.82 trillion password space in **14.1 seconds**. Within one afternoon, the attacker cracks over 90% of our customers' passwords and begins compromising their personal banking accounts.
2. **Because We Used Argon2id**: Argon2id forces the GPU to allocate 64 MB of high-speed RAM per hashing thread. The GPU's massive core count sits idle, choked by memory bus bottlenecks, limiting the rig to ~10,000 guesses per second. Exhausting the exact same 8-character keyspace now requires **$282,110,990\text{ seconds}$ &mdash; approximately 8.94 YEARS**.

The 61ms delay we spend on login costs our customer nothing, but forces the attacker into an 8.9-year computational brick wall.

---

### Question 18: How does a breached password check avoid sending the password anywhere? Explain the mechanism in your own words, then say what the naive version would leak.
Our breached password check (`lib/security/breach-checker.ts`) implements the **k-Anonymity range query protocol**:
1. **Local Digest & Truncation**: When a user registers with password `password123`, our server calculates its SHA-1 hash locally (`CBFD2A4C4721346D0F9A6E4A79E405E5276979A5`). It extracts strictly the first 5 characters: **`CBFD2`**.
2. **Blind Range Query**: The server sends only those 5 characters to the HaveIBeenPwned API: `GET /range/CBFD2`. Because $16^5 = 1,048,576$ buckets exist across billions of compromised passwords, thousands of completely unrelated passwords share the exact prefix `CBFD2`. The external service has zero knowledge of which password was typed.
3. **Local In-Memory Evaluation**: The external service returns a list of ~800 hash suffixes starting with `CBFD2`. Our server scans that list locally for our remaining 35 characters (`A4C472...`). Finding a match, our server rejects the registration.

**What the Naive Version Would Leak**:
The naive version transmits the plaintext password or the full hash over the network to the external API. This leaks the customer's cleartext credentials to a third party, creating an immediate interception vulnerability. Furthermore, sending the full hash is equivalent to sending the password because the external service maintains the precomputed reverse lookup table. k-Anonymity guarantees that the cleartext password and full hash never leave our machine.

---

### Question 19: Wrong-answer analysis of candidate statement:
> *"I hash passwords with SHA-256 plus a random salt per user, which means even if the database is stolen the passwords cannot be reversed, because hashing is one-way. I also rate limit login attempts by IP, so brute force is not possible."*

This candidate statement is confident, common, and dangerously flawed. Here is the analysis in order of severity:

1. **Severity 1 (Critical): Total Misunderstanding of the Offline Threat Model**:
   - The candidate states: *"I rate limit login attempts by IP, so brute force is not possible."*
   - This confuses an **online attack** with an **offline attack**. Rate limiting only protects the live public web server while it is running. Once the database is stolen (via SQLi, snapshot leak, or backup theft), the attacker is **not querying the live website**. The attacker runs Hashcat offline on their own isolated GPU cluster where our server's rate limiter does not exist. Claiming rate limiting prevents brute-force of a stolen database is an automatic disqualification in a security interview.
2. **Severity 2 (High): Fatal Algorithm Selection (SHA-256)**:
   - The candidate believes adding a salt makes SHA-256 safe. While a salt stops precomputed rainbow tables, it does **nothing** to slow down an attacker actively brute-forcing individual hashes on a GPU. Because SHA-256 takes ~1 microsecond, the attacker can still guess hundreds of billions of combinations per second per salt. Passwords must use adaptive, memory-hard algorithms like Argon2id or bcrypt.
3. **Severity 3 (Medium): Superficial Rate Limiting Assumption**:
   - Even in an online attack, rate limiting strictly by IP is trivially bypassed by rotating residential proxies or cellular IPs, as proven in Step 8.2.

---

## Technical Viva Preparation Notes

### Databases
- **Query jumps from 10ms to 30s**: Check execution plan (`EXPLAIN ANALYZE`). Look for index drops, sequential scans (`Seq Scan`), table bloat/vacuum neglect, lock contention from uncommitted transactions, or parameter sniffing causing bad cached execution plans.
- **Index for one column AND that column plus second**: Create a **composite index on `(col1, col2)`**. B-trees can search any prefix of the index, so `(col1, col2)` optimizes queries filtering on `col1` alone, as well as queries filtering on `col1 AND col2`.
- **Order of columns in composite index**: Column order matters because the index is sorted primarily by the first column, then by the second. An index on `(status, created_at)` cannot optimize a query filtering solely on `created_at` without scanning the entire index.
- **Why not index every column?**: Every index imposes a severe write penalty on `INSERT`, `UPDATE`, and `DELETE` operations (each write must update every B-tree). Indexes consume substantial RAM and disk space, starving the buffer pool.
- **The N+1 Problem**: Occurs when an application loads $N$ child records via $N$ individual queries inside a loop rather than one combined batch query (`JOIN` or `IN`). Solved using eager loading / Prisma `include`.
- **Zero-Downtime Large Migration**: Use the **Expand-and-Contract** pattern: (1) Add new column/table as nullable, (2) Dual-write in application code, (3) Backfill historical rows in background batches, (4) Switch reads to new structure, (5) Contract by dropping old structure.

### Queues & Asynchronous Processing
- **At-least-once vs. Exactly-once**: At-least-once guarantees message delivery but may duplicate messages on network timeout. Exactly-once requires distributed transactional coordination across producers, brokers, and consumers.
- **Idempotency in Queue Handlers**: Handlers must check if the job was already processed using a unique idempotency key (e.g., `paymentReference`) stored with a unique database constraint before executing side effects.
- **Queue Backing Up**: Add worker concurrency, scale horizontally, optimize consumer processing time, or shed low-priority load.
- **Dead-Letter Queue (DLQ)**: A secondary queue where messages that repeatedly fail processing (e.g., after 3 retries) are moved for isolation and inspection, preventing poison messages from blocking the main queue.
- **Synchronous Email Problem**: Sending email inside the HTTP request blocks the thread on external SMTP latency (500–2000ms) and couples signup success to third-party uptime. Redesign by writing an event/job to a queue and returning `HTTP 201` in $<50\text{ms}$.

### Migrations & ORMs
- **Forward-Only Migrations**: Moving database state only forward via discrete, versioned SQL transitions. Fix defects by deploying a new forward migration, never by rolling back live data.
- **Never Edit Applied Migrations**: Editing an applied migration breaks migration checksum tables (`_prisma_migrations`), halts CI/CD pipelines, and causes schema drift across developer environments.
- **Generating Client vs. Migrating**: Generating the client (`prisma generate`) rebuilds compile-time TypeScript types in `node_modules`. Migrating (`prisma migrate dev`) executes physical DDL against the database storage engine. Running generate without migrate produces runtime drift error `P2022`.
