# Decisions

Format per the founder's spec: Date · Decision · Context · Options considered · Reasoning · Consequences · Review date.

Decisions below were made because the founder's brief explicitly instructs: *"Do not ask the founder to make technical decisions that can be responsibly inferred from the repository and these requirements. Record reasonable assumptions in DECISIONS.md."* Anything that meets one of the ten founder-decision triggers is instead recorded under **Founder decisions needed**, not decided here.

---

### 2026 — Retire the prior single-tenant product surface rather than refactor it

**Context**: The repository contained a working portfolio app ("Ground Control" for a solopreneur tracking their own business). The new brief requires a multi-tenant B2B customer-intelligence platform of the same name.
**Options considered**: (a) refactor the existing pages/data model in place, (b) keep both products side by side, (c) retire the old product pages and data model, keep the reusable infrastructure.
**Reasoning**: The two products solve different problems for different users sharing only surface vocabulary ("customer," "health," "action"). Refactoring would produce awkward compromises (e.g. a `Workspace` model that is neither a personal workspace nor a multi-tenant org cleanly). This is exactly the "major architectural migration" the founder pre-authorized in the brief itself, so it is executed, not merely proposed.
**Consequences**: The old `/morning-brief`, `/money-watch`, `/open-loops`, `/command-center`, `/customer-radar` routes and their single-tenant Prisma models are removed in Phase 3. The design tokens, shadcn/base-ui component primitives, Auth.js setup, and Prisma/Postgres conventions are kept and re-themed. The prior work is not deleted from git history — it is fully recoverable via version control if ever needed for reference.
**Review date**: Revisit only if a future need for a genuinely single-tenant "personal" product reappears — unlikely given the company direction.

---

### 2026 — Do not adopt Supabase-as-platform in phase 1

**Context**: Preferred stack lists Supabase; current stack has Prisma + Postgres + Auth.js already working.
**Options considered**: (a) migrate to Supabase now for its bundled auth/RLS tooling, (b) keep Prisma/Postgres/Auth.js and implement RLS directly in SQL.
**Reasoning**: Supabase's advantage over the current stack is convenience, not capability — Postgres RLS is a Postgres feature usable from any Postgres host. Migrating auth providers before a single paying pilot exists adds vendor risk and rework for no product benefit. The founder's own instruction: "Do not migrate the application solely to satisfy this preference. Only propose a migration if the current stack creates a material limitation."
**Consequences**: RLS is implemented directly via Prisma migrations (raw SQL). Any Postgres host works (Vercel Postgres/Neon today). If a genuine need for Supabase-specific features (storage, realtime) appears later, this decision is revisited — recorded, not closed.
**Review date**: Revisit at first real client's file-storage or realtime requirement, if any.

---

### 2026 — AI service layer ships with a disclosed deterministic fallback, not a live model call, until a key is provided

**Context**: Brief requires an AI service layer with 12 workflows, but "keep it free/keyless" and "do not create unexplained AI outputs" are both explicit constraints, and no `ANTHROPIC_API_KEY` exists yet.
**Options considered**: (a) block AI features entirely until a key exists, (b) build the full service-layer contract (versioning, logging, evidence, structured validation) now with a clearly-labeled non-LLM fallback generator, swapped for a real model call the moment a key is configured.
**Reasoning**: Option (b) lets every downstream feature (Risk Radar explanations, Executive Brief, VoC themes) be built and tested against a real interface today, with zero behavior change required later beyond adding the key. It also avoids ever showing an unexplained or fabricated-sounding AI output before a real model is wired up.
**Consequences**: `AIAnalysisRecord` rows are created for every call regardless of provider; the UI always shows the same evidence/confidence/review-state affordances. A visible "simulated" label is not shown to end customers in the product (it would undermine trust); instead, output is conservative, evidence-bound, and never fabricates specifics it can't source — the same discipline that will be required once a live model is connected.
**Review date**: Revisit the moment the founder supplies an Anthropic API key.

---

### 2026 — Pricing is not published with exact numbers on the public site by default

**Context**: Founder provided working internal prices and said "do not necessarily display all prices publicly... allow price visibility to be controlled through configuration."
**Decision**: Default configuration hides exact numbers; public pages show tier names, what's included, and "starting at" ranges or "contact us," with a feature flag to reveal exact figures later.
**Reasoning**: This is explicitly listed as a founder-decision trigger ("pricing displayed publicly"). Defaulting to hidden is the reversible, lower-risk choice and matches the founder's own stated preference not to force immediate public pricing.
**Consequences**: See **Founder decisions needed** below — final call on what (if anything) becomes public is the founder's.
**Review date**: Before Phase 2 (website) ships pricing pages.

