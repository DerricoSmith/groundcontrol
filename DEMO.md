# Interview walkthrough: Ground Control

**Role:** Customer Experience Director (build AI bots yourself, own deflection/accuracy/CSAT/cost, own NRR)
**Format:** a guided, in-app walkthrough, about 12 minutes. Runs fully offline: no API key, no accounts.

---

## Before the call (5 minutes)

1. Start the app from `groundcontrol/`:
   ```bash
   npm run dev
   ```
2. Open http://localhost:3000/morning-brief and click through each page once, so nothing compiles mid-demo.
3. Do a full dry run of the walkthrough with presenter notes **on** (press `N`).
4. Before you share your screen, press `N` again to turn notes **off**. The setting is remembered. Better still, share only the browser window and keep this file on a second screen.
5. Use a window at least 1280px wide. Below that, the tour docks its tooltips at the bottom instead of pointing at elements.

To start: click **Guided walkthrough** (bottom-right), or open `http://localhost:3000/morning-brief?tour=1`.

## Controls

| Key | Action |
|---|---|
| `→` / `Enter` / `Space` | Next step |
| `←` | Back |
| `N` | Toggle presenter notes (yellow boxes, hidden by default) |
| `Esc` | Exit and explore freely; the launcher brings you back |
| Chapter bar (bottom) | Jump to any chapter. Useful if they ask "can you show me X?" |

A reload mid-tour resumes on the same step.

---

## Running order and timing

| Chapter | Steps | Time | What lands |
|---|---|---|---|
| **Opening** | Intro scene | 0:45 | You built it; it maps to CX; here's the agenda |
| **The product** | 10 spotlight steps across 4 screens | 4:00 | Design for decisions, every insight ends in an action, quiet churn is the dangerous kind |
| **The AI layer** | Ask + answer, architecture, scorecard | 2:30 | Honest about the intent engine; guardrailed metrics; you measured your own bot at 3/10 |
| **How I build** | MCP, skills, automations | 2:30 | Integrate once; expertise lives in skills; proactive, scheduled work |
| **Getting buy-in** | Pitch, priorities | 1:45 | Smallest ask, give before you ask, core metrics are a floor |
| **First 90 days** | Plan, close | 0:45 | Listen, ship one thing, prove it |

The tour does two things itself: it clicks **At risk** on Customer Radar, and it asks **"Which customers are at risk?"** in Command Center. Narrate them ("watch, it filters for us").

**Invite one interaction:** on "Every insight ends in a button," have them click **Done**. Spotlighted elements are fully clickable.

---

## Talk track for the strategy chapters (in your own words)

### MCP servers: why
- Without a standard, every bot integrates every system: 4 bots × 5 systems is 20 integrations, each with its own security review. With MCP it's 4 + 5.
- **Read and write are separate contracts.** Start read-only and add scoped writes per use case, with logs.
- **Engineering owns the plumbing, CX owns the behavior.** That's the clean seam that keeps CX out of the engineering queue.
- Vendors and models stay swappable: Fin today, a custom agent tomorrow, and the connectors don't change.

### Skills: why
- A skill is a folder of instructions, examples, scripts, and an eval that an agent loads when relevant.
- It's how the best CSM's judgment reaches every account, not just the ones she has time for.
- Reviewed like code. **No skill ships without an eval.** Keep them small and composable.

### Recurring automations: why
- The checks nobody remembers to run: hourly device-offline sweep, daily CSM brief, weekly churn digest, renewal T-120/90/60 packs.
- **Read automatically, write with approval.** Every automation has an owner, a metric, and a kill switch.
- The device-offline sweep is your strongest example for connected hardware. It's proactive support before the customer notices.

### Pitching to engineering and product
- Bring evidence, not a roadmap request: a prototype, an eval baseline, shadow-mode results.
- **The ask ladder:** nothing → read-only scopes → a webhook and one scoped write → co-own the platform. Each rung is earned with the last rung's results.
- Answer their real questions. Engineering: "Who maintains it? What can it touch? What pages us?" Product: "Does this pull from the roadmap?"
- **Give before you ask:** product gets a weekly friction report from bot conversations.

### Not deprioritizing everything else
- Capacity is explicit: 70 run / 20 build / 10 explore.
- SLA, CSAT, and GRR are a floor. If they slip, building pauses.
- Shadow mode first, one queue with a holdout, automations that don't give time back by day 60 get cut, retire before adding.

---

## Questions to prepare for (answer honestly)

- **"Is that an LLM?"** No. The tour says so on the Command Center step. It's an intent engine, and a Claude-backed version is wired into the code but switched off for the demo. Pivot to the 3/10 eval baseline.
- **"Did you build this yourself?"** The product is yours. The walkthrough and the Claude integration were built with an AI coding agent, which the MCP slide says openly. Frame it as the point: "this is how I'd work in the role."
- **"Why is the data mocked?"** It's a portfolio product. The account layer is real (sign up → a real database workspace); integrations are the next step.
- **"How would you know if a bot regressed?"** Re-run the eval on every prompt or model change; every real failure becomes a new case.
- **"Why not just buy Fin or Zendesk AI?"** You would, for commodity deflection. Build the parts that need your own data: health scoring, renewal workflows, telemetry-driven outreach. MCP keeps both options open.
- **"What would you cut if you had to?"** Explore before Build, and Build before Run. The core metrics are the floor.

## If something breaks live
- Tooltip says the element isn't visible → widen the window.
- Page blank or slow → it's compiling on first load. Wait about 5 seconds; the tour waits for the page too.
- Anything odd → `Esc`, then reopen the walkthrough and jump to the chapter from the bottom bar.
