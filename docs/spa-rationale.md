# Single Page Architecture (SPA) Rationale & Trade-off Analysis (`docs/spa-rationale.md`)

**Workstream**: `task-03-client-validation/`  
**Domain**: DG Tech Store (Shop ATF 03) Authentication Suite  
**Author**: Engineering Team  

---

## 1. Why Instant Form Switching Matters

In an e-commerce and retail financing platform such as DG Tech Store, authentication is a high-friction hurdle where significant customer drop-off occurs. Instant form switching via a Single Page Architecture (`/auth?mode=signup|login|reset`) provides critical user experience advantages:

1. **Zero-Latency State Transitions (0ms vs. 500ms+)**:
   - Customers frequently misidentify their account status: a returning customer may inadvertently click "Get Started" and begin filling out the registration form before realizing they already possess a Flexi-Pay account.
   - In a traditional multi-page architecture (MPA), clicking "Sign In" triggers a full document teardown, an HTTP GET network round-trip, asset re-evaluation, and layout recalculation. Over mobile cellular connections in Nigerian markets (e.g., 3G/4G networks in Banex Plaza, Abuja), this introduces a 400ms–1,200ms delay and jarring screen flashes.
   - In our SPA implementation, switching between Registration, Login, and Password Reset occurs instantaneously via client-side conditional rendering. The URL query parameter is synchronized with `window.history.pushState`, preserving deep-linking without incurring network overhead.

2. **Preservation of User Input Context**:
   - When a user enters their Nigerian mobile phone number (`+234803...`) on the registration tab, discovers an account already exists, and toggles to "Sign In", the SPA retains the entered phone number in memory. The user is spared the frustration of re-typing their credentials from scratch.

3. **Session and Socket Stability**:
   - Switching modes within the same mounted component prevents tearing down active background connections, WebSocket listeners, or telemetry sessions.

---

## 2. What the User Experience Was Before

In the Phase 2 baseline (Task 2), authentication was fragmented across three isolated routes:
- `/register` (Screen #4: Customer Registration)
- `/login` (Screen #3: Customer & Staff Login)
- `/forgot-password` (Screen #6: Password Reset Request)

### The Pre-Collapse Failure Modes:
- **Destructive Navigation**: Clicking the "Already have an account? Sign in" hyperlink executed a full browser navigation (`window.location`). Any partially filled fields (full name, email, NIN) were completely erased from memory.
- **Visual Stutter & Layout Shift**: Each navigation caused the browser to re-parse the layout tree, triggering perceptible flashes between light canvas backgrounds and form containers.
- **Server Load Amplification**: Every switch generated unnecessary HTTP GET requests to the Next.js server runtime, wasting mobile bandwidth on repeated transfers of identical layout shells and token stylesheets.

---

## 3. Where Separate Pages Would Be the Better Choice (Trade-off Analysis)

Single Page Architecture is an engineering trade-off, not an absolute best practice. There are specific architectural and operational contexts where separate, multi-page routes are demonstrably superior:

### The Scenario: Enterprise Federated Single Sign-On (SSO) & Isolated Security Boundaries
When an organization integrates external third-party identity providers (e.g., SAML 2.0, Microsoft Azure AD, Google Workspace, or banking-grade OpenID Connect protocols with hardware MFA keys):

1. **Distinct Content Security Policies (CSP)**:
   - A corporate login portal may require an extremely restrictive CSP (e.g., disallowing all `unsafe-inline` scripts and strictly whitelisting external IdP redirection endpoints), whereas a public customer registration flow might incorporate third-party analytics, reCAPTCHA, or customer support chat widgets (requiring broader script origins).
   - In a single-page architecture, all three forms share the identical CSP envelope. To accommodate the third-party widgets on registration, the security posture of the login form must be diluted. Separate physical pages allow strict, isolated per-route HTTP headers.

2. **Auditability & Zero-JavaScript Resilience**:
   - In highly regulated compliance environments (such as central bank core banking interfaces or NDPA audit perimeters), external compliance monitors mandate server-level HTTP access logs for every distinct phase of authentication. Client-side URL rewrites (`pushState`) do not emit server-side network hits.
   - Furthermore, separate HTML documents can be submitted via standard form actions (`POST /api/auth/login`) even when a user's mobile browser disables JavaScript, network proxies strip modern script tags, or low-memory devices crash under heavy client-side bundles.

**Conclusion**: For DG Tech Store's consumer retail workflow at Banex Plaza, instant query-parameter switching delivers optimal conversion and zero input loss; however, separate routes remain the superior architectural decision whenever security isolation, independent CSP headers, or non-JS fallbacks take precedence over transition speed.
