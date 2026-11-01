# Controlled Git Rollback Without Hallucination (`docs/rollback.md`)

**Workstream**: `task-03-client-validation/`  
**Domain**: DG Tech Store (Shop ATF 03)  
**Standard**: Step 9 (Deterministic Version Control Rollback)  

---

## 1. Commit History Prior to Rollback

```text
d53f6e8 (HEAD -> phase-1-spa-collapse) feat(defect): add unwanted hardcoded red banner to global styles
9f7599d (origin/task-2, origin/main, task-3, main) docs(evidence): update 15-git-log-graph.txt with pull request merge structure
f6f33f0 Merge pull request #1 from contactwaleedbello/task-2-delivery
879c8e8 (origin/task-2-delivery) docs: document pull request URL, branching lifecycle, and multi-day commit verification in README
b13822e (origin/phase-5-verification) chore(deliverables): align exact evidence deliverable filenames, formats, and human usability testing
```

---

## 2. Commit Identified and Exact Rollback Command

- **Commit ID Targeted for Rollback**: `d53f6e8`
- **Reason for Reversal**: The commit introduced an unapproved hardcoded red background (`#ff0000`) in `app/globals.css`, directly violating `.agents/rules/stack.md` and design system token constraints in `styles/tokens/roles.css`.
- **Exact Command Executed**:
  ```bash
  git revert --no-edit d53f6e8
  ```
- **Resulting Commit**: `8b28716` (`Revert "feat(defect): add unwanted hardcoded red banner to global styles"`).

---

## 3. Why Naming the Commit ID is Safer Than Describing the Change in Words

> Naming an exact SHA-1 commit hash anchors the rollback to an immutable cryptographic snapshot of the repository, guaranteeing that Git computes the exact mathematical inverse diff without ambiguity or loss of unrelated work. 
> 
> In contrast, describing a desired rollback in natural language invites an AI agent or human collaborator to guess the previous file state, routinely hallucinating missing lines, re-introducing previously resolved bugs, or accidentally destroying adjacent work that was never intended to be touched.

