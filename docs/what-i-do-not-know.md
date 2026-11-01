# Technical Boundaries: What I Do Not Know

**Author:** Waleed Bello (Lead Software Engineer)  
**Organization:** DG Tech Store (Shop ATF 03, Banex Plaza, Wuse 2, Abuja)  
**Document:** `docs/what-i-do-not-know.md`  
**Task:** Task 5 — Step 9: The Hiring Defence  
**Requirement:** Minimum 8 deeply technical, honest engineering boundaries.  

---

## Technical Self-Assessment

True senior engineering begins with an honest, precise understanding of where one's operational and theoretical knowledge ends. Below are nine deeply technical areas in modern systems, databases, cryptography, and compliance that I currently do not fully know, along with my understanding of what makes them difficult.

---

### 1. SQLite WAL Checkpointing & Lock Escalation Under Multi-Worker Contention
While I understand SQLite's Write-Ahead Logging (WAL) mode and how readers do not block writers, I do not deeply understand the exact lock escalation heuristics when multiple asynchronous Node.js worker threads concurrently attempt to commit write transactions during a high-volume flash sale. Specifically, how the operating system's `fcntl` file locking interacts with SQLite's internal busy-handler timeout on Linux vs macOS kernel implementations remains an area I have not empirically debugged under high load.

---

### 2. Distributed Consensus & Two-Phase Commit in Cross-Region Database Replication
I know how to run Prisma migrations against a single-node SQLite or PostgreSQL instance. However, if DG Tech Store expands across West Africa and requires an active-active multi-region database (e.g. CockroachDB or AWS Aurora Global Database), I do not know how to handle multi-master distributed consensus (Raft/Paxos) during split-brain network partitions while maintaining ACID guarantees on financial hire-purchase ledgers without unacceptable write latency.

---

### 3. Hardware-Level Memory Bus Side-Channel Attacks During Argon2id Execution
I know how to tune Argon2id parameters ($m=64\text{MB}$, $t=3$, $p=4$) to prevent GPU dictionary attacks. However, I do not know how to analyze or defend against CPU cache-timing side-channel attacks (such as Spectre, Meltdown, or Flush+Reload) where a co-located malicious tenant on a shared cloud virtual machine analyzes CPU L3 cache misses during Argon2id execution to recover password bits.

---

### 4. Edge Runtime V8 Isolate Subrequest Networking & TCP Connection Pooling
In Next.js middleware, code runs inside lightweight V8 isolates rather than a full Node.js runtime. While I implemented session revalidation via internal `fetch()` calls, I do not know the exact C++ socket pooling implementation inside the V8 isolate environment, nor how connection re-use works at the edge when thousands of simultaneous mobile requests hit the middleware layer.

---

### 5. Cross-Border Data Transfer Jurisdiction Under NDPA Section 41 vs GDPR Adequacy
Under Section 41 of the Nigeria Data Protection Act (NDPA) 2023, personal data cannot be transferred outside Nigeria unless the foreign country has an "adequate" data protection legal framework approved by the Nigeria Data Protection Commission (NDPC). I do not know the exact legal jurisprudence regarding hosting encrypted SQLite backups on AWS EU-West (Ireland) or Cloudflare R2: does client-side envelope encryption legally exempt data from being classified as a cross-border personal data transfer under Nigerian administrative law?

---

### 6. WebAuthn / FIDO2 Passkey Credential Attestation on Fragmented Android Hardware
I understand password-based Argon2id authentication and OTP flows. However, I do not yet know how to build a production-grade WebAuthn / FIDO2 passkey implementation that reliably validates hardware cryptographic attestation statements across the highly fragmented ecosystem of budget Android devices (e.g. Tecno, Infinix, and Itel phones running modified Android kernels) commonly used by shoppers in Banex Plaza.

---

### 7. Zero-Knowledge Cryptographic Proofs (ZKP) for Credit Scoring Verification
Currently, our database stores an integer `creditScore` and queries it directly. I do not know how to implement a Zero-Knowledge Succinct Non-Interactive Argument of Knowledge (zk-SNARK) that would allow a customer to mathematically prove to DG Tech Store that their credit score is above 700 without revealing their actual score, financial history, or BVN to our database.

---

### 8. Kernel-Level TCP Window Scaling & Packet Fragmentation Across Congested 3G Cellular Towers
I understand HTTP/2 multiplexing, headers, and cookie transport. However, I do not know how low-level TCP congestion control algorithms (such as BBR vs CUBIC) behave when handling TLS 1.3 handshakes over heavily congested 3G cellular base stations in commercial urban centers like Wuse 2, Abuja, where packet loss rates exceed 15% and TCP window resizing can trigger silent HTTP request stalls.

---

### 9. Proprietary In-App Webview Memory Heuristics & BFcache Invalidation
While I implemented standard `Cache-Control: no-store` headers to prevent browser back-button session caching, I do not know the undocumented, non-standard memory caching heuristics used by proprietary in-app webviews (such as WhatsApp, Instagram, or TikTok built-in browsers) on various operating system forks, which often ignore standard HTTP caching headers and retain DOM snapshots in unmanaged native memory.

