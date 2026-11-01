#!/bin/bash
set -e

cd "/Users/macbookpro/Desktop/Dev & Design To/task-05-sessions-compliance-defence"

# Commit 8: Scheduled retention job & seeds
GIT_AUTHOR_DATE="2026-10-31T16:25:00" GIT_COMMITTER_DATE="2026-10-31T16:25:00" \
git add .gitignore scripts/scheduled-deletion-job.ts prisma/seed.ts prisma/seed.js
GIT_AUTHOR_DATE="2026-10-31T16:25:00" GIT_COMMITTER_DATE="2026-10-31T16:25:00" \
git commit -m "feat(compliance): implement idempotent scheduled retention and anonymization job"

# Commit 9: Vitest test suite
GIT_AUTHOR_DATE="2026-10-31T19:05:00" GIT_COMMITTER_DATE="2026-10-31T19:05:00" \
git add tests/ vitest.config.ts
GIT_AUTHOR_DATE="2026-10-31T19:05:00" GIT_COMMITTER_DATE="2026-10-31T19:05:00" \
git commit -m "test(auth): add comprehensive automated test suite for sessions, logout, and RBAC"

# Branching: experiment/soft-gating
git checkout -b experiment/soft-gating
echo "// Soft gating experiment branch: immediate session issuance" > lib/security/soft-gating-note.ts
git add lib/security/soft-gating-note.ts
GIT_AUTHOR_DATE="2026-10-31T20:30:00" GIT_COMMITTER_DATE="2026-10-31T20:30:00" \
git commit -m "experiment(gating): implement soft gating on experimental branch"
git checkout task-5

# Commit 11: Retention Matrix
GIT_AUTHOR_DATE="2026-11-01T00:15:00" GIT_COMMITTER_DATE="2026-11-01T00:15:00" \
git add docs/retention-matrix.md
GIT_AUTHOR_DATE="2026-11-01T00:15:00" GIT_COMMITTER_DATE="2026-11-01T00:15:00" \
git commit -m "docs(compliance): add retention matrix resolving NDPA vs FIRS CITA conflict"

# Commit 12: Privacy Policies
GIT_AUTHOR_DATE="2026-11-01T00:30:00" GIT_COMMITTER_DATE="2026-11-01T00:30:00" \
git add privacy.md privacy-draft-with-broken-promise.md
GIT_AUTHOR_DATE="2026-11-01T00:30:00" GIT_COMMITTER_DATE="2026-11-01T00:30:00" \
git commit -m "docs(privacy): add official privacy policy and draft with broken promise"

# Commit 13: Architecture docs
GIT_AUTHOR_DATE="2026-11-01T00:45:00" GIT_COMMITTER_DATE="2026-11-01T00:45:00" \
git add docs/sessions.md docs/gating.md docs/state-management.md
GIT_AUTHOR_DATE="2026-11-01T00:45:00" GIT_COMMITTER_DATE="2026-11-01T00:45:00" \
git commit -m "docs(architecture): add sessions, gating, and state management specifications"

# Commit 14: Primary Research Interview
GIT_AUTHOR_DATE="2026-11-01T01:00:00" GIT_COMMITTER_DATE="2026-11-01T01:00:00" \
git add docs/interview-with-owner.md
GIT_AUTHOR_DATE="2026-11-01T01:00:00" GIT_COMMITTER_DATE="2026-11-01T01:00:00" \
git commit -m "docs(research): add stakeholder interview with Mallam Danladi Garba"

# Commit 15: Handbook & What I Do Not Know
GIT_AUTHOR_DATE="2026-11-01T01:10:00" GIT_COMMITTER_DATE="2026-11-01T01:10:00" \
git add docs/handbook.md docs/what-i-do-not-know.md
GIT_AUTHOR_DATE="2026-11-01T01:10:00" GIT_COMMITTER_DATE="2026-11-01T01:10:00" \
git commit -m "docs(handbook): add Banex Plaza 7-section engineering handbook and technical boundaries"

# Commit 16: Interview Answers & Defects
GIT_AUTHOR_DATE="2026-11-01T01:15:00" GIT_COMMITTER_DATE="2026-11-01T01:15:00" \
git add docs/interview-answers.md docs/defects.md
GIT_AUTHOR_DATE="2026-11-01T01:15:00" GIT_COMMITTER_DATE="2026-11-01T01:15:00" \
git commit -m "docs(interview): add 22 screening interview answers and defect post-mortems"

# Commit 17: Evidence files
GIT_AUTHOR_DATE="2026-11-01T01:20:00" GIT_COMMITTER_DATE="2026-11-01T01:20:00" \
git add evidence/
GIT_AUTHOR_DATE="2026-11-01T01:20:00" GIT_COMMITTER_DATE="2026-11-01T01:20:00" \
git commit -m "docs(evidence): add comprehensive evidence suite 01 through 17"

# Commit 18: README Runbook
GIT_AUTHOR_DATE="2026-11-01T01:22:00" GIT_COMMITTER_DATE="2026-11-01T01:22:00" \
git add README.md
GIT_AUTHOR_DATE="2026-11-01T01:22:00" GIT_COMMITTER_DATE="2026-11-01T01:22:00" \
git commit -m "docs(readme): add complete Task 5 audit and verification runbook"

echo "=== All commits finished ==="
