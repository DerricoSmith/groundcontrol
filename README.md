# Ground Control

**A daily operating cockpit for solopreneurs.**

> Wake up knowing what changed, who needs you, and where the money is stuck.

Ground Control is a portfolio product with a real, working core: a daily briefing and command center for the person who *is* the team — a solo founder running ecommerce, consulting, digital products, and a paid community all at once, with no one else to triage the inbox or chase an invoice.

Once deployed, `/showcase` is the portfolio entry point and `/case-study` has the full write-up — see [Deploying on Vercel](#deploying-on-vercel) below.

---

## Why I built it

Most business software assumes there's a team behind the work — someone to watch the dashboard, someone to chase payments, someone to triage support. A solopreneur's business is scattered across Shopify, Stripe, Gmail, Notion, a calendar, and a dozen notes-app reminders that never quite get closed, and none of those tools tell the story that connects them.

Ground Control turns that scattered context into one daily brief: what changed overnight, who needs a reply, where money is stuck, what's at risk, and what to do first — with an AI layer that's designed to *notice faster than a busy person can*, not to make the call for them.

## Two ways to experience it

1. **Demo mode, no account** — every page works instantly with realistic mock data, exactly as a portfolio visitor would expect. This is what `/showcase` links to.
2. **A real account** — sign up at `/signup` and you get a genuine, private workspace backed by a real database. It's seeded with the same realistic dataset on creation (so there's something to see in seconds), and from then on your own Open Loop status changes, etc. persist for real across sessions.

The app detects which mode you're in per request — logged out always shows the safe demo dataset; logged in always shows (and writes to) your own workspace.

## Core features

- **Morning Brief** — an AI-style daily summary, top-priority moves with one-tap Done/Snooze/Draft actions, and a "who needs you" digest.
- **Customer Radar** — relationship-first customer cards (not CRM jargon) with a detail drawer: relationship summary, last message, suggested reply, and revenue opportunity.
- **Money Watch** — revenue by stream, unpaid invoices, warm opportunities, and an AI "fastest revenue move" callout.
- **Open Loops** — every unfinished follow-up, invoice chase, and vendor task in one checklist, grouped by urgency, with real persistence for signed-in users and a completion animation.
- **Command Center** — a simulated AI assistant ("ask your business what needs attention") that answers from the same underlying dataset.
- **Real accounts** — email/password sign-up and login (Auth.js), each with an isolated, database-backed workspace.
- **Case Study & Showcase** — an in-app, portfolio-ready write-up of the product thinking behind it, plus a live desktop/mobile device-frame tour.
- **Pricing** — a tiered pricing page priced around revenue streams instead of seats, since a solo operator never adds a second one.
- Fully responsive, mobile-first (bottom nav + floating quick-ask sheet), with light and dark themes that persist across visits.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack, Server Actions)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/) with a custom semantic design-token system (light + dark)
- [shadcn/ui](https://ui.shadcn.com/) component primitives (base-ui flavor)
- [Framer Motion](https://www.framer.com/motion/) for reveals, hover, and completion animations
- [Recharts](https://recharts.org/) for the revenue-by-stream chart
- [next-themes](https://github.com/pacocoursey/next-themes) for theme persistence
- [Sonner](https://sonner.emilkowal.ski/) for toast feedback
- [Prisma](https://www.prisma.io/) — SQLite locally (zero setup), Postgres in production
- [Auth.js (NextAuth v5)](https://authjs.dev/) — email/password credentials auth, JWT sessions
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) for password hashing

## Running locally

```bash
npm install
cp .env.example .env.local   # then also copy it to .env (Prisma CLI reads .env, not .env.local)
npm run db:push              # creates prisma/dev.db (SQLite) from the schema
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to `/morning-brief` in demo mode; the public portfolio entry point is `/showcase`. Sign up at `/signup` to try the real, persisted flow — it works immediately with no external accounts.

```bash
npm run build       # production build
npm run lint         # eslint
npm run db:studio    # browse the local database in Prisma Studio
```

## Deploying on Vercel

The app ships pointed at SQLite for zero-friction local dev. **SQLite's file storage does not persist on Vercel's serverless filesystem**, so production needs a real hosted Postgres database — this takes about two minutes and has a free tier.

1. Push this repo to GitHub.
2. Switch the datasource in `prisma/schema.prisma` to Postgres:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   (Everything else in the schema is already portable — this is the only change needed.)
3. In [Vercel](https://vercel.com/new), import the repository — Next.js is auto-detected.
4. Add a Postgres database from the Vercel project's **Storage** tab (Vercel Postgres, powered by Neon — free tier, no credit card). Vercel automatically injects `DATABASE_URL` into your project's environment variables.
5. Add these two more environment variables in **Settings → Environment Variables**:
   - `AUTH_SECRET` — generate one with `npx auth secret`
   - `NEXT_PUBLIC_APP_URL` — your production URL (e.g. `https://ground-control.vercel.app`), used for Open Graph previews
6. Deploy. On first deploy, run `npx prisma migrate deploy` (or `npx prisma db push`) against the production `DATABASE_URL` once to create the tables — either from your machine with the Vercel env vars pulled locally (`vercel env pull`), or as a one-off via Vercel's build command.
7. (Optional) Point a custom domain at the project from **Settings → Domains**.

## Portfolio note

This is a **portfolio project**, not a funded production SaaS — but the core account/data layer is real, not simulated. Signing up creates an actual user row, an actual bcrypt-hashed password, an actual session, and an actual private workspace in a real database; marking an Open Loop done as a signed-in user really persists across a refresh and a new device.

What's still simulated, deliberately, to keep this a reasonable scope: there are **no live third-party integrations** (Shopify, Gmail, Klaviyo, etc. — every account starts from the same realistic seed data instead), **no real billing** (the `/pricing` CTAs lead to the real sign-up flow, not a Stripe checkout), and the "AI" in Command Center is a deterministic, keyword-matched response engine over your real data rather than a live LLM call. Each of these is described as a concrete next step in the `/case-study` page.

Built by **Derrico Smith**.
