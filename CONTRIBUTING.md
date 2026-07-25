# Contributing

This repository is built for continued AI-assisted development (Claude Code) as well as direct human contribution. Read `CLAUDE.md` first — it is the authoritative guide to how this codebase should be extended.

## Local setup

```bash
npm install
cp .env.example .env.local && cp .env.example .env   # Next.js reads .env.local; Prisma CLI reads .env
npm run db:push      # create/update local SQLite schema
npm run dev
```

## Common commands

```bash
npm run dev          # local dev server
npm run build         # production build
npm run lint           # eslint
npm run typecheck      # tsc --noEmit (add if not already present)
npm run test            # unit + integration tests (Phase 3+)
npm run test:e2e         # Playwright (Phase 11+)
npm run db:push           # push schema changes to local SQLite
npm run db:studio          # browse local data in Prisma Studio
```

## Conventions

- **Folders**: `src/app/(marketing)` public site, `src/app/(app)` authenticated product, `src/app/(internal)` consultant workspace, `src/lib/services/*` one folder per service boundary, `src/lib/ai/*` the AI service layer, `src/components/ui/*` primitives (shadcn/base-ui), `src/components/{domain}/*` feature components.
- **Types**: explicit types on every exported function; avoid `any` — use `unknown` + narrowing or a zod-inferred type at any external boundary (CSV rows, AI output, webhook payloads).
- **Server/client boundary**: anything touching Prisma, secrets, or the AI service layer is server-only (`"use server"` actions or route handlers) — never imported into a Client Component.
- **Validation**: every external input (form, CSV, webhook, AI output) is validated with zod before use.
- **Migrations**: schema changes go through `prisma migrate` (or documented `db push` for local-only iteration), never a manual production schema edit.
- **Comments**: reserved for non-obvious *why* — a workaround, an invariant, a subtle constraint — not restating *what* the code does.
- **Naming**: match the language guide in `DESIGN_SYSTEM.md` (Customer Account / Organization / User, etc.) in code identifiers too, not just UI copy — a `client` variable holding a `CustomerAccount` is a bug waiting to happen.

## Before marking a phase complete

Per `IMPLEMENTATION_PLAN.md`: run formatting, type checking, linting, and the relevant test subset; review accessibility and security for what changed; update the relevant doc(s); update `CHANGELOG.md`; record any new decisions in `DECISIONS.md`.

## What not to do

See `CLAUDE.md` → Prohibited shortcuts. In short: no fake metrics in production paths, no secrets in client code, no unexplained AI output, no autonomous customer-facing actions, no lorem ipsum, no unearned compliance claims, no unnecessary abstraction, no feature that doesn't serve the commercial launch scope in `IMPLEMENTATION_PLAN.md`.
