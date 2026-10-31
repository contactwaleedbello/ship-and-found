---
name: build-api-endpoint
description: Implements one HTTP route handler with its service function and Zod schema, following api-contracts.md, api-design.md, data-and-schema.md, state-transitions.md, and permission-matrix.md.
---

# Build an API endpoint

## Context docs

Read these before step 1.

- `docs/architecture.md` for the request lifecycle order. Read once per feature. Do not re-read mid-feature unless the feature crosses a layer boundary.

## Steps

1. Open `.agents/rules/api-contracts.md`. Find the endpoint by method and path. If not listed, stop and log the gap in `.agents/rules/working-agreements.md`.
2. Open `.agents/rules/scope.md`. Confirm the endpoint's feature appears in Version 1 scope. If not, stop.
3. Open `.agents/rules/permission-matrix.md`. Note the exact role list for the endpoint's resource.
4. Open `.agents/rules/api-design.md`. Note the request shape, the response shape, the error envelope, the status code table, and the pagination rule.
5. Open `.agents/rules/code-conventions.md`. Read the module boundaries section and the forbidden patterns list.
6. If the endpoint is a write, open `.agents/rules/data-and-schema.md`. Find the matching event in the transaction boundaries table. Note every table that must be written inside one Prisma transaction.
7. If the endpoint is a write, open `.agents/rules/state-transitions.md`. Find the transition. Note the side effects and the atomicity requirement.
8. If the endpoint reads or writes NIN, phone number, full name, guarantor details, or any personal data, open `.agents/rules/ndpa-compliance.md`. Note the encryption, masking, and audit rules that apply.
9. Write the Zod schema. Place it per the module boundaries section of `.agents/rules/code-conventions.md`.
10. Write the service function in the location the module boundaries section of `.agents/rules/code-conventions.md` names. If write, wrap every table write from step 6 in one `prisma.$transaction`.
11. Write the audit log row inside the transaction per `.agents/rules/ndpa-compliance.md` and the log format in `.agents/rules/observability-baseline.md`.
12. Write the route handler in the file path `.agents/rules/api-contracts.md` names. Wire the middleware per the auth pattern section of `.agents/rules/api-design.md`.
13. Return the response in the shape and status code from `.agents/rules/api-design.md`.
14. Catch typed errors from the service. Map each to the error envelope in `.agents/rules/api-design.md`. Use the exact `message` string from `.agents/rules/ux-states.md`.
15. Confirm the `x-request-id` header is set on both success and error responses per `.agents/rules/observability-baseline.md` correlation ID section.
16. Write an integration test colocated with the route handler per `.agents/rules/code-conventions.md` testing placement section. Cover one success case and one failure case per validation rule.
17. Run the integration test. Confirm every case passes.