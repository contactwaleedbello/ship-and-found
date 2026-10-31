# data-model

Source: `prisma/schema.prisma` and `.agents/rules/data-and-schema.md`.

## Redundancy notice

This file is a navigation aid. It does not define schema, fields, or rules.

- The source of truth for the schema is `prisma/schema.prisma`.
- The additions to PRD 5.1, the seven schema gaps, the migration rules, the transaction boundaries, the referential integrity rules, the indexing rules, and the field treatment matrix are all in `.agents/rules/data-and-schema.md`.
- If this file and either of those disagree, they win. This file loses.

Do not add a field, table, or relationship because it appears here. Fields come from `prisma/schema.prisma` only.

## What this file is for

Quick orientation. A reader who does not want to open the schema file can learn what domains exist and how they connect. Then they open `prisma/schema.prisma` to see the exact fields.

## Domains

The tables are grouped into five domains. This grouping is not in the schema file. It is here for orientation only.

1. **Identity.** User, CustomerProfile, ConsentRecord.
2. **Catalog.** Device, Inventory, Price, Settings.
3. **Application.** PartPaymentApplication, DownPaymentTransaction.
4. **Contract.** Agreement, BalancePaymentTransaction, SettlementLog, WhatsAppReminderLog.
5. **Operations.** AuditLog, DataDeletionRequest.

Total: 18 tables. Sources: PRD 5.1 plus the 16 additions in `.agents/rules/data-and-schema.md`.

## What each domain holds

One sentence per domain. Field-level detail in `prisma/schema.prisma`.

- **Identity** holds every user account, its role, its customer profile, its NIN and phone number (encrypted), its guarantor details, and its consent records.
- **Catalog** holds every device, its stock count and reserved count, its base price and dynamic price, and the runtime Settings key-values.
- **Application** holds every part-payment application and every down payment transaction tied to it.
- **Contract** holds every activated agreement, its device serial and due date, its balance payments, its settlement payments, and its WhatsApp reminder log.
- **Operations** holds the immutable audit trail and the formal data deletion requests.

## Relationships

Plain English. Every foreign key is `ON DELETE RESTRICT` per `.agents/rules/data-and-schema.md`.

- One User has one CustomerProfile.
- One User has many ConsentRecords.
- One Device has one Inventory record.
- One Device has one Price record.
- One Customer has many PartPaymentApplications.
- One PartPaymentApplication has one Device.
- One PartPaymentApplication has many DownPaymentTransactions.
- One PartPaymentApplication has at most one Agreement.
- One Agreement has many BalancePaymentTransactions.
- One Agreement has many SettlementLogs.
- One Agreement has many WhatsAppReminderLogs.
- One User can author many AuditLog rows (actor_id).
- One Customer can have many DataDeletionRequests.
- Settings is a singleton key-value table with no foreign keys.

## Where to look for what

| Question | Rule file or file |
|---|---|
| What fields does a table have? | `prisma/schema.prisma` |
| Which fields were added to PRD 5.1 and why? | `.agents/rules/data-and-schema.md` additions table |
| Which table writes happen in one transaction? | `.agents/rules/data-and-schema.md` transaction boundaries |
| Which foreign keys can cascade? | `.agents/rules/data-and-schema.md` referential integrity rules. Answer: none cascade. All RESTRICT. |
| Which indexes exist? | `.agents/rules/data-and-schema.md` indexing rules |
| Which fields are encrypted or masked? | `.agents/rules/data-and-schema.md` field treatment matrix |
| Which fields must survive anonymization? | `.agents/rules/version-2-data.md` and `.agents/rules/ndpa-compliance.md` |
| Which fields are unresolved (money type, status type, encrypted lookup)? | `.agents/rules/data-and-schema.md` unresolved before build |
| How does a schema change happen? | `.agents/rules/data-and-schema.md` change process |

## Rules that govern the data model

This file does not restate them. Open the rule file before any query, any migration, any transaction, any anonymization.

- `.agents/rules/data-and-schema.md`
- `.agents/rules/ndpa-compliance.md`
- `.agents/rules/version-2-data.md`
- `.agents/rules/security-baseline.md`

## How to use this file

Read this file once when you are new to the project or when you are about to work on a table you have not touched. Then open `prisma/schema.prisma` for the exact fields and `.agents/rules/data-and-schema.md` for the governance rules. Do not treat this file as the schema.