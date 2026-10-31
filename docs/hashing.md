# Cryptographic Password Hashing & Attacker Work Factor Inversion (`docs/hashing.md`)

**Workstream**: `task-04-server-security/`  
**Domain**: DG Tech Store (Shop ATF 03)  
**Standard**: Step 4 (Why Fast is Wrong for Password Storage)  

---

## 1. Machine-Specific Benchmarks

The following benchmarks were executed directly on our development hardware (`Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz`, 6 cores / 12 threads, Darwin x64):

| Metric | Argon2id (`v=19, m=64MB, t=3, p=4`) | SHA-256 (Cryptographic Digest) | Ratio (Slowdown Factor) |
| :--- | :---: | :---: | :---: |
| **Average Hash Latency** | **61.780 ms** | **0.001323 ms** ($1.323\ \mu\text{s}$) | **46,683x slower** |
| **Guesses / sec / CPU core** | **16.19 guesses/sec** | **755,619.63 guesses/sec** | **46,683x fewer** |
| **Guesses / sec (Full 12-thread CPU)** | **~194 guesses/sec** | **~9,067,435 guesses/sec** | **46,683x fewer** |

---

## 2. Attacker Work Factor Arithmetic

### Scenario:
An adversary compromises the database and obtains the user table with hashed passwords. The target is an 8-character password selected from lowercase alphanumeric characters ($36^8 = 2,821,109,907,456$ possible combinations).

### A. Attacker Guess Rate Against SHA-256:
- On our single test machine CPU:
  $$\frac{1,000\text{ ms}}{0.001323\text{ ms}} = 755,619\text{ guesses/sec/core}$$
- Across a dedicated GPU cluster (e.g., 8x NVIDIA GeForce RTX 4090 running Hashcat, where each card hashes SHA-256 at ~25 GH/s):
  $$\text{Cluster Guess Rate} = 8 \times 25\times 10^9 = 200,000,000,000\text{ guesses/second}$$
- **Time to exhaust entire 8-character keyspace**:
  $$\frac{2,821,109,907,456\text{ combinations}}{200,000,000,000\text{ guesses/sec}} \approx \mathbf{14.1\text{ seconds}}$$
- **Verdict**: A SHA-256 password hash offers zero defense against brute-force attacks.

### B. Attacker Guess Rate Against Argon2id:
- On our single test machine CPU:
  $$\frac{1,000\text{ ms}}{61.780\text{ ms}} = 16.19\text{ guesses/sec/core}$$
- On the same 8x RTX 4090 GPU cluster:
  Argon2id is deliberately **memory-hard**. Each hash instance consumes 64 MB of RAM ($m=65536$).
  An RTX 4090 possesses 24 GB of VRAM. It can fit at most:
  $$\frac{24,576\text{ MB}}{64\text{ MB}} = 384\text{ concurrent hashing threads per card}$$
  The massive parallel compute units of the GPU sit idle, starved of memory bandwidth.
  The cluster guess rate drops to **~10,000 guesses/second**.
- **Time to exhaust the same 8-character keyspace**:
  $$\frac{2,821,109,907,456\text{ combinations}}{10,000\text{ guesses/sec}} = 282,110,990\text{ seconds} \approx \mathbf{8.94\text{ YEARS}}$$
- **Verdict**: An attack requiring 14 seconds on SHA-256 requires nearly a decade on Argon2id.

---

## 3. The Attacker Work Factor Inversion

> **The Inversion**:
> In normal application operations, the server hashes **once per login**. A human customer logging into DG Tech Store experiences a 61-millisecond delay, which is completely imperceptible to a human and is dwarfed by network latency.
>
> However, an attacker attempting to recover passwords from a stolen database must hash **billions or trillions of times**.
>
> By selecting an algorithm that takes ~60 milliseconds rather than ~1 microsecond, the cost to the legitimate user is zero, but the computational cost to the attacker is magnified by tens of thousands of times on CPU and millions of times on GPU memory bandwidth. Slow is correct because slow shifts the economics entirely against the adversary.

---

## 4. Salt Mechanics & Collision Defense

### 1. What a Salt Does:
A salt is cryptographically random data prepended or appended to the password prior to hashing. It ensures that two users who choose the exact same password ("BanexCustomer#2026") produce completely different hash outputs.

### 2. Does Argon2id Handle It?:
Yes. Argon2id generates a cryptographically secure 16-byte random salt by default and serializes it into the standard string format:
`$argon2id$v=19$m=65536,p=4,t=3$<base64-salt>$<base64-hash>`

### 3. Proof of Non-Collision (Same Password Hashed Twice):
- **Invocation 1**: `$argon2id$v=19$m=65536,p=4,t=3$UcvCOsWxpF+IEfdA/Xu/bQ$s4fzglFlOxpu9LrrrFD5lok7YSKWkFehFf6U1mezm8M`
- **Invocation 2**: `$argon2id$v=19$m=65536,p=4,t=3$A0SssQzV7O+BN7J/+quLlg$Cz5GXKeqeG2po/UH/5PYUBq7wTIgSuqHMmJSfsbvARY`
Both hashes verify the same cleartext password, but share zero characters of ciphertext.

### 4. What an Attacker Does if Salting is Skipped:
If salting is omitted:
1. Every user with the same password has an identical database hash.
2. An attacker computes a single **rainbow table** (a precomputed dictionary of common hashes) once, and checks it in $O(1)$ time to compromise thousands of accounts simultaneously.
3. With unique salts, an attacker must recompute the entire keyspace individually for every single user.
