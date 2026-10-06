# Interview walkthrough: Ground Control

**Role:** Customer Experience Director (build AI bots yourself, own deflection/accuracy/CSAT/cost, own NRR)
**What to show:** a working AI assistant you built, grounded on customer data, with an eval that proves how accurate it is and what it costs.

---

## Before the call (10 minutes)

1. Paste your key into `groundcontrol/.env` → `ANTHROPIC_API_KEY="sk-ant-..."`. The dev server reloads env files on save.
2. Start the app: in the Claude desktop app, preview `groundcontrol`, or from `groundcontrol/`:
   ```bash
   npm run dev
   ```
3. Warm the prompt cache: ask one question in Command Center so the first live answer is fast.
4. Run the eval once so you have fresh numbers on screen (see step 4 of the demo):
   ```bash
   npm run eval
   ```
5. Have open in tabs: `/command-center`, `/customer-radar`, `src/lib/ask-claude.ts`, the latest file in `eval-results/`.
6. Read `src/lib/ask-claude.ts` end to end yourself. It's about 150 lines. Be ready to explain every block in your own words.

---

## The 8-minute demo

### 1. Frame it (30 sec)
> "This is Ground Control, a product I built: a daily cockpit that turns scattered customer, invoice, and task data into what needs attention today. The users here are solo founders, but the core is what a CX org needs: an assistant that answers from real account data, routes people to the right action, and is measured on whether it's actually right."

### 2. Show the product (1.5 min)
- **Morning Brief:** what changed and what to do first.
- **Customer Radar:** relationship health per customer: at-risk flags, sentiment, last touch, suggested reply. *This is health scoring and churn signals, just for a small business.*
- **Open Loops:** every follow-up in one place, persisted per account.

### 3. Live AI (2.5 min): Command Center
Ask, in this order:
1. **"Which customers are at risk?"** → grounded answer, named accounts, routes to Customer Radar. Point at the badge: model, latency, cached tokens.
2. **"Draft a reply to the delayed order customer."** → ready-to-send draft in the founder's voice. *This is the support-deflection pattern.*
3. **Ask an off-script question they suggest.** Let the interviewer pick one. That's the strongest moment in the demo.
4. **"What is Tesla's stock price?"** → it says it doesn't have that data instead of making something up. *Guardrail.*

### 4. Prove it works (2 min): the eval
Run `npm run eval` (or show the last results file):

| Engine | Resolution accuracy | Median latency | Cost (10 questions) |
|---|---|---|---|
| Rule engine (v1, keyword matching) | 3/10 (30%) | ~0 ms | $0 |
| Claude, grounded (v2) | _fill in from your run_ | _fill in_ | _fill in_ |

> "v1 was a keyword bot. It handled the questions I scripted and failed everything else, including confidently answering questions it had no data for. I wrote an eval before swapping in the LLM so I could prove the upgrade instead of claiming it. Each case is graded against facts in the data, plus two 'should say I don't know' cases."

### 5. How it's built (1.5 min): open `ask-claude.ts`
- **Grounding:** the account data goes in the system prompt. The model is told to answer only from it and to treat customer text as data, not instructions (prompt-injection hygiene).
- **Structured output:** a JSON schema forces `answer`, `signals`, `action`, `draftReply`. `action` is an **enum** of real routes, so the bot can't send anyone to a page that doesn't exist.
- **Prompt caching:** the data block is byte-stable, so every question after the first reads it from cache. Point at "cached" in the badge. *That's cost per contact.*
- **Fallbacks, two layers:** server-side model fallback on refusals, and if the API is down, out of quota, or returns bad output, the old rule engine answers. The badge tells you which one answered. The user is never left with an error.
- **Effort set to low:** for Q&A over a small dataset, speed matters more than deep reasoning. Tune per route, and measure it.

---

## Map it to their job description

| They want | What you point at |
|---|---|
| Build bots yourself: prompts, workflows, integrations, testing, shipping | `ask-claude.ts` (prompt + schema), `/api/ask` (integration), `scripts/eval.mjs` (testing), fallback path (production hardening) |
| Deflection, resolution accuracy, CSAT, cost per contact | Eval = resolution accuracy. Cache + token metering = cost per contact. Draft replies = deflection. |
| Health scoring and churn prediction, automated | Customer Radar risk flags and severity; the assistant surfaces at-risk accounts on request |
| CS as a revenue engine: NRR, renewals, expansion | Money Watch + opportunities; "fastest revenue move"; renewal windows in Upcoming Moments |
| Frontline/field teams, connected hardware (bonus) | See "What I'd build first" below |

## What I'd build first in this role (have this ready)
1. **Support deflection bot** on their help center + ticket history (Intercom Fin or Zendesk AI, or this same pattern on the Claude API), with an eval set built from real resolved tickets before launch. Ship it on one queue, measure deflection and CSAT against a holdout.
2. **Account health score** that blends product usage, **device telemetry** (offline devices, firmware lag, sync failures; for connected hardware these are the earliest churn signals), ticket volume and sentiment, and renewal date. Auto-generate a weekly "who's at risk and why" brief per CSM, like Morning Brief but for their book.
3. **Renewal agent:** 120/90/60-day renewal workflows that draft the QBR summary and the expansion case from usage data, with the CSM approving before anything is sent.
4. **Frontline-friendly support:** short, mobile-first answers for field workers. Deskless users won't read a knowledge-base article.

---

## Questions to prepare for (answer honestly)

- **"Did you build this yourself?"** Speak to what you designed and wrote, and how you used AI coding tools to move faster. They'll respect that. They're hiring someone who ships with AI.
- **"Why is the data mocked?"** It's a portfolio product. The account layer is real (sign up → a real DB workspace, and the assistant answers from *your* workspace's data). Integrations like Shopify and Gmail are the documented next step.
- **"How would you know if it regressed?"** Re-run the eval on every prompt or model change. Add real failed conversations to the eval set.
- **"What does it cost at scale?"** Show the per-question cost from the eval and multiply by monthly contacts. Caching drops repeat input cost by about 90%.
- **"Why not just use Fin or Zendesk AI?"** You would, where it fits. Buy the commodity deflection layer, build the parts that need your own data: health scoring, renewal workflows, telemetry-driven outreach.

## If something breaks live
- No key or an API error → the app still answers via the rule engine, and the badge says so. Narrate it: *"that's the fallback path working."*
- Server not running → `npm run dev` from `groundcontrol/`, then wait about 5 seconds for the first compile.
