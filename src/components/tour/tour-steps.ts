// Content for the guided interview walkthrough.
//
// Two kinds of step:
//  - "spotlight": navigates to `route`, dims the page, and highlights the element tagged data-tour={target}.
//  - "scene":     a full-screen animated slide (rendered by tour-scenes.tsx) for the strategy chapters.
//
// `say` is a presenter note — hidden by default, toggled with the N key, so it never shows on a shared screen by accident.

export type SceneKey =
  | "intro"
  | "architecture"
  | "measure"
  | "mcp"
  | "skills"
  | "automations"
  | "pitch"
  | "priorities"
  | "plan"
  | "close";

export type Placement = "right" | "left" | "top" | "bottom";

interface BaseStep {
  id: string;
  chapter: ChapterKey;
  title: string;
  say?: string;
}

export interface SpotlightStep extends BaseStep {
  kind: "spotlight";
  route: string;
  target: string;
  body: string;
  cx?: string;
  placement?: Placement;
  /** data-tour target to click before highlighting — the tour drives the UI so the viewer sees it happen. */
  click?: string;
}

export interface SceneStep extends BaseStep {
  kind: "scene";
  scene: SceneKey;
  eyebrow: string;
  lede: string;
}

export type TourStep = SpotlightStep | SceneStep;

export type ChapterKey = "opening" | "product" | "ai" | "build" | "buyin" | "plan";

export const chapters: { key: ChapterKey; label: string }[] = [
  { key: "opening", label: "Opening" },
  { key: "product", label: "The product" },
  { key: "ai", label: "The AI layer" },
  { key: "build", label: "How I build" },
  { key: "buyin", label: "Getting buy-in" },
  { key: "plan", label: "First 90 days" },
];

