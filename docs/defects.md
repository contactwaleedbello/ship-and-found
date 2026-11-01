# Task 5 Engineering Defect Log & Resolutions

**Application:** DG Tech Store (Shop ATF 03, Banex Plaza, Wuse 2, Abuja)  
**Document:** `docs/defects.md`  
**Task:** Task 5 — Sessions, Deletion, and the Defence  

---

## Defect Summary

| Defect ID | Severity | Category | Component | Status | Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-501** | CRITICAL | Security | `POST /api/auth/logout` | **RESOLVED** | Implemented true server-side DB session deletion using `destroySession(rawToken)`. |
| **DEF-502** | HIGH | RBAC Boundary | `middleware.ts` | **RESOLVED** | Returned `HTTP 403 Forbidden` for non-admin users attempting to access `/admin/*`. |
| **DEF-503** | CRITICAL | Compliance / DB | Account Deletion | **RESOLVED** | Replaced raw SQL deletion with **Irreversible Anonymization** under FIRS CITA s.55. |
| **DEF-504** | MEDIUM | Reliability | `scheduled-deletion-job.ts` | **RESOLVED** | Made query filter idempotent (`accountStatus == 'DELETION_PENDING'`), yielding 0 mutations on re-run. |
| **DEF-505** | HIGH | Privacy | Protected Routes | **RESOLVED** | Added `Cache-Control: no-store, no-cache, must-revalidate, private` to prevent bfcache replay. |

---

## Detailed Post-Mortems

### DEF-501: Client-Only Cookie Deletion Left Active Session in Database
- **Root Cause:** The inherited Task 4 logout endpoint simply called `response.cookies.delete('dg_session')`. While the browser stopped sending the cookie, the session token record remained completely active and valid inside SQLite `Session` table. An attacker who had intercepted the token could continue using it to make authenticated API requests for up to 7 days.
- **Fix:** Updated `app/api/auth/logout/route.ts` to read the cookie value, compute its SHA-256 hash, and execute `await prisma.session.delete({ where: { sessionToken } })` before sending cleared cookie headers.
- **Verification:** Captured before-and-after database terminal states in `evidence/07-session-row-present.png` and `evidence/08-session-row-deleted.png`. Automated in `tests/task5-verification.test.ts`.

---

### DEF-502: Middleware Redirecting Unauthorized Customers Instead of 403 Forbidden
- **Root Cause:** When an ordinary customer navigated to `/admin/inventory-approvals`, early middleware code called `NextResponse.redirect('/login')`. This confused authentication with authorization, masking the RBAC boundary and suggesting to the customer that their session had expired.
- **Fix:** Refactored `middleware.ts` to inspect `user.role`. If the user is authenticated but `user.role !== 'ADMIN'`, the middleware halts execution and returns a dedicated, styled `HTTP 403 Forbidden` response.
- **Verification:** Captured failed customer access in `evidence/16-admin-route-refused.png`. Verified by unit test assertion `expect(customerAccess.status).toBe(403)`.

---

### DEF-503: Foreign Key Crash on Hard Deletion of Users with Financial Records
- **Root Cause:** Attempting to execute `DELETE FROM User WHERE id = ?` on a user with hire-purchase transaction records caused Prisma to throw `P2003: Foreign key constraint failed on the field: userId (onDelete: Restrict)`.
- **Fix:** Updated `scripts/scheduled-deletion-job.ts` to check `user.payments.length`. If financial records exist, the user's personal PII is overwritten with synthetic anonymized values (`REDACTED_ANONYMIZED_CUSTOMER`), severing the link to the living individual while keeping foreign keys and accounting ledgers intact per FIRS CITA Section 55.
- **Verification:** Captured in `evidence/13-scheduled-job-run-one.txt`.

---

### DEF-504: Scheduled Deletion Job Failed Idempotency on Second Run
- **Root Cause:** Early prototypes of the scheduled retention job updated all records unconditionally, causing the second execution to throw exceptions or log misleading mutation counts.
- **Fix:** Constrained the selection filter strictly to accounts with `accountStatus === 'DELETION_PENDING'` and `deletionRequestedAt <= (now - 7 days)`. Once processed, the user's status transitions to `ANONYMIZED_PRESERVED_FOR_AUDIT`.
- **Verification:** Consecutive runs documented in `evidence/13-scheduled-job-run-one.txt` (1 examined, 1 anonymised) and `evidence/14-scheduled-job-run-two.txt` (0 examined, 0 anonymised, 0 errors in 1ms).

---

### DEF-505: Back-Button History Exposed Account State After Logout
- **Root Cause:** After logging out, tapping the browser back button served cached HTML from the browser's Back-Forward Cache (bfcache), revealing customer credit scores and past orders.
- **Fix:** Configured HTTP response headers across all authenticated routes and logout responses:  
  `Cache-Control: no-store, no-cache, must-revalidate, private`  
  `Pragma: no-cache`
- **Verification:** Documented in `evidence/09-logout-network-failure.txt` and `evidence/10-logout-edge-case-fixed.txt`.
