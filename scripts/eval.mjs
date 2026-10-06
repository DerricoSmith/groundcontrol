// Resolution-accuracy eval for the Command Center assistant.
//
// Sends each question to the running app's /api/ask endpoint, once per engine
// ("rules" = the original keyword matcher, "auto" = Claude with rule-engine fallback),
// and grades each answer against facts taken from the demo seed data.
//
// Usage:  npm run dev   (in another terminal)
//         npm run eval                 # both engines
//         npm run eval -- --engine=auto
//
// A case passes when every `mustInclude` group has at least one alternative present
// (case-insensitive, commas stripped) and the routed action matches `action` when given.

import { mkdirSync, writeFileSync } from "node:fs";

const BASE_URL = process.env.EVAL_BASE_URL ?? "http://localhost:3000";
const engineArg = process.argv.find((a) => a.startsWith("--engine="))?.split("=")[1];
const ENGINES = engineArg ? [engineArg] : ["rules", "auto"];

// Claude Opus 5.5 list prices, USD per million tokens.
const PRICE = { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 };

const CASES = [
  {
    id: "money-stuck",
    question: "Where is money stuck?",
    mustInclude: [["7320"], ["carvalho"]],
    action: "/money-watch",
  },
  {
    id: "at-risk",
    question: "Which customers are at risk?",
    mustInclude: [["northline"], ["elena"]],
    action: "/customer-radar",
  },
  {
    id: "hottest-lead",
    question: "Which open opportunity is worth the most, and what's it worth?",
    mustInclude: [["mira"], ["6800"]],
  },
  {
    id: "draft-reply",
    question: "Draft a reply to the delayed order customer.",
    mustInclude: [["kenji"]],
    requireDraft: true,
  },
  {
    id: "launch-deadline",
    question: "How far behind is the Northline order, and when is their deadline?",
    mustInclude: [["4 days", "four days"], ["30th", "30"]],
  },
  {
    id: "vendor-blocked",
    question: "Which vendor is waiting on me, and for what?",
    mustInclude: [["tanaka"], ["proof", "artwork", "sign-off", "approv"]],
  },
  {
    id: "specific-invoice",
    question: "How much is the Kessler Studio invoice and when is it due?",
    mustInclude: [["7500"], ["9 days", "nine days"]],
  },
  {
    id: "renewal-count",
    question: "How many community members are up for renewal in the next window?",
    mustInclude: [["38"]],
  },
  {
    id: "out-of-scope",
    question: "What is Tesla's stock price today?",
    mustInclude: [["don't have", "do not have", "doesn't include", "does not include", "not in", "no data", "can't", "cannot", "isn't in", "outside"]],
  },
  {
    id: "unknown-customer",
    question: "What did Bartholomew Quince order last week?",
    mustInclude: [["don't have", "do not have", "no record", "no customer", "not in", "doesn't include", "does not include", "isn't in", "can't find", "no one", "not find"]],
  },
];

const normalize = (s) => s.toLowerCase().replace(/,/g, "").replace(/[‘’]/g, "'");

function grade(c, res) {
  const haystack = normalize([res.answer, ...(res.signals ?? []), res.draftTarget ?? ""].join(" \n "));
  const missing = c.mustInclude.filter((group) => !group.some((alt) => haystack.includes(normalize(alt))));
  const failures = missing.map((g) => `missing "${g[0]}"`);
  if (c.action && res.actionHref !== c.action) failures.push(`routed to ${res.actionHref}, expected ${c.action}`);
  if (c.requireDraft && !res.draftTarget) failures.push("no draft reply");
  return failures;
}

async function ask(question, engine) {
  const res = await fetch(`${BASE_URL}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, engine }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from /api/ask`);
  return res.json();
}

function cost(meta) {
  if (meta?.source !== "claude") return 0;
  return (
    ((meta.inputTokens ?? 0) * PRICE.input +
      (meta.outputTokens ?? 0) * PRICE.output +
      (meta.cacheReadTokens ?? 0) * PRICE.cacheRead +
      (meta.cacheWriteTokens ?? 0) * PRICE.cacheWrite) /
    1e6
  );
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

const report = { ranAt: new Date().toISOString(), baseUrl: BASE_URL, engines: {} };

for (const engine of ENGINES) {
  console.log(`\n=== engine: ${engine} ===`);
  const rows = [];
  for (const c of CASES) {
    const res = await ask(c.question, engine);
    const failures = grade(c, res);
    rows.push({ id: c.id, pass: failures.length === 0, failures, source: res.meta?.source, latencyMs: res.meta?.latencyMs ?? 0, cost: cost(res.meta), fallbackReason: res.meta?.fallbackReason, answer: res.answer });
    console.log(`${failures.length === 0 ? "PASS" : "FAIL"}  ${c.id.padEnd(18)} ${res.meta?.source ?? "?"}  ${failures.join("; ")}`);
  }

  const passed = rows.filter((r) => r.pass).length;
  const fellBack = rows.filter((r) => engine === "auto" && r.source === "rules");
  const summary = {
    resolutionAccuracy: `${passed}/${rows.length} (${Math.round((passed / rows.length) * 100)}%)`,
    medianLatencyMs: median(rows.map((r) => r.latencyMs)),
    totalCostUsd: Number(rows.reduce((s, r) => s + r.cost, 0).toFixed(4)),
    fallbacks: fellBack.length,
  };
  console.log(`\nResolution accuracy: ${summary.resolutionAccuracy}`);
  console.log(`Median latency: ${summary.medianLatencyMs} ms   Total cost: $${summary.totalCostUsd}`);
  if (fellBack.length) console.log(`Note: ${fellBack.length} answers came from the rule engine (${fellBack[0].fallbackReason ?? "no ANTHROPIC_API_KEY set"}).`);
  report.engines[engine] = { summary, rows };
}

mkdirSync("eval-results", { recursive: true });
const file = `eval-results/eval-${report.ranAt.replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify(report, null, 2));
console.log(`\nFull results written to ${file}`);
