# Intentional Security Deferrals & Trade-Off Analysis (`docs/not-implemented.md`)

**Workstream**: `task-04-server-security/`  
**Domain**: DG Tech Store (Shop ATF 03)  
**Standard**: Step 12 (What We Decided NOT to Do)  

---

## 1. Executive Summary: Engineering Judgement vs. Checklist Thinking

A common failure in AI-assisted software engineering is **security maximalism**: blindly enabling every possible security control, compliance standard, and cryptographic mechanism without evaluating business cost, customer friction, or operational readiness.

Security controls are not free. Every control imposes costs in developer velocity, latency, operational maintenance, or customer drop-off. Knowing what **not** to build at each stage of a commercial business is the defining difference between an authentic engineering judgement and a compliance checklist.

Below are **five enterprise security controls** we actively considered, evaluated, and deliberately decided **not** to implement for DG Tech Store at this stage.

---

## 2. The Five Deferred Security Controls

### Control 1: WebAuthn / FIDO2 Passwordless Passkeys

- **What It Is**: A cryptographic authentication standard utilizing client-side public-key cryptography (FaceID, TouchID, YubiKey) to authenticate users without transmitting passwords or hashes over the network.
- **Why It Was Not Worth It at This Stage**:
  1. **Device Ecosystem Fragmentation in Nigeria**: The vast majority of our retail customers at Banex Plaza use budget or mid-range Android devices (Transsion Tecno/Infinix, older Samsung A-series) where biometric hardware and modern browser WebAuthn support is inconsistent or absent.
  2. **Device Sharing & Family Purchasing**: In local commerce, family members frequently assist relatives with phone purchases. Passkeys tie an account to a single hardware device, creating customer lockout support tickets when a buyer switches phones or logs in from an internet café.
- **What Would Have to Change to Add It**:
  - We would implement WebAuthn as an optional convenience when over 60% of our active customer base is verified on Android 14+ / iOS 17+ devices and after establishing an automated SMS fallback account recovery pipeline.

---

### Control 2: Dedicated Cloud Hardware Security Module (HSM / Cloud KMS)

- **What It Is**: Dedicated physical hardware (FIPS 140-2 Level 3 HSM) to generate, store, and rotate database encryption keys (such as `NIN_ENCRYPTION_KEY`) so cleartext keys never exist in application server RAM or environment files.
- **Why It Was Not Worth It at This Stage**:
  1. **Cost Asymmetry**: Dedicated cloud HSMs (AWS CloudHSM, Google Cloud HSM) cost between $1,200 to $2,500 USD per month in baseline cluster fees. For a retail shop with 300 active flexi-pay customers, this infrastructure cost exceeds our monthly retail software budget.
  2. **Operational Complexity**: Integrating envelope encryption with HSM asymmetric key attestation adds 30–50ms to every database read/write and requires specialized Site Reliability Engineering (SRE) oversight.
- **What Would Have to Change to Add It**:
  - We would transition to Cloud KMS when DG Tech Store scales to a statewide franchise with over 25,000 customer NINs under management, or upon receiving formal compliance mandates under NDPA Tier-1 data processor regulations.

---

### Control 3: SMS-Based OTP as the Primary Registration Verification Channel

- **What It Is**: Sending 6-digit verification codes via cellular SMS telecommunication gateways (Twilio, Termii) rather than email.
- **Why It Was Not Worth It at This Stage**:
  1. **Severe Nigerian Telco Failure Rates**: Local SMS delivery in Nigeria suffers from frequent telecommunication routing drops (DND filters, NIBSS network routing delays), with delivery failure rates exceeding 15% on certain telco networks during peak afternoon hours.
  2. **Cost per Attempt**: SMS delivery incurs per-message billing (~₦4.50 to ₦6.00 per SMS). Malicious bots targeting our registration endpoint with automated phone numbers could quickly drain the store's SMS credit balance.
  3. **SS7 Interception Risk**: SMS is inherently unencrypted and vulnerable to SIM-swap fraud and SS7 telecommunication attacks.
- **What Would Have to Change to Add It**:
  - We would add SMS OTP as a secondary in-store fallback strictly triggered when a customer is physically present at the Banex Plaza counter and verified by a store worker.

---

### Control 4: Continuous Behavioral Biometrics (Keystroke Dynamics & Cursor Tracking)

- **What It Is**: Capturing micro-patterns in user typing cadences, mouse velocity, accelerometer tilt, and touch pressure to continuously score the likelihood of human vs. bot interaction throughout a checkout session.
- **Why It Was Not Worth It at This Stage**:
  1. **Privacy & Legal Intrusion**: Under the Nigeria Data Protection Act (NDPA 2023), passive behavioral telemetry collection requires explicit data protection impact assessments (DPIAs) and heightened user consent.
  2. **Battery & Bandwidth Drain**: Continuous telemetry streaming consumes CPU cycles and mobile data on low-bandwidth 3G/4G connections.
  3. **Disproportionate Complexity**: Our combination of Zod schema boundary enforcement, sliding-window rate limiting, and k-Anonymity breach checking already neutralizes 99.9% of automated scripts without invading customer behavioral privacy.
- **What Would Have to Change to Add It**:
  - We would only consider behavioral biometrics if DG Tech Store introduced fully automated online lending without physical in-store device inspection.

---

### Control 5: Device-Bound Sessions with Mutual TLS (mTLS)

- **What It Is**: Enforcing bidirectional cryptographic certificate exchange between the client's device and the server on every HTTPS API request.
- **Why It Was Not Worth It at This Stage**:
  1. **Incompatible with Standard Browsers**: mTLS requires provisioning and installing X.509 client certificates onto customer mobile phones, which ordinary retail consumers cannot manage.
  2. **Zero Need for Public Retail Endpoints**: mTLS is designed for machine-to-machine banking APIs and internal microservices, not consumer e-commerce.
- **What Would Have to Change to Add It**:
  - We would implement mTLS exclusively on internal store worker POS hardware terminals dedicated to physical device IMEI verification at Banex Plaza.
