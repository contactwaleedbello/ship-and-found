# Deliberate Database Migrations & Governance (`docs/migrations.md`)

**Workstream**: `task-04-server-security/`  
**Domain**: DG Tech Store (Shop ATF 03)  
**Standard**: Step 3 (Forward-Only Schema Migrations & Safe Deployment Principles)  

---

## 1. Why Migrations Must Be Forward-Only

A migration is a deterministic, version-controlled instruction that advances the state of a relational database from version $N$ to $N+1$.

In enterprise production systems, migrations must strictly be **forward-only**:
1. **Irreversibility of State in Distributed Systems**: While code can be reverted instantly by checking out an earlier git commit, database storage holds state that cannot be "reverted" without data destruction. If a column was dropped, rolling back the migration does not restore the customer phone numbers or BVNs that were discarded.
2. **Replay Determinism Across Environments**: Every staging, preview, CI/CD, and production database must arrive at the identical relational topology by executing the exact same ordered sequence of SQL scripts. A forward-only paradigm guarantees that history is an append-only ledger of discrete structural transitions.
3. **Rollback via Roll-Forward**: When an erroneous schema change reaches production, the correct response is never to run an untested `DOWN` script or rollback command; the correct engineering response is to deploy a **new forward migration** that alters, replaces, or deprecates the erroneous structure safely.

---

## 2. Why You Never Edit a Migration That Has Already Run

Editing an existing migration file (`migration.sql`) after it has been applied to any persistent database is an absolute architectural violation for three core reasons:

1. **Checksum Failure & Migration Lockup**: ORM migration engines (such as Prisma's `_prisma_migrations` table) record the SHA-256 cryptographic hash of every executed migration file upon completion. If an engineer modifies an already-run migration file, the next execution fails with a fatal checksum mismatch (`P3009: The migration has been modified after it was applied`). The migration pipeline halts completely until manual intervention repairs the internal migration table.
2. **Schema Inconsistency Across Team & Servers**: If developer A modifies `0001_init/migration.sql` to add a column, their local database already marked `0001_init` as executed and will never re-run it. Meanwhile, developer B or the production pipeline will execute the modified version. The two environments now have different schemas despite both claiming to be fully migrated.
3. **Loss of Forensics**: Modifying historical migration scripts destroys the historical record of what structural changes existed at each release boundary.

---

## 3. Human Execution vs. AI Agent Propose-and-Stop Rule

In our agentic engineering workflow, **agents are explicitly prohibited from executing database migrations autonomously**. The agent's boundary terminates at generating proposed DDL/schema modifications (`schema.prisma`) and presenting the plan to the human engineer for approval.

### Why We Require Human Hands on the Migration Command:
1. **Destructive Operations are Irreversible**: An AI agent optimizing for a test suite or route fix will casually run destructive commands (e.g., `prisma db push --force-reset` or `DROP TABLE`) if it encounters a structural conflict. In development, this deletes seed data; in staging or production, it causes catastrophic data loss.
2. **Table Locks & Connection Starvation**: Adding an index or altering a table with 500,000 hire-purchase records can lock the table for minutes if not executed with non-blocking directives (e.g., PostgreSQL `CONCURRENTLY`). An agent cannot sense database load, connection pool pressure, or live retail transaction windows at Banex Plaza.
3. **The 3-Step Zero-Downtime Requirement**: As demonstrated in Step 3.2, adding a required column to a populated table fails outright. An agent will attempt to resolve this by setting dummy defaults or truncating tables. A human engineer recognizes the need for the three-step pattern: (1) add nullable, (2) backfill data safely, (3) alter to required.

---

## 4. The Honest Cost of Human-Run Migrations

Refusing to let the agent run migrations is not a free virtue; it carries real operational costs that must be acknowledged:

1. **Velocity Drag (Slower Iteration)**: Stopping the agent's autonomous loop and waiting for a human developer to open a terminal, inspect the SQL diff, and run `npx prisma migrate dev` introduces friction. In fast prototyping, it slows down feature scaffolding.
2. **Human Fallibility & Forgetfulness**: Humans forget. A developer checks out a branch, runs the application, and encounters runtime drift (`P2022: Column does not exist`) because they forgot to execute the pending migration that their peer committed.
3. **Context Switching Overhead**: Requiring manual verification breaks developer flow, shifting cognitive load from high-level business logic to low-level relational mechanics.

**Conclusion**: We knowingly accept the velocity cost of human-executed migrations because the alternative &mdash; an automated agent executing unmonitored DDL against a retail financial ledger &mdash; carries an unacceptable risk of silent table corruption and customer data loss.

