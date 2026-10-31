# Task 3: The Form, Attacked from Both Sides (`task-03-client-validation`)

**Domain**: DG Tech Store (Shop ATF 03) &mdash; Device Inventory & Flexi-Pay Part-Payment Platform  
**Location**: Shop ATF 03, Banex Plaza, Wuse 2, Abuja, Nigeria  
**Workstream**: `task-03-client-validation`  
**Repository Branch**: `task-3`  

---

## 1. Executive Summary & Core Objective

Task 3 explores the boundaries of frontend engineering, single-page architecture (SPA), accessible forms, and defensive security. It demonstrates that **client-side validation is an ergonomic convenience for cooperative human users rather than a security control**.

### Key Deliverables Implemented:
1. **Collapsed Authentication Suite (SPA)**: Consolidated 3 legacy separate routes (`/login`, `/register`, `/forgot-password`) into a single-page architecture (`/auth?mode=signup|login|reset`), reducing active pages from 29 to 27 with 0ms transition latency and zero full-page reloads.
2. **Information Design & Data Minimization**: Field-by-field justification under NDPA 2023, pruning non-functional decorations and non-essential inputs.
3. **Four Validation Categories with Stated User Costs**: Derived rules specific to Nigerian telecommunications, NIMC 11-digit NINs, and hire-purchase contract identification, documenting the exact legitimate users each rule wrongly blocks.
4. **Ergonomic & Sensitive Data Hardening**: Replaced problematic `<input type="number">` controls (eliminating the `0400` leading zero defect) with numeric text inputs, and concealed sensitive format shapes to prevent user enumeration.
5. **Accessibility Audit (WCAG AA/AAA)**: Integrated caution icons (`AlertTriangle`) beside every error message for full color-blindness independence, resolved disabled button tab-order pitfalls, and recorded verbatim VoiceOver screen-reader transcripts before and after remediation.
6. **Direct API Attack & Endpoint Bypass**: Attacked the form directly via terminal `curl` requests, proving that client JavaScript is completely bypassed and demonstrating why server-side schema enforcement is mandatory.
7. **Deterministic Git Rollback**: Executed commit-ID-targeted rollbacks without AI guesswork.

---

## 2. Directory Structure & Deliverable Matrix

```text
task-03-client-validation/
├── README.md                                  # Workstream overview & verification instructions
├── docs/
│   ├── spa-rationale.md                      # SPA switching rationale, before/after UX & MPA trade-off
│   ├── field-justification.md                # 3-question test for every field & pruned inputs
│   ├── validation-rules.md                   # 4 categories, stated costs, email existence analysis
│   ├── terms-note.md                         # FCCPC & NDPA legal template origin and provenance
│   ├── enumeration.md                        # Concealing sensitive data shapes & account enumeration
│   ├── accessibility-audit.md                # 5 criteria audit & verbatim VoiceOver audio transcripts
│   ├── client-side-is-not-security.md        # Direct curl attack write-up & Task 4 roadmap
│   ├── rollback.md                           # Commit ID targeting vs. natural language guesswork
│   ├── defects.md                            # 7 identified defects, root causes & remediations
│   └── interview-answers.md                  # 15 comprehensive viva defense answers (~200 words each)
└── evidence/
    ├── 01-page-count-before.txt              # Initial 29-page application inventory
    ├── 02-page-count-after.txt               # Post-collapse 27-page inventory
    ├── 03-url-states.png                     # Visual capture of address bar across all 3 query states
    ├── 04-form-switch-logs.txt               # Server log proving 0 reloads and 0 session churn
    ├── 05-empty-field-error.png              # Category 1 on-blur validation with caution icon
    ├── 06-length-rule-blocking.png           # Category 2 length rule blocking single-token names
    ├── 07-email-realtime-signup.png          # Category 3 real-time email format guidance
    ├── 08-email-on-submit-login.png          # Category 3 submit-time login format enforcement
    ├── 09-number-input-annoying.png          # Number input leading zero defect sequence
    ├── 10-text-input-working.png             # Text input restricted to digits working properly
    ├── 13-button-hidden-version.png          # Rejected hidden submit button implementation
    ├── 14-button-disabled-version.png        # Approved disabled button with explanatory alert
    ├── 15-form-attack-results.txt            # In-browser form fuzzing results
    ├── 16-direct-request-command-and-response.txt # Raw curl command and HTTP 201 Created server response
    └── 17-commit-list-and-rollback.txt       # Commit history and git revert execution log
```

---

## 3. Quickstart & Verification Instructions

### 1. Verify Working Directory & Dependencies
```bash
cd "task-03-client-validation"
npm run typecheck
npm run lint
```

### 2. Start Dev Server
```bash
npm run dev
```

### 3. Verify Single-Page Authentication
Navigate to:
- **Registration (Default)**: `http://localhost:3000/auth?mode=signup`
- **Sign In**: `http://localhost:3000/auth?mode=login`
- **Password Reset**: `http://localhost:3000/auth?mode=reset`

Switch between tabs to verify instant client-side rendering with zero page reloads.

### 4. Reproduce Endpoint Bypass
```bash
curl -i -X POST http://127.0.0.1:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"a","phoneNumber":"+2348039988771","email":"attacker@domain.com","password":"password123","termsAccepted":true}'
```
Observe `HTTP/1.1 201 Created` demonstrating the core lesson of Task 3.
