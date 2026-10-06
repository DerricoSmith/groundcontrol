# Interview walkthrough: Ground Control

**Role:** Customer Experience Director (build AI bots yourself, own deflection/accuracy/CSAT/cost, own NRR)
**Format:** live demo, no API key, no accounts, nothing external. Everything runs locally on demo data.

---

## Before the call (5 minutes)

1. Start the app from `groundcontrol/`:
   ```bash
   npm run dev
   ```
   Or preview `groundcontrol` in the Claude desktop app.
2. Open http://localhost:3000/morning-brief and click through every page once, so nothing compiles mid-demo.
3. Keep tabs open on `/morning-brief`, `/customer-radar`, `/money-watch`, `/open-loops`, `/command-center`.
4. Optional: keep `src/lib/ai-response.ts` open in your editor in case they want to see how the assistant works.

---

## The 8-minute demo

### 1. Frame it (30 sec)
> "This is Ground Control, a product I built: a daily cockpit that turns scattered customer, invoice, and task data into what needs attention today. The users are solo founders, but the problem is the same one a CX org has: signals spread across tools, and nobody connecting them before a customer churns or a renewal slips."

### 2. Morning Brief (1 min)
- The daily summary, top-priority moves with Done / Snooze / Draft, and "who needs you."
- *CX parallel:* this is the CSM's start-of-day view of their book: what changed, who's at risk, what to do first.

### 3. Customer Radar (2 min): your strongest CX page
- Relationship cards with at-risk flags, sentiment, VIP, waiting-on-you, and last touch.
- Open **Elena Voss**: a reliable buyer gone quiet for 61 days. Show the relationship summary, timeline, and suggested reply.
- *CX parallel:* "This is health scoring and churn signals. Usage drop, silence, payment drift. At your company the inputs would be device telemetry, product usage, and ticket sentiment, but the design question is the same: surface the risk early, and give the person the next step."

### 4. Money Watch (1 min)
- Revenue by stream, $7,320 stuck in overdue invoices, warm opportunities, "fastest revenue move."
- *CX parallel:* CS as a revenue engine. Renewals, expansion, and collections in one view, ranked by dollars.

### 5. Open Loops (1 min)
- Every follow-up grouped by urgency, tied to dollars. Check one off to show the completion state.

### 6. Command Center (2 min)
Use the suggestion chips. They're the intents the assistant is built for:
1. **"Where is money stuck?"** → $7,320 across 3 invoices, with a call-don't-email recommendation on Carvalho.
2. **"Which customers are at risk?"** → named accounts with reasons, routed to Customer Radar.
3. **"Draft a reply to the delayed order customer."** → a ready-to-send draft. Click **Draft reply** to copy it. *This is the support-deflection pattern.*
4. **"What should I do first?"** → a prioritized next move.

How to describe it, accurately:
> "The assistant classifies the question into an intent, pulls the matching records, and returns an answer, the supporting signals, and the screen to act on. I designed it so every answer routes you to an action, not just text. The codebase also has a Claude-backed version wired in that answers open-ended questions from the same data. It's switched off for this demo so nothing depends on an external service."

**Stick to the chips.** Off-script questions get a generic summary. If they ask to type their own question, say so plainly and use it as the bridge to section 7.

### 7. How I'd build it for real (30 sec, then into discussion)
> "The intent version is great for a demo and terrible at the long tail. Before swapping in an LLM I wrote an eval: 10 questions graded against the actual data, including two it should refuse. The intent engine scores 3 out of 10. It nails the scripted questions and misses everything else. That's the gap an LLM grounded on your data closes, and the eval is how you prove it did instead of just claiming it."

---

## Map it to their job description

| They want | What you point at |
|---|---|
| Build bots yourself: prompts, workflows, integrations, testing, shipping | Command Center intents → answer → action routing; the Claude-backed path and the eval script in the repo |
| Deflection, resolution accuracy, CSAT, cost per contact | Draft replies = deflection; the eval = resolution accuracy; every answer routes to a resolving action |
| Health scoring and churn prediction, automated | Customer Radar risk flags and severity; Morning Brief surfacing at-risk accounts first |
| CS as a revenue engine: NRR, renewals, expansion | Money Watch, opportunities, "fastest revenue move," renewal windows in Upcoming Moments |
| Frontline/field teams, connected hardware (bonus) | See "What I'd build first" below |

## What I'd build first in this role (have this ready)
1. **Support deflection bot** on their help center and ticket history (Intercom Fin or Zendesk AI, or an LLM on their own data). Build the eval from real resolved tickets *before* launch. Ship it on one queue and measure deflection and CSAT against a holdout.
2. **Account health score** that blends product usage, **device telemetry** (offline devices, firmware lag, sync failures; for connected hardware these are the earliest churn signals), ticket volume and sentiment, and renewal date. Auto-generate a weekly "who's at risk and why" brief per CSM, like Morning Brief but for their book.
3. **Renewal workflow:** 120/90/60-day sequences that draft the QBR summary and expansion case from usage data, with the CSM approving before anything goes out.
4. **Frontline-friendly support:** short, mobile-first answers for field workers. Deskless users won't read a knowledge-base article.

---

## Questions to prepare for (answer honestly)

- **"Is that an LLM?"** Not in this demo. It's an intent engine over the data, and the Claude-backed version is in the code but switched off. Then pivot to the eval story in section 7. Never let them assume it's an LLM.
- **"Did you build this yourself?"** Speak to what you designed and wrote, and how you used AI coding tools to move faster. They're hiring someone who ships with AI.
- **"Why is the data mocked?"** It's a portfolio product. The account layer is real (sign up → a real database workspace). Integrations are the documented next step.
- **"How would you know if a bot regressed?"** Re-run the eval on every prompt or model change, and add real failed conversations to the eval set.
- **"Why not just use Fin or Zendesk AI?"** You would, where it fits. Buy the commodity deflection layer, build the parts that need your own data: health scoring, renewal workflows, telemetry-driven outreach.

## If something breaks live
- Page blank or slow → it's compiling on first load. Wait about 5 seconds and refresh.
- Server not running → `npm run dev` from `groundcontrol/`.
