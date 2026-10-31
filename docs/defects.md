# Defects Log & Remediation History (`docs/defects.md`)

**Workstream**: `task-03-client-validation/`  
**Domain**: DG Tech Store (Shop ATF 03)  

---

## Task 3 Defect Inventory

| Defect ID | Description | Severity | Impacted Component | Root Cause | Verified Remediation |
|---|---|---|---|---|---|
| **`DEF-T3-01`** | **Authentication Route Fragmentation** | High | `/login`, `/register`, `/forgot-password` | Separate physical pages caused full document unloads, input data loss, and mobile latency. | Consolidated into unified SPA route `/auth?mode=signup\|login\|reset` using conditional tabpanel rendering and `window.history.pushState` (Evidence 01–04). |
| **`DEF-T3-02`** | **Number Input Spinner & Leading Zero Bug** | Medium | `National Identity Number` (`nin`) | Using `<input type="number">` inserted default 0, spinner arrows, and produced `0400` corruption upon editing. | Migrated to `<input type="text" inputMode="numeric" pattern="[0-9]*">` with immediate `replace(/\D/g, '')` sanitization (Evidence 09, 10). |
| **`DEF-T3-03`** | **Sensitive Identifier Format Leakage** | High | Input Placeholders | Providing `"11-digit NIN"` placeholder clue informed attackers of exact string constraints, optimizing brute-force bots. | Removed syntactic masks and length cues; unified login errors to prevent account enumeration (`docs/enumeration.md`). |
| **`DEF-T3-04`** | **Disabled Submit Button Tab Order Loss** | High | Registration Submit Button | Using `<button disabled>` completely removed the element from the keyboard tab order, leaving screen readers with silent form termination. | Implemented `aria-disabled="true"` with explanatory click alert announcing missing requirements (Evidence 13, 14, `docs/accessibility-audit.md`). |
| **`DEF-T3-05`** | **Monochromatic Red Border Accessibility Failure** | High | Inline Validation Errors | Red borders alone failed to communicate error state to users with deuteranopia or protanopia color blindness. | Added caution icons (`AlertTriangle`) beside all error strings, paired with programmatic `aria-describedby` links. |
| **`DEF-T3-06`** | **Hostile Real-Time Validation on Login** | Medium | Login Identifier Field | Real-time typing validation on login triggered premature error alerts while users were halfway through typing their phone numbers. | Deferred login validation strictly to submit time, while preserving real-time guidance on registration (`docs/validation-rules.md`). |
| **`DEF-T3-07`** | **Direct API Request Validation Bypass** | Critical | `POST /api/auth/register` | Client-side validation provided zero security against raw HTTP curl requests, allowing single-character names to create accounts. | Formally documented in `docs/client-side-is-not-security.md` (Evidence 15, 16) and established server-side Zod schema roadmap for Task 4. |
