# CSV import architecture

Status legend: **Built and verified** (working, covered by tests) · **Partially built** (works but incomplete) · **Planned** (not built).

## Inspection of the existing Customer Account importer

Reviewed before expanding, per the founder's instruction not to rewrite a working importer unnecessarily. Findings as of the start of the Customer Intelligence Core phase:

| Aspect | Status | Actual behavior |
|---|---|---|
| Parser | **Built and verified** | Dependency-free character-scanner in `csv-import-service.ts`. Handles quoted fields, escaped `""` inside quotes, commas inside quotes, and both `\n` and `\r\n` line endings. Blank lines are dropped. Covered by unit tests. |
| Encoding / BOM / delimiter | **Planned** | Comma delimiter only. No BOM stripping, no encoding sniffing, no semicolon/tab support. A UTF-8 BOM would corrupt the first header name. |
| Header handling | **Built and verified** | Headers are lower-cased and whitespace-to-underscore normalized, then matched against a fixed known-column list. Unknown columns are ignored silently. |
| Validation | **Built and verified** | Per-row. `name` required; revenue, currency (USD/EUR/GBP/JPY), date, and health value validated when present. A row failing any check is recorded as an error and skipped — the rest of the file still imports. |
| Duplicate handling | **Partially built** | Case-insensitive name match, against both existing rows in the organization and earlier rows in the same file. Duplicates are counted and skipped, never overwritten — repeated imports are safe. **No merge or overwrite mode exists**, so correcting an account by re-importing is not yet possible. |
| Organization scoping | **Built and verified** | Existing-name lookup and owner-email matching are both filtered by `organizationId`. An owner email belonging to another organization's user never matches. Covered by a cross-org isolation test. |
| Transaction behavior | **Partially built** | **The commit is not atomic.** `DataSource` create, `ImportJob` create, `createMany`, and the audit event are four separate awaits. A failure midway can leave an orphaned `DataSource` or an `ImportJob` whose row counts do not match reality. Acceptable for local single-user use; must be wrapped in `prisma.$transaction` before commercial launch. |
| Error file generation | **Built and verified** | `generateErrorCsv()` in `csv-templates.ts` (kept separate from the server-only service specifically so client components can call it without pulling Prisma into the browser bundle). Downloaded client-side. |
| Saved column mapping | **Planned** | No mapping UI and no `ImportMapping` model. Column names must match the expected header names exactly (after normalization). |
| Import history | **Partially built** | `ImportJob` rows are written with counts and a structured error report, but **no interface displays them**. |
| Audit | **Built and verified** | Every commit records a `data_imported` audit event with entity type and row counts. |
| File size / name protection | **Built and verified** | 2MB limit, 5,000-row limit, `.csv` extension required, path-traversal characters rejected. Covered by unit tests. |
| Background processing | **Planned** | Entire file is read into memory and processed synchronously in a server action. Fine at the current limits; documented as a scaling constraint rather than solved. |

## Reusable primitives extracted this phase

Rather than rewrite the Customer Account importer, its proven pieces were generalized into `src/lib/services/import/` so every new importer shares them:

- `csv-core.ts` — **Built and verified.** The parser, header normalization, file validation, and the shared typed field readers (`readString`, `readNumber`, `readDate`, `readEnum`, `readBoolean`, `readPercentage`). Each reader returns either a value or a row error, so every importer produces identical error phrasing.
- `account-matcher.ts` — **Built and verified.** Resolves a row's `account_name` or `external_account_id` to a `CustomerAccount` **within the acting organization only**. Returns an unmatched-account row error otherwise. This is the single place cross-organization matching is prevented, so the guarantee is enforced once rather than re-implemented per importer.
- `import-runner.ts` — **Built and verified.** Wraps the common commit shape: create `DataSource`, run the importer's own persistence callback, create `ImportJob` with counts and the structured error report, and record the audit event.

The original `importCustomerAccounts` was left in place and unchanged. It predates these primitives and is covered by passing tests; converting it would be churn without benefit.

## Importers built this phase

| Importer | Status | Required fields | Notes |
|---|---|---|---|
| Customer Account | **Built and verified** (pre-existing) | `name` | See table above. |
| Customer Contact | **Built and verified** | account reference, `name` | Multi-role support, email-based dedup, contact departure fields. |
| Renewal | **Built and verified** | account reference, `renewal_date` | Never overwrites a historical renewal; creates a new record per period. |
| Product Usage Summary | **Built and verified** | account reference, `period_start`, `period_end` | Multiple periods per account; later imports never overwrite earlier periods. |
| Support Ticket | **Built and verified** | account reference, `ticket_id`, `created_date` | Dedup by external ticket id within the organization. |
| Customer Interaction | **Built and verified** | account reference, `interaction_date`, `interaction_type` | Internal-only types are excluded from "meaningful interaction" calculations. |

## Known limitations carried forward

1. Commits are still not wrapped in a database transaction (see above).
2. No saved column mapping; headers must match expected names.
3. No import-history interface.
4. No merge/overwrite mode — duplicates are always skipped.
5. No BOM stripping, encoding detection, or alternate delimiters.
6. Synchronous in-memory processing only.
