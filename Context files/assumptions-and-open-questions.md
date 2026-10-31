# assumptions-and-open-questions

Source: `AGENTS.md`, `build-plan.md`, `.agents/rules/working-agreements.md`, and each rule file's `## Unresolved before build` section.

## Redundancy notice

This file is a pointer. It does not track open questions. Adding a question here creates a second source of truth that will drift from the file that governs the answer.

Do not add a new open question to this file.

## Where open questions live

Every unresolved item has exactly one home. Read the file below that owns the item. Do not restate the item in this file.

| Category | File that owns it |
|---|---|
| All 78 open questions collected across the rule set | `AGENTS.md` under `## Open questions` |
| The 21 Day 0 decisions with owners and fallbacks | `build-plan.md` under `## Day 0 decisions` |
| Stop-and-ask criteria, question format, resolution format | `.agents/rules/working-agreements.md` |
| Rule file change process and migration gaps | `.agents/rules/data-and-schema.md` under `## Unresolved before build` |
| NDPA gaps: retention length, pseudonymous ID custody, IP retention, NIN view, consent revocation, default deletion legal review | `.agents/rules/ndpa-compliance.md` under `## Unresolved before build` |
| NFR gaps: rate limits, uptime window, RPO, backup retention, WCAG scope, incident SLA | `.agents/rules/non-functional.md` under `## Unresolved before build` |
| Endpoint gaps: missing endpoints, cron method, heartbeat fields | `.agents/rules/api-contracts.md` under `## Gaps with no endpoint in PRD 8.3` |
| Skill definitions and skill triggers | `AGENTS.md` under `## Skills and when to use them` |
| Placeholder values not in the PRD, `[Store Contact]`, shop WhatsApp number | `.agents/rules/message-templates.md` under `## Unresolved before build` |
| Screening states missing from Appendix B | `.agents/rules/ux-states.md` under `## Unresolved before build` |
| Operational edge cases with no status change mechanism | `.agents/rules/edge-cases.md` under `## Unresolved before build` |
| Screen-level conflicts between PRD sections | `.agents/rules/screen-inventory.md` under `## Known conflicts` |
| Architecture-level ownership and layering | `docs/architecture.md` |

## How the agent uses this file

1. When the agent is about to make a decision not specified by a rule file, it opens this file to find which rule file owns that category.
2. The agent opens that rule file's `## Unresolved before build` section, or `AGENTS.md` open questions, or `build-plan.md` Day 0 decisions, as directed by the table above.
3. If the item is unresolved and the current task depends on it, the agent stops and asks using the format in `.agents/rules/working-agreements.md`.
4. If the item is resolved in the owning file, the agent uses the resolution. It does not add the resolution to this file.

## Adding a new open question

When the agent finds a genuinely new open question during build:

1. Identify the rule file that governs the topic.
2. Add the question to that rule file's `## Unresolved before build` section, using the format the section already uses.
3. Add the question to `AGENTS.md` under `## Open questions` so it is tracked at the top level.
4. Do not add it to this file.

If the question belongs to a category not in the table above, propose the category in the pull request description. Do not create a new category in this file without approval.

## What this file must never do

- Must never list a specific open question with its details.
- Must never list a resolution.
- Must never become the source of truth for anything.
- Must never be edited to reflect a change in status of an open question.

## How to use this file

Read this file once at session start, after `AGENTS.md` and `.agents/rules/working-agreements.md`. Use the table to navigate to the file that owns the question you need to resolve. Do not use this file as the tracker.

## Unresolved before build

None. This file is a pointer. If this section ever has content, the file has drifted from its purpose. Move the content to the owning rule file.