---

### 2026 — Modular monolith, not microservices

**Context**: Brief lists 18 potential "services."
**Decision**: Implemented as server-only modules within the single Next.js app (a "modular monolith"), not separate deployables.
**Reasoning**: At current scale (pre-first-client), network-separated services add operational cost with no reliability or scaling benefit, and directly contradict the founder's own rule: "Do not create a separate service only for architectural appearance." Module boundaries still exist in code (`lib/services/*`) so extraction later is possible if genuinely needed.
**Review date**: Revisit only if a specific service (e.g. AI analysis) needs independent scaling or a different runtime.

---

## Founder decisions needed

These meet one or more of the ten explicit stop-and-ask triggers and are **not** decided by this work.

1. **Brand/domain**: confirm `signalsandstate.com` and `app.signalsandstate.com` (or final alternatives) so DNS/email-sending domains can be configured for real. *(Trigger: brand ownership.)*
2. **Public pricing**: confirm whether any exact price appears publicly at launch, or all tiers stay "contact us" until the first founding client is signed. *(Trigger: pricing displayed publicly.)*
3. **Paid vendor accounts**: none are being activated without explicit approval — specifically Anthropic API (for real AI), Resend or Postmark (for real email delivery, including to leads and Executive Brief recipients), Stripe (for real billing), Sentry, and a hosted Postgres instance for anything beyond local dev. *(Trigger: paid vendor selection + external communication to a real person.)*
4. **Booking link**: which external scheduling tool (Calendly or similar) to embed for "Book a Customer Intelligence Review." *(Trigger: paid vendor selection.)*
5. **Legal documents**: the drafted Privacy Policy, Terms, DPA outline, Security Overview, Subprocessor List, and Acceptable Use Policy are marked as drafts requiring attorney review before publication. *(Trigger: legal exposure.)*
6. **Production deployment credentials**: Vercel project, database, and DNS access remain founder-controlled; this work will prepare configuration, not hold or transmit production secrets. *(Trigger: production deployment credentials.)*
7. **First real organization data**: importing any actual client's customer data is a founder-approved action per client, not something triggered automatically. *(Trigger: client data handling.)*

Until these are resolved, all corresponding features are built to the point of being ready to switch on, not switched on.

---

## Production Showcase v1 release decisions (2026-07-25)

### Postgres everywhere, including local development and both test suites

**Decision**: `prisma/schema.prisma` targets Postgres and is the only schema. Local development, Vitest, and Playwright all run against separate Postgres schemas (`gc_dev`, `gc_test`, `gc_e2e`) on the same Neon instance as production, rather than SQLite files.

**Why**: The Prisma client is provider-specific, so keeping SQLite locally while shipping Postgres meant either two generated clients fighting over `node_modules/.prisma`, or a generated schema variant that could silently drift. Both are worse than the real cost, which is test time: the suite went from 14 seconds to 179 seconds.

**What it buys**: production parity in every test, one schema with no drift, and Row Level Security that can finally be exercised rather than documented as unverified. Three phases of documentation had been carrying "RLS unverified, Docker unavailable" as an open item; this closes the reason for it.

**Cost accepted**: a three minute test suite, and local development now requires network access to Neon. Recorded rather than hidden because it is a real tradeoff for anyone joining the project.

### Test resets truncate in one statement, and refuse to run outside a test schema

`resetTestDatabase()` issues a single schema-qualified `TRUNCATE ... CASCADE` instead of forty sequential deletes, which is what makes a network database viable at all. Two guards exist because the failure mode is severe: `scripts/with-db.mjs` refuses to run a `TEST_`/`E2E_` command against a URL that is not a `gc_test` or `gc_e2e` schema, and `tests/helpers/setup-env.ts` refuses to start the suite against one. A mistyped connection string should fail loudly, not truncate production.

### One local env file

`.env.local` was removed and `.env` is the single local secrets file. Prisma CLI auto-loads `.env` while Next.js prefers `.env.local`, and having both meant the CLI and the app could disagree about which database they were talking to. Both are gitignored.
