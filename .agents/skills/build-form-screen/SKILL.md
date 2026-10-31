---
name: build-form-screen
description: Implements one screen where a user enters and submits data, following screen-inventory.md, functional-requirements.md, business-rules.md, ux-states.md, and accessibility-baseline.md.
---

# Build a form screen

## Context docs

Read these before step 1.

- `docs/architecture.md` for the request lifecycle order. Read once per feature. Do not re-read mid-feature unless the feature crosses a layer boundary.
- `docs/design-system.md` for how to consume the Task 1 design system. Mandatory before any UI is written.

## Steps

1. Open `.agents/rules/screen-inventory.md`. Find the screen by name. Read role, purpose, primary action, and key elements.
2. If the screen's purpose is not form submission, stop. Use the build-list-screen skill instead.
3. Open `.agents/rules/functional-requirements.md`. List every FR that touches this screen.
4. Open `.agents/rules/business-rules.md`. Note every value the fields must enforce.
5. Open `.agents/rules/ux-states.md`. Find the form screen's block (B.3 or B.6 or the closest pattern). If the screen is not covered by any block, stop and log the missing states in `.agents/rules/working-agreements.md`.
6. Open `.agents/rules/accessibility-baseline.md`. Read the Forms section.
7. Open `.agents/rules/permission-matrix.md`. Confirm the current user's role allows submitting this form. If not, stop.
8. Open `.agents/rules/api-contracts.md`. Find the endpoint the form submits to. If none exists, stop and log the gap in `.agents/rules/working-agreements.md`.
9. Build the form fields from the Key Elements column in `.agents/rules/screen-inventory.md` only. Do not add fields.
10. Wire inline validation on blur for every field. Use the exact error string from `.agents/rules/ux-states.md` for each validation rule.
11. Apply every Forms rule from `.agents/rules/accessibility-baseline.md` to the inputs.
12. On submit, apply the form-submitting global state from `.agents/rules/ux-states.md`.
13. On 422 response, map `error.fields` from the response to inline errors. Use the returned `message` verbatim. Move focus to the first error field per the Forms section of `.agents/rules/accessibility-baseline.md`.
14. On 500 response, show the generic error string from `.agents/rules/ux-states.md`. Do not show a stack trace.
15. On success, follow the redirect or state change for this step in `.agents/rules/user-journeys.md`.
16. Confirm every visible string (labels, placeholders, errors) matches `.agents/rules/ux-states.md` or the Key Elements column in `.agents/rules/screen-inventory.md`. Do not invent a string.
17. Manual test: tab to every field. Submit with one validation error. Verify focus moves to the first error field. Verify the error string matches `.agents/rules/ux-states.md` verbatim.