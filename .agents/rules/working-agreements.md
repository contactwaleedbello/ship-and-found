# working-agreements

Source: PRD Appendix E, Appendix G, plus universal collaboration pattern

## Single job

This file is the collaboration contract between the agent and the human team, the active open-question log, and the authoritative DG Tech Store product glossary. It does not define technical stack, code style, or business thresholds.

## Session opening checklist

At the start of every session, before writing any code, read these files in order so you do not write code that violates project scope or schema boundaries:

1. `AGENTS.md` for project paths, architecture map, and rule file index, because it routes every task to its governing rule file.
2. `working-agreements.md` (this file) for stop-and-ask triggers, PR discipline, and product terminology, because guessing on an unresolved requirement breaks the 1-week delivery plan.
3. The specific rule file(s) named by the task (for example, `state-transitions.md` and `business-rules.md` for a payment or approval flow), because each domain has strict invariants that are not repeated in `AGENTS.md`.
4. `prisma/schema.prisma` (once created on Day 1) and `data-and-schema.md`, because `prisma/schema.prisma` is the single source of truth for database table and column names.

Do not start a task without reading the rule file that governs it, because unguided implementation introduces out-of-scope features and schema drift. If a governing rule file is empty or missing, stop and ask immediately.

## Stop and ask criteria

Stop and ask when any of the six triggers below is true. Do not guess, because a wrong assumption in a financial or NDPA-regulated flow creates data corruption or legal exposure:

1. **The PRD or governing rule file is silent on the specific case.** Example: how to handle a request not listed in `api-contracts.md`. Do not invent an endpoint, because every route expands the attack and test surface.
2. **Two rule files disagree and no precedence rule resolves the conflict.** Do not pick one silently, because silent resolution hides specification bugs from the Product Lead. Report the exact file names and line numbers.
3. **A required field, table, or index is not in `data-and-schema.md`.** Do not add it to `prisma/schema.prisma`, because schema changes require a PRD update and additive-migration review.
4. **A rule file referenced by the current task is empty or missing.** Do not invent content for it, because rule files are contracts authored with the Product Lead.
5. **The task requires a package not listed in `stack.md` or an external service not in `third-party.md`.** Do not install or call it, because unapproved dependencies risk Vercel bundle bloat, security vulnerabilities, or NDPA data-transfer violations.
6. **The task asks for a behavior listed in `out-of-scope.md` or `version-2-data.md` as Version 2 only.** Do not build it, because the 1-week build has zero buffer for scope creep.

Do not stop and ask for any of the following, because these are already decided and stopping wastes delivery time:

- A threshold, duration, or formula already stated in `business-rules.md` or `success-metrics.md`. Read the file first.
- A code style, file name, import order, or folder placement choice. Follow `code-conventions.md`.
- An HTTP status code, request shape, or error envelope. Follow `api-design.md`.
- A test file location or naming pattern. Follow `code-conventions.md`.
- A package version. Follow `stack.md` and `package-lock.json`.
- A UI empty, loading, or error string for a covered screen. Follow `ux-states.md`.
- An SMS or WhatsApp message body. Follow `message-templates.md`.

If an implementation detail does not trigger any of the six stop-and-ask rules above and is not specified verbatim, proceed using the closest governing rule file and list the decision at the end of your response under `Decisions made`. Do not block when no trigger applies.

## Open question log mechanics

When you stop and ask, raise the question in your response using the exact format below so the Product Lead or Owner can answer it unambiguously. Once answered, write the resolution into the governing rule file (not only in chat history) and mark the item resolved in `build-plan.md` or below so future sessions do not re-ask it:

```text
[OPEN QUESTION]
Rule file: .agents/rules/<filename>.md
PRD section: <section number>
Blocking: <what feature or day cannot proceed>
Question: <single concrete question>
Options: <option A vs option B, with trade-off>
```

## Pull request, commit, and response discipline

- **One pull request per feature or per bug fix**, because small, isolated PRs allow fast review and clean single-feature rollback on Day 5 UAT if a flow fails (`build-plan.md`).
- **One commit per logical step inside a pull request** (for example: migration, service logic, API route, UI page, tests), because atomic commits let the team bisect regressions without untangling mixed changes.
- **No decorative UI elements** on any screen (no carousels, hero illustrations, decorative badges, or background animations), because PRD Section 3.1 mandates a minimal UX operating model optimized for low-end Android devices on 3G.
- **End-of-response decision log:** At the end of every response that writes or modifies code, list any implementation choice not directly specified by the PRD or a rule file. Omit facts that are already specified so the human reviewer only reads novel decisions.

## Protected files the agent must not modify without explicit instruction

- `Context files/DG Tech Store PRD.md` — because the PRD is the upstream human-owned contract.
- `.agents/rules/*.md` and `AGENTS.md` — do not alter rules to make failing code pass; only update a rule file when recording a human-approved Day 0 decision or when explicitly instructed by the user.
- `prisma/schema.prisma` — do not add, rename, or drop any model or column outside `data-and-schema.md`, because schema drift breaks Version 2 compatibility and referential integrity.
- `package.json` dependencies — do not add packages outside `stack.md`, because dependency changes require explicit approval.

## Product glossary (PRD Appendix E)

Use these exact terms in code comments, UI copy, audit logs, and PR descriptions so domain concepts never drift across layers:

- **Available stock:** `stock_count - reserved_count` on `Inventory` (`functional-requirements.md` FR-01). Represents units that can actually be reserved by a new application.
- **Locked price:** The `dynamic_price` of a device captured at the moment of valid application submission and stored in `PartPaymentApplication.locked_price` (`business-rules.md` BR-04). Subsequent exchange-rate changes do not alter a locked price.
- **Price freshness:** A device price is fresh when the `exchange_rate_multiplier` has not changed since `Price.last_updated_at` AND `NOW() - Price.last_updated_at <= freshness_window` (default 24 hours, stored in `Settings`). Otherwise the price is stale and checkout is blocked (`business-rules.md` BR-05).
- **Pending application expiry:** 24 hours from `PartPaymentApplication.created_at`. Stored in `expires_at`. When passed without Owner approval for verification, the expiry cron releases the price lock and stock reservation (`state-transitions.md`).
- **Settled:** Full remaining balance (`Agreement.remaining_amount == 0`) recorded as paid via verified balance or settlement transactions (`state-transitions.md`). Required before a `Defaulted` contract can be marked `Resolved`.
- **Administrative default flag:** Database status marking the contract (`Agreement.agreement_status = 'Defaulted'`) and recording `Agreement.device_serial` as defaulted, combined with a platform-only purchase block keyed on customer NIN and phone (`business-rules.md` BR-09, BR-15). Does not remotely lock or recover the physical device in Version 1.
- **Same-user rule:** The user who grants final approval (`Owner` or `Co-owner`) must not have the same `user_id` as the `Store Worker` (or Owner acting as Worker) who verified the down payment on that application (`business-rules.md` BR-13). Enforced inside the final-approval database transaction.
- **WAT:** West Africa Time (`UTC+1` year-round; Nigeria does not observe daylight saving time). All database timestamps are stored in UTC and converted to WAT for display and 19:59 WAT day-30 boundary calculations (`cron.md`).
- **IP collision:** The same IP address recorded on both `DownPaymentTransaction.verifier_ip` and the final-approval `AuditLog.ip_address` for a single application (`business-rules.md` BR-19). Triggers a non-dismissible Owner/Co-owner in-app dashboard alert.
- **Minimal UX MO:** One primary action per screen, inline validation on blur and submit, explicit empty/loading/error states on every screen, no decorative elements, progressive disclosure, mobile-first (`360px+`) for Customer flows, desktop-first (`1024px+`) for Worker and Owner flows, and battery life rendered with equal font size, font weight, and card prominence to price (`functional-requirements.md` FR-01).

## Active open questions log

The 78 pre-build open questions surfaced during rule authoring are cataloged in `AGENTS.md` (historical index) and mapped to Day 0 decisions in `build-plan.md` and each rule file's `Unresolved before build` section. Record any new open question discovered during Day 1–Day 5 implementation below using the `[OPEN QUESTION]` template above.
