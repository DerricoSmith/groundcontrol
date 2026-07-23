# Ground Control

**A daily operating cockpit for solopreneurs.**

> Wake up knowing what changed, who needs you, and where the money is stuck.

Ground Control is a portfolio product concept — a daily briefing and command center for the person who *is* the team: a solo founder running ecommerce, consulting, digital products, and a paid community all at once, with no one else to triage the inbox or chase an invoice.

Once deployed, `/showcase` is the portfolio entry point and `/case-study` has the full write-up — see [Deploying on Vercel](#deploying-on-vercel) below.

---

## Why I built it

Most business software assumes there's a team behind the work — someone to watch the dashboard, someone to chase payments, someone to triage support. A solopreneur's business is scattered across Shopify, Stripe, Gmail, Notion, a calendar, and a dozen notes-app reminders that never quite get closed, and none of those tools tell the story that connects them.

Ground Control turns that scattered context into one daily brief: what changed overnight, who needs a reply, where money is stuck, what's at risk, and what to do first — with an AI layer that's designed to *notice faster than a busy person can*, not to make the call for them.

## Core features

- **Morning Brief** — an AI-style daily summary, top-priority moves with one-tap Done/Snooze/Draft actions, and a "who needs you" digest.
- **Customer Radar** — relationship-first customer cards (not CRM jargon) with a detail drawer: relationship summary, last message, suggested reply, and revenue opportunity.
- **Money Watch** — revenue by stream, unpaid invoices, warm opportunities, and an AI "fastest revenue move" callout.
- **Open Loops** — every unfinished follow-up, invoice chase, and vendor task in one checklist, grouped by urgency, with real client-side state and completion animation.
- **Command Center** — a simulated AI assistant ("ask your business what needs attention") that answers from the same underlying mock dataset.
- **Case Study & Showcase** — an in-app, portfolio-ready write-up of the product thinking behind it, plus a live desktop/mobile device-frame tour.
- **Pricing** — a tiered pricing page priced around revenue streams instead of seats, since a solo operator never adds a second one.
- Fully responsive, mobile-first (bottom nav + floating quick-ask sheet), with light and dark themes that persist across visits.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/) with a custom semantic design-token system (light + dark)
- [shadcn/ui](https://ui.shadcn.com/) component primitives (base-ui flavor)
- [Framer Motion](https://www.framer.com/motion/) for reveals, hover, and completion animations
- [Recharts](https://recharts.org/) for the revenue-by-stream chart
- [next-themes](https://github.com/pacocoursey/next-themes) for theme persistence
- [Sonner](https://sonner.emilkowal.ski/) for toast feedback
- 100% mock, hand-authored data — no database, no external API calls

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to `/morning-brief`; the public portfolio entry point is `/showcase`.

```bash
npm run build   # production build
npm run lint    # eslint
```

## Deploying on Vercel

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. In [Vercel](https://vercel.com/new), import the repository — it auto-detects Next.js, no config needed.
3. Set one environment variable so Open Graph/social preview links resolve correctly:
   - `NEXT_PUBLIC_APP_URL` = your production URL (e.g. `https://ground-control.vercel.app`)
4. Deploy. No database, auth provider, or API keys are required.
5. (Optional) Point a custom domain at the Vercel project from the project's **Settings → Domains**.

## Portfolio note

This is a **concept/demo project** built to show product thinking, UX design, and front-end engineering — not a production SaaS. There is no real authentication, no real payments, no database, and no live third-party integrations. Every customer, invoice, message, and AI response is realistic but entirely mock data, and the "AI" in Command Center is a deterministic, keyword-matched response engine over that data rather than a live model call. Anything presented as a future capability (native Shopify/Notion/Gmail/Klaviyo integrations, an onboarding flow, a real LLM) is described in the `/case-study` page as a next step, not something this build does today.

Built by **Derrico Smith**.