export const tourSteps: TourStep[] = [
  // ── Opening ────────────────────────────────────────────────────────────────
  {
    id: "intro",
    kind: "scene",
    chapter: "opening",
    scene: "intro",
    eyebrow: "Guided walkthrough · about 12 minutes",
    title: "Ground Control",
    lede: "A product I designed and built, and the operating model I'd bring to customer experience: see it, see how it's wired, then how I'd run it.",
    say: "I built this for solo founders, but every surface maps to a CX problem. I'll call out the parallel as we go, then spend the second half on how I'd build and run the AI layer for your team.",
  },

  // ── The product ────────────────────────────────────────────────────────────
  {
    id: "nav",
    kind: "spotlight",
    chapter: "product",
    route: "/morning-brief",
    target: "nav",
    placement: "right",
    title: "Five questions, five surfaces",
    body: "What changed, who needs me, where's the money, what's unfinished, and ask anything. Navigation mirrors the questions a person has, not the tables in the database.",
    cx: "A CSM starts every day asking these same five questions about their book of business.",
    say: "Design principle one: organize around the user's questions, not the data model.",
  },
  {
    id: "brief",
    kind: "spotlight",
    chapter: "product",
    route: "/morning-brief",
    target: "brief-summary",
    placement: "bottom",
    title: "The brief writes itself",
    body: "The day starts with a narrative, not a dashboard: what needs attention, ranked by consequence, with the fastest revenue move named.",
    cx: "A daily brief per book of business, produced by a recurring automation instead of someone pulling reports.",
    say: "Dashboards make people do the synthesis. The brief does it for them, then links to the evidence.",
  },
  {
    id: "brief-metrics",
    kind: "spotlight",
    chapter: "product",
    route: "/morning-brief",
    target: "brief-metrics",
    placement: "bottom",
    title: "Four numbers, each a door",
    body: "Each metric has a home where you can act on it. A number you can't act on is decoration.",
    say: "I deliberately capped this at four. Every extra tile dilutes the ones that matter.",
  },
  {
    id: "top-moves",
    kind: "spotlight",
    chapter: "product",
    route: "/morning-brief",
    target: "brief-first-move",
    placement: "bottom",
    title: "Every insight ends in a button",
    body: "Done, Snooze, Draft. The goal is to shrink the distance between noticing something and handling it. It's live, so go ahead and click Done.",
    cx: "A health alert should open the play, not just turn a dot red.",
    say: "Invite them to click Done. The completion animation is intentional: closing loops should feel good.",
  },
  {
    id: "radar-metrics",
    kind: "spotlight",
    chapter: "product",
    route: "/customer-radar",
    target: "radar-metrics",
    placement: "bottom",
    title: "Relationship health at a glance",
    body: "Total relationships, who needs a reply, VIPs, and who's at risk: the shape of the whole book before you look at anyone in it.",
    cx: "Swap these for portfolio health: accounts green, amber, and red, plus renewals in the next 120 days.",
  },
  {
    id: "radar-filters",
    kind: "spotlight",
    chapter: "product",
    route: "/customer-radar",
    target: "radar-filters",
    placement: "bottom",
    title: "Filters are health segments",
    body: "At risk, waiting on me, no touch in 30+ days. Each filter is a segment that needs a different play, not just a way to sort.",
    say: "'No touch 30+ days' is the one I'd automate first. Silence predicts churn better than complaints do.",
  },
  {
    id: "radar-elena",
    kind: "spotlight",
    chapter: "product",
    route: "/customer-radar",
    click: "radar-filter-at-risk",
    target: "customer-cus_elena",
    placement: "right",
    title: "Quiet churn, caught early",
    body: "Elena bought every month for a year, then went silent for 61 days. No complaint, no ticket: the most dangerous kind of churn, and the kind a ticket queue never sees.",
    cx: "In connected hardware, it's the fleet whose devices quietly stop syncing. Usage drops long before the renewal conversation does.",
    say: "The tour just clicked 'At risk' for us. This is the moment to land the telemetry point. It's their bonus criterion.",
  },
  {
    id: "radar-fields",
    kind: "spotlight",
    chapter: "product",
    route: "/customer-radar",
    target: "customer-cus_elena-stats",
    placement: "right",
    title: "Three fields, chosen on purpose",
    body: "What they're worth, how long since we spoke, and where they are. Everything else (timeline, last message, suggested reply) is one click deeper.",
    say: "Progressive disclosure: the card answers 'should I care?', and the drawer answers 'what do I say?'",
  },
  {
    id: "money-move",
    kind: "spotlight",
    chapter: "product",
    route: "/money-watch",
    target: "money-insight",
    placement: "bottom",
    title: "Ranked by how fast money lands",
    body: "It doesn't just list revenue. It names the single fastest move and the dollars behind it.",
    cx: "This is CS as a revenue engine: renewals, expansion, and collections in one ranked queue, which is where NRR gets managed day to day.",
  },
  {
    id: "money-opps",
    kind: "spotlight",
    chapter: "product",
    route: "/money-watch",
    target: "money-opportunities",
    placement: "left",
    title: "Expansion, not just retention",
    body: "Each warm opportunity has a value and an exact next action. Retention protects the base; expansion is what makes NRR a growth number.",
    say: "Tie this to their brief: they want CX as a growth engine, not a cost center. This is the screen that says so.",
  },
  {
    id: "loops",
    kind: "spotlight",
    chapter: "product",
    route: "/open-loops",
    target: "loops-col-today",
    placement: "right",
    title: "Nothing quietly drifts",
    body: "Every follow-up has a home, a due bucket, and a dollar value, with urgent, revenue-tied work at the top of Today. Blocked work gets its own column, because blocked isn't the same as forgotten.",
    cx: "The same board works for escalations: owner, due date, revenue at stake, and who's blocking.",
  },

  // ── The AI layer ───────────────────────────────────────────────────────────
  {
    id: "ask",
    kind: "spotlight",
    chapter: "ai",
    route: "/command-center",
    target: "cc-input",
    placement: "bottom",
    title: "Ask the business",
    body: "In this demo, an intent engine maps each question to an answer built from the same data. A Claude-backed version is wired into the code; it's switched off here so the demo has no external dependencies.",
    say: "Be explicit that this isn't an LLM in the demo. Saying it first earns credibility for everything that follows.",
  },
  {
    id: "ask-answer",
    kind: "spotlight",
    chapter: "ai",
    route: "/command-center",
    click: "cc-suggest-risk",
    target: "cc-response",
    placement: "right",
    title: "Answer, evidence, action",
    body: "Every answer carries its supporting signals and a button to the screen where you act. The rule: the assistant never ends a conversation at a dead end.",
    cx: "That's the deflection pattern: answer, show your work, hand off to the right place, human or screen.",
  },
  {
    id: "architecture",
    kind: "scene",
    chapter: "ai",
    scene: "architecture",
    eyebrow: "The AI layer · architecture",
    title: "How I'd wire AI into CX",
    lede: "One connector layer, one set of guardrails, many bots. Support, onboarding, health, and renewals all sit on the same foundation.",
    say: "Walk left to right: systems of record, MCP connectors, the agent with its skills, the approval gate, outcomes. The gate is the part leadership cares about.",
  },
  {
    id: "measure",
    kind: "scene",
    chapter: "ai",
    scene: "measure",
    eyebrow: "The AI layer · proof",
    title: "Every metric gets a guardrail",
    lede: "Deflection is easy to inflate. I pair every efficiency metric with a quality metric that can veto it.",
    say: "The 3-out-of-10 is my own bot's honest baseline. Measuring yourself before you upgrade is the habit they're hiring for.",
  },

  // ── How I build ────────────────────────────────────────────────────────────
  {
    id: "mcp",
    kind: "scene",
    chapter: "build",
    scene: "mcp",
    eyebrow: "How I build · MCP servers",
    title: "Integrate once, reuse everywhere",
    lede: "MCP servers are standard connectors between an AI agent and a system like Zendesk, Salesforce, or device telemetry. Build each one once, and every bot can use it.",
    say: "The N-times-M point lands with engineering leaders. It turns 'CX wants integrations' into 'CX wants a platform you build once'.",
  },
  {
    id: "skills",
    kind: "scene",
    chapter: "build",
    scene: "skills",
    eyebrow: "How I build · skills",
    title: "Your best CSM's playbook, versioned",
    lede: "A skill is a small folder of instructions, examples, and scripts that an agent loads when the task calls for it. It's how good judgment scales past the people who have it.",
    say: "Skills are where CX expertise lives. Engineering doesn't need to write them, and shouldn't.",
  },
  {
    id: "automations",
    kind: "scene",
    chapter: "build",
    scene: "automations",
    eyebrow: "How I build · recurring automations",
    title: "The work that shouldn't depend on memory",
    lede: "Scheduled agents run the checks nobody remembers to run: hourly, daily, weekly, and tied to the renewal calendar. They read automatically and write only with approval.",
    say: "The device-offline sweep is the one to linger on. It's proactive support for frontline customers before they even notice.",
  },

  // ── Getting buy-in ─────────────────────────────────────────────────────────
  {
    id: "pitch",
    kind: "scene",
    chapter: "buyin",
    scene: "pitch",
    eyebrow: "Getting buy-in · engineering & product",
    title: "Bring evidence, not a roadmap request",
    lede: "Engineering and product have full roadmaps. The pitch that works asks for the smallest possible thing, proves value first, and gives something back.",
    say: "The key line: 'I'm not asking for headcount or a roadmap slot. I'm asking for read-only scopes, and I'll bring you shadow-mode results in four weeks.'",
  },
  {
    id: "priorities",
    kind: "scene",
    chapter: "buyin",
    scene: "priorities",
    eyebrow: "Getting buy-in · protecting the core",
    title: "Building without dropping the ball",
    lede: "The AI roadmap never comes at the expense of the customers you already have. The core metrics are a floor, not a trade-off.",
    say: "If they ask how I'd balance running the team and building: this slide is the answer. Capacity is explicit, and the AI work has to earn its share.",
  },

  // ── First 90 days ──────────────────────────────────────────────────────────
  {
    id: "plan",
    kind: "scene",
    chapter: "plan",
    scene: "plan",
    eyebrow: "First 90 days",
    title: "Listen, ship one thing, prove it",
    lede: "Baseline before building. One queue, one bot, one health score, in shadow mode first, then live with a holdout.",
  },
  {
    id: "close",
    kind: "scene",
    chapter: "plan",
    scene: "close",
    eyebrow: "Thank you",
    title: "Questions?",
    lede: "Everything you've seen is live. Press Esc to explore it yourself, or ask me to open anything up.",
  },
];

export function chapterOf(index: number) {
  return chapters.findIndex((c) => c.key === tourSteps[index]?.chapter);
}

export function firstStepOfChapter(key: ChapterKey) {
  return tourSteps.findIndex((s) => s.chapter === key);
}
