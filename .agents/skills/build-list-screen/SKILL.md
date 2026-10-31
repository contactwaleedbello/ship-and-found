---
name: build-list-screen
description: Implements one screen that displays a collection with a primary action per item, following screen-inventory.md, api-contracts.md, api-design.md pagination, ux-states.md, and accessibility-baseline.md.
---

# Build a list screen

## Context docs

Read these before step 1.

- `docs/architecture.md` for the request lifecycle order. Read once per feature. Do not re-read mid-feature unless the feature crosses a layer boundary.
- `docs/design-system.md` for how to consume the Task 1 design system. Mandatory before any UI is written.

## Steps

1. Open `.agents/rules/screen-inventory.md`. Find the screen by name. Read role, purpose, primary action, and key elements.
2. If the screen's purpose is form submission, stop. Use the build-form-screen skill instead.
3. Open `.agents/rules/permission-matrix.md`. Confirm the current user's role allows reading this list. If not, stop.
4. Open `.agents/rules/api-contracts.md`. Find the list endpoint for this screen. If none exists, stop and log the gap in `.agents/rules/working-agreements.md`.
5. Open `.agents/rules/api-design.md`. Read the pagination section.
6. Open `.agents/rules/ux-states.md`. Find the list screen's block (B.1, B.4, B.5, B.7, or B.8 as applicable). If the screen is not covered by any block, stop and log the missing states in `.agents/rules/working-agreements.md`.
7. Open `.agents/rules/accessibility-baseline.md`. Read the Semantics and Announcements sections.
8. Build the page with exactly one `<h1>` per the Semantics section of `.agents/rules/accessibility-baseline.md`.
9. Render the loading state from `.agents/rules/ux-states.md` on route mount, before the first fetch returns.
10. Render the empty state from `.agents/rules/ux-states.md` when the first page returns zero items.
11. Render the error state from `.agents/rules/ux-states.md` when the fetch fails.
12. Render each item with the primary action from the Key Elements column in `.agents/rules/screen-inventory.md`. Do not add per-item actions not in that column.
13. Wire pagination per the pagination section of `.agents/rules/api-design.md`. Use `meta.nextCursor` from the previous response as the cursor on the next request. Preserve filters.
14. If the screen is `Reminder Checklist`, add the reminder mark-sent action from the Key Elements column in `.agents/rules/screen-inventory.md`. On click, log the send via the endpoint in `.agents/rules/api-contracts.md`. Render the message template from `.agents/rules/message-templates.md`. Do not invent a template.
15. If the screen is `Worker Dashboard` or `Owner Dashboard`, show only the queues named in the Key Elements column of `.agents/rules/screen-inventory.md` and only the health indicators named in `.agents/rules/monitoring.md`.
16. Apply the Announcements section of `.agents/rules/accessibility-baseline.md` to loading, empty, and error regions.
17. Tab to every item. Confirm every primary action is reachable by keyboard per the Keyboard section of `.agents/rules/accessibility-baseline.md`.
18. Manual test: force empty response, verify the empty string matches `.agents/rules/ux-states.md`. Force error, verify the error string matches. Keyboard walk every item.