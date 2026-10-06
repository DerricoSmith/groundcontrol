"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Check,
  Compass,
  Eye,
  FileCode,
  Flag,
  Folder,
  Gauge,
  Layers,
  LifeBuoy,
  Megaphone,
  MessageSquareText,
  Plug,
  Rocket,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTour } from "./tour-provider";
import type { SceneKey } from "./tour-steps";

const EASE = [0.2, 0.7, 0.3, 1] as const;
const list = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };

const ink = { fill: "var(--text-primary)" };
const inkMuted = { fill: "var(--text-muted)" };

export function TourScene({ scene }: { scene: SceneKey }) {
  switch (scene) {
    case "intro":
      return <IntroScene />;
    case "architecture":
      return <ArchitectureScene />;
    case "measure":
      return <MeasureScene />;
    case "mcp":
      return <McpScene />;
    case "skills":
      return <SkillsScene />;
    case "automations":
      return <AutomationsScene />;
    case "pitch":
      return <PitchScene />;
    case "priorities":
      return <PrioritiesScene />;
    case "plan":
      return <PlanScene />;
    case "close":
      return <CloseScene />;
  }
}

/* ───────────────────────── shared pieces ───────────────────────── */

function Principle({ icon: Icon, title, body, tone = "brand" }: { icon: LucideIcon; title: string; body: string; tone?: "brand" | "positive" | "warning" }) {
  return (
    <motion.div variants={item} className="flex gap-3 rounded-2xl border border-border bg-surface-soft p-4">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          tone === "brand" && "bg-brand-soft text-brand",
          tone === "positive" && "bg-positive-soft text-positive",
          tone === "warning" && "bg-warning-soft text-warning"
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold leading-snug text-text-primary">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{body}</p>
      </div>
    </motion.div>
  );
}

function Draw({ d, delay = 0, className, flow = false }: { d: string; delay?: number; className?: string; flow?: boolean }) {
  return (
    <>
      <motion.path
        d={d}
        fill="none"
        strokeWidth={1.5}
        className={className ?? "stroke-border-strong"}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay, ease: "easeInOut" }}
      />
      {flow && (
        <motion.path
          d={d}
          fill="none"
          strokeWidth={2}
          className="tour-flow stroke-brand"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ delay: delay + 0.7, duration: 0.4 }}
        />
      )}
    </>
  );
}

/* ───────────────────────── intro ───────────────────────── */

const pillars = [
  { title: "See it", body: "The product, live: four surfaces and an assistant, each mapped to a CX problem you have today." },
  { title: "How it's wired", body: "MCP servers, skills, and recurring automations: how I build AI that stays maintainable after launch." },
  { title: "How I'd run it", body: "Winning over engineering and product, protecting the core business, and the first 90 days." },
];

const blips = [
  { name: "Kenji Mori", detail: "Order stuck 4 days", tone: "bg-warning", x: 20, y: 20 },
  { name: "Elena Voss", detail: "Quiet for 61 days", tone: "bg-danger", x: 80, y: 30 },
  { name: "Northline Goods", detail: "Launch at risk", tone: "bg-danger", x: 26, y: 62 },
  { name: "Mira Studio", detail: "Hot lead · $6.8k", tone: "bg-positive", x: 74, y: 76 },
];

function IntroScene() {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
      <motion.ol variants={list} initial="hidden" animate="show" className="space-y-3">
        {pillars.map((p, i) => (
          <motion.li key={p.title} variants={item} className="flex gap-4 rounded-2xl border border-border bg-surface-soft p-4 sm:p-5">
            <span className="font-serif text-[30px] leading-none text-brand">0{i + 1}</span>
            <div>
              <p className="text-[15.5px] font-semibold text-text-primary">{p.title}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-text-secondary">{p.body}</p>
            </div>
          </motion.li>
        ))}
        <motion.li variants={item} className="flex flex-wrap gap-2 pt-1 text-[12px] text-text-muted">
          <span className="rounded-full border border-border px-2.5 py-1">→ / Enter to advance</span>
          <span className="rounded-full border border-border px-2.5 py-1">← to go back</span>
          <span className="rounded-full border border-border px-2.5 py-1">Click any chapter below</span>
        </motion.li>
      </motion.ol>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
        className="relative mx-auto aspect-square w-full max-w-[340px]"
        aria-hidden
      >
        {[0, 14, 28, 40].map((inset) => (
          <div key={inset} className="absolute rounded-full border border-brand/20" style={{ inset: `${inset}%` }} />
        ))}
        <div className="absolute left-1/2 top-0 h-full w-px bg-brand/10" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-brand/10" />
        <div
          className="tour-sweep absolute inset-0 rounded-full"
          style={{ background: "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--brand) 40%, transparent) 55deg, transparent 62deg)" }}
        />
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand shadow-[0_0_20px_var(--brand)]" />
        {blips.map((b, i) => (
          <motion.div
            key={b.name}
            className="absolute"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + i * 0.25, type: "spring", stiffness: 300, damping: 18 }}
          >
            <span className={cn("tour-ping absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full opacity-60", b.tone)} />
            <span className={cn("absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full ring-2 ring-surface", b.tone)} />
            <span
              className={cn(
                "absolute top-3 whitespace-nowrap rounded-lg border border-border bg-surface px-2 py-1 text-[10.5px] leading-tight shadow-sm",
                b.x > 50 ? "right-0" : "left-0"
              )}
            >
              <span className="block font-semibold text-text-primary">{b.name}</span>
              <span className="text-text-muted">{b.detail}</span>
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/* ───────────────────────── architecture ───────────────────────── */

const sources = [
  ["Zendesk / Intercom", "tickets, conversations"],
  ["Salesforce / HubSpot", "accounts, renewals"],
  ["Device telemetry", "uptime, sync, firmware"],
  ["Product analytics", "usage, adoption"],
  ["Billing", "invoices, plan, seats"],
  ["Slack", "escalations, alerts"],
];
const skills = ["ticket-triage", "health-review", "renewal-prep", "qbr-draft"];
const outcomes = [
  ["Deflect & resolve", "support"],
  ["Score health", "customer success"],
  ["Prep renewals", "revenue"],
  ["Alert the CSM", "the team"],
];

function ArchitectureScene() {
  const sy = (i: number) => 15 + i * 64 + 25; // source row centers
  const oy = (i: number) => 40 + i * 92 + 30; // outcome row centers
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface-soft p-3 sm:p-5">
        <svg viewBox="0 0 1000 400" className="min-w-[720px]" role="img" aria-label="Systems of record connect through MCP servers to an agent with skills, through a human approval gate, to outcomes">
          {/* column labels */}
          {[
            [95, "Systems of record"],
            [310, "Connectors"],
            [540, "Agent + skills"],
            [718, "Guardrail"],
            [890, "Outcomes"],
          ].map(([x, label]) => (
            <text key={label as string} x={x as number} y={8} textAnchor="middle" fontSize={11} fontWeight={600} letterSpacing={1} style={inkMuted}>
              {(label as string).toUpperCase()}
            </text>
          ))}

          {/* wires: sources → MCP */}
          {sources.map((_, i) => (
            <Draw key={`s${i}`} d={`M180 ${sy(i)} H250`} delay={0.5 + i * 0.05} flow />
          ))}
          {/* MCP → agent */}
          {[160, 200, 240].map((y, i) => (
            <Draw key={`m${i}`} d={`M370 ${y} H440`} delay={0.9 + i * 0.05} flow />
          ))}
          {/* agent → gate → outcomes */}
          {outcomes.map((_, i) => (
            <Draw key={`o${i}`} d={`M640 200 C670 200 670 ${oy(i)} 700 ${oy(i)} M736 ${oy(i)} H790`} delay={1.3 + i * 0.06} flow />
          ))}

          {/* sources */}
          {sources.map(([name, sub], i) => (
            <motion.g key={name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
              <rect x={10} y={15 + i * 64} width={170} height={50} rx={12} className="fill-surface stroke-border" />
              <text x={24} y={36 + i * 64} fontSize={13} fontWeight={600} style={ink}>
                {name}
              </text>
              <text x={24} y={53 + i * 64} fontSize={11} style={inkMuted}>
                {sub}
              </text>
            </motion.g>
          ))}

          {/* MCP layer */}
          <motion.g initial={{ opacity: 0, scaleY: 0.6 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ delay: 0.4, duration: 0.5 }} style={{ transformOrigin: "310px 200px" }}>
            <rect x={250} y={15} width={120} height={370} rx={16} className="fill-brand-soft stroke-brand" strokeOpacity={0.4} />
            {sources.map((_, i) => (
              <circle key={i} cx={250} cy={sy(i)} r={4} className="fill-brand" />
            ))}
            <text x={310} y={182} textAnchor="middle" fontSize={15} fontWeight={700} className="fill-brand">
              MCP
            </text>
            <text x={310} y={200} textAnchor="middle" fontSize={11} style={ink}>
              servers
            </text>
            <text x={310} y={224} textAnchor="middle" fontSize={10.5} style={inkMuted}>
              read-only by default
            </text>
            <text x={310} y={239} textAnchor="middle" fontSize={10.5} style={inkMuted}>
              writes scoped + logged
            </text>
          </motion.g>

          {/* agent */}
          <motion.g initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.75, type: "spring", stiffness: 200, damping: 18 }} style={{ transformOrigin: "540px 200px" }}>
            <rect x={440} y={100} width={200} height={200} rx={20} className="fill-surface stroke-brand" strokeWidth={2} />
            <text x={540} y={132} textAnchor="middle" fontSize={16} fontWeight={700} style={ink}>
              Agent
            </text>
            <text x={540} y={150} textAnchor="middle" fontSize={11} style={inkMuted}>
              LLM + instructions
            </text>
            {skills.map((s, i) => (
              <g key={s}>
                <rect x={456 + (i % 2) * 88} y={170 + Math.floor(i / 2) * 50} width={80} height={38} rx={10} className="fill-brand-soft" />
                <text x={496 + (i % 2) * 88} y={193 + Math.floor(i / 2) * 50} textAnchor="middle" fontSize={10} fontWeight={600} className="fill-brand">
                  {s}
                </text>
              </g>
            ))}
          </motion.g>

          {/* approval gate */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }}>
            <rect x={700} y={15} width={36} height={370} rx={12} className="fill-warning-soft stroke-warning" strokeOpacity={0.5} />
            <text x={718} y={200} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-warning" transform="rotate(-90 718 200)">
              HUMAN APPROVAL · ANYTHING CUSTOMER-FACING
            </text>
          </motion.g>

          {/* outcomes */}
          {outcomes.map(([name, sub], i) => (
            <motion.g key={name} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 + i * 0.08 }}>
              <rect x={790} y={40 + i * 92} width={200} height={60} rx={14} className="fill-surface stroke-border" />
              <circle cx={812} cy={oy(i)} r={5} className="fill-positive" />
              <text x={826} y={oy(i) - 3} fontSize={13.5} fontWeight={600} style={ink}>
                {name}
              </text>
              <text x={826} y={oy(i) + 14} fontSize={11} style={inkMuted}>
                {sub}
              </text>
            </motion.g>
          ))}
        </svg>
      </div>

      <motion.div variants={list} initial="hidden" animate="show" className="mt-4 grid gap-3 md:grid-cols-3">
        <Principle icon={Plug} title="Connect once" body="Every bot shares the same connectors, so the fifth bot costs a fraction of the first." />
        <Principle icon={Layers} title="Expertise lives in skills" body="Plays and rubrics live in versioned skills, not in prompts scattered across five vendor tools." />
        <Principle icon={ShieldCheck} title="One approval gate" body="Nothing reaches a customer unreviewed until that workflow has earned trust on the numbers." tone="warning" />
      </motion.div>
    </div>
  );
}

/* ───────────────────────── measure ───────────────────────── */

const scorecard: { icon: LucideIcon; name: string; def: string; guard: string }[] = [
  { icon: LifeBuoy, name: "Deflection rate", def: "Contacts resolved without a human.", guard: "Only counts if CSAT and reopen rate hold." },
  { icon: Target, name: "Resolution accuracy", def: "A weekly graded sample of bot answers, scored against a rubric.", guard: "Every real failure becomes a new eval case." },
  { icon: MessageSquareText, name: "CSAT, bot vs. human", def: "The same contact reasons, compared side by side.", guard: "Reported per reason, never blended." },
  { icon: Gauge, name: "Cost per contact", def: "Fully loaded, escalations included.", guard: "Escalation cost counts against the bot." },
  { icon: Rocket, name: "Time to value", def: "Days from signature to the first fleet live.", guard: "Adoption checked at day 30, 60, and 90." },
  { icon: TrendingUp, name: "NRR and GRR", def: "Renewals plus expansion, by segment.", guard: "Expansion driven by health, not discounts." },
];

function MeasureScene() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <motion.div variants={list} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2">
        {scorecard.map((m) => (
          <motion.div key={m.name} variants={item} className="rounded-2xl border border-border bg-surface-soft p-4">
            <div className="flex items-center gap-2">
              <m.icon className="h-4 w-4 text-brand" />
              <p className="text-[14px] font-semibold text-text-primary">{m.name}</p>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-secondary">{m.def}</p>
            <p className="mt-2 flex items-start gap-1.5 text-[12px] font-medium text-warning">
              <ShieldCheck className="mt-[1px] h-3.5 w-3.5 shrink-0" /> {m.guard}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: EASE }}
        className="flex flex-col rounded-2xl border border-brand/20 bg-brand-soft p-5"
      >
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-brand">Proof from this demo</p>
        <p className="mt-2 text-[15px] font-semibold text-text-primary">I scored my own assistant before upgrading it.</p>
        <div className="mt-5 space-y-4">
          <div>
            <div className="flex justify-between text-[12.5px]">
              <span className="text-text-secondary">Intent engine (what you just saw)</span>
              <span className="font-semibold tabular-nums text-text-primary">3 / 10</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface">
              <motion.div className="h-full rounded-full bg-warning" initial={{ width: 0 }} animate={{ width: "30%" }} transition={{ delay: 1, duration: 1, ease: EASE }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[12.5px]">
              <span className="text-text-secondary">Bar to go live</span>
              <span className="font-medium text-text-muted">agreed with stakeholders</span>
            </div>
            <div className="relative mt-1.5 h-2.5 rounded-full border border-dashed border-brand/40 bg-surface">
              <motion.div className="absolute -top-1 h-[18px] w-0.5 rounded bg-brand" initial={{ left: "0%" }} animate={{ left: "85%" }} transition={{ delay: 1.3, duration: 0.9, ease: EASE }} />
            </div>
          </div>
        </div>
        <p className="mt-5 text-[13px] leading-relaxed text-text-secondary">
          It handled every scripted question and missed every off-script one, including two it should have declined. That baseline is the case for the LLM version, and the same 10 cases re-run on every change.
        </p>
      </motion.div>
    </div>
  );
}

/* ───────────────────────── MCP ───────────────────────── */

const bots = ["Support", "Onboarding", "Health", "Renewals"];
const systems = ["Tickets", "CRM", "Telemetry", "Billing", "Slack"];

function NetworkDiagram({ mode }: { mode: "tangle" | "hub" }) {
  const by = (i: number) => 30 + i * 46;
  const ty = (i: number) => 20 + i * 40;
  const lines: string[] = [];
  if (mode === "tangle") {
    bots.forEach((_, b) => systems.forEach((_, t) => lines.push(`M92 ${by(b)} L228 ${ty(t)}`)));
  } else {
    bots.forEach((_, b) => lines.push(`M92 ${by(b)} Q130 ${by(b)} 150 110`));
    systems.forEach((_, t) => lines.push(`M170 110 Q190 ${ty(t)} 228 ${ty(t)}`));
  }
  const base = mode === "tangle" ? 0.2 : 1.4;
  return (
    <svg viewBox="0 0 320 220" className="w-full" aria-hidden>
      {lines.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          strokeWidth={mode === "tangle" ? 1 : 1.75}
          className={mode === "tangle" ? "stroke-danger" : "stroke-brand"}
          strokeOpacity={mode === "tangle" ? 0.45 : 0.85}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: base + i * (mode === "tangle" ? 0.03 : 0.07), duration: 0.5 }}
        />
      ))}
      {mode === "hub" && (
        <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 16 }} style={{ transformOrigin: "160px 110px" }}>
          <rect x={136} y={92} width={48} height={36} rx={10} className="fill-brand" />
          <text x={160} y={115} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">
            MCP
          </text>
        </motion.g>
      )}
      {bots.map((b, i) => (
        <g key={b}>
          <rect x={4} y={by(i) - 13} width={88} height={26} rx={8} className="fill-surface stroke-border" />
          <text x={48} y={by(i) + 4} textAnchor="middle" fontSize={11} fontWeight={600} style={ink}>
            {b}
          </text>
        </g>
      ))}
      {systems.map((s, i) => (
        <g key={s}>
          <rect x={228} y={ty(i) - 13} width={88} height={26} rx={8} className="fill-surface stroke-border" />
          <text x={272} y={ty(i) + 4} textAnchor="middle" fontSize={11} style={ink}>
            {s}
          </text>
        </g>
      ))}
    </svg>
  );
}

function McpScene() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-danger/25 bg-danger-soft/50 p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[13px] font-semibold text-text-primary">Point-to-point</p>
            <p className="text-[12px] text-danger">4 bots × 5 systems = 20 integrations</p>
          </div>
          <NetworkDiagram mode="tangle" />
          <p className="text-[12px] text-text-secondary">Each bot or vendor re-integrates every system, and each one needs its own security review.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="rounded-2xl border border-brand/25 bg-brand-soft p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[13px] font-semibold text-text-primary">Through MCP</p>
            <p className="text-[12px] font-medium text-brand">4 + 5 = 9 connections</p>
          </div>
          <NetworkDiagram mode="hub" />
          <p className="text-[12px] text-text-secondary">Each system is connected and reviewed once. A new bot plugs into what&apos;s already there.</p>
        </motion.div>
      </div>

      <motion.div variants={list} initial="hidden" animate="show" className="grid gap-3 md:grid-cols-2">
        <Principle icon={Plug} title="Read and write are separate contracts" body="Every connector starts read-only. Write access, like updating a ticket or posting in Slack, is added per use case, scoped, and logged." />
        <Principle icon={Wrench} title="Engineering owns the plumbing, CX owns the behavior" body="Engineering reviews and hosts a connector once. CX iterates on prompts and workflows without filing tickets into their queue." />
        <Principle icon={Layers} title="Vendors and models stay swappable" body="Fin today, a custom agent tomorrow, a better model next quarter. The connectors don't change." />
        <Principle icon={ShieldCheck} title="Security reviews once, not per bot" body="One audited path to customer data, with permissions, rate limits, and logs in one place." />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="flex items-start gap-2 rounded-xl border border-border bg-surface-soft p-3 text-[12.5px] leading-relaxed text-text-secondary"
      >
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <span>
          <strong className="font-semibold text-text-primary">Practiced, not theoretical:</strong> this walkthrough was built with an AI coding agent that used MCP tools (a browser and a dev-server preview) and skills (an API reference). It&apos;s the same pattern, pointed at building software.
        </span>
      </motion.p>
    </div>
  );
}

/* ───────────────────────── skills ───────────────────────── */

const skillLines: { t: string; c?: string }[] = [
  { t: "---", c: "text-white/40" },
  { t: "name: renewal-risk-review", c: "text-[#a5b4fc]" },
  { t: "description: Use for any account within 120 days", c: "text-[#a5b4fc]" },
  { t: "  of renewal, or when health drops a band.", c: "text-[#a5b4fc]" },
  { t: "---", c: "text-white/40" },
  { t: "## Gather", c: "text-[#fbbf24]" },
  { t: "1. Usage trend, last 90 days (analytics MCP)" },
  { t: "2. Device uptime and sync failures (telemetry MCP)" },
  { t: "3. Open tickets and sentiment (Zendesk MCP)" },
  { t: "## Judge", c: "text-[#fbbf24]" },
  { t: "4. Score against rubric.md → green / amber / red" },
  { t: "5. Cite the evidence for every claim" },
  { t: "## Act", c: "text-[#fbbf24]" },
  { t: "6. Draft a CSM brief: risk, evidence, recommended play" },
  { t: "7. Never contact the customer. The CSM approves.", c: "text-[#86efac]" },
];

const library = ["ticket-triage", "how-to-answer", "device-troubleshoot", "health-review", "renewal-risk-review", "qbr-draft", "escalation-summary", "field-tech-handoff"];

function SkillsScene() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1124] font-mono text-[11.5px] leading-[1.7] text-white/85 shadow-xl"
      >
        <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#4ade80]" />
          <span className="ml-3 text-[11px] text-white/50">skills/renewal-risk-review/SKILL.md</span>
        </div>
        <div className="grid grid-cols-[1fr] sm:grid-cols-[132px_1fr]">
          <div className="hidden border-r border-white/10 px-3 py-3 text-[11px] text-white/60 sm:block">
            <p className="flex items-center gap-1.5 text-white/85">
              <Folder className="h-3 w-3" /> renewal-risk-review
            </p>
            {["SKILL.md", "rubric.md", "examples/", "evals/", "scripts/"].map((f, i) => (
              <motion.p key={f} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className={cn("mt-1 flex items-center gap-1.5 pl-3", i === 0 && "text-[#a5b4fc]")}>
                {f.endsWith("/") ? <Folder className="h-3 w-3" /> : <FileCode className="h-3 w-3" />} {f}
              </motion.p>
            ))}
          </div>
          <div className="overflow-x-auto px-4 py-3">
            {skillLines.map((l, i) => (
              <motion.p
                key={i}
                className={cn("whitespace-pre", l.c)}
                initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.35, ease: "easeOut" }}
              >
                {l.t}
              </motion.p>
            ))}
          </div>
        </div>
      </motion.div>

      <div>
        <motion.div variants={list} initial="hidden" animate="show" className="space-y-3">
          <Principle icon={Wrench} title="Owned by CX, reviewed like code" body="Changes go through review with a changelog. When a renewal play changes, the skill changes with it." />
          <Principle icon={Target} title="No skill ships without an eval" body="Each one comes with graded examples. If a change makes the scores worse, it doesn't merge." />
          <Principle icon={Layers} title="Small and composable" body="One job per skill. The support bot and the renewal agent share escalation-summary instead of each reinventing it." />
          <Principle icon={UsersRound} title="The team writes them with me" body="CSMs know the plays. I turn their judgment into skills, and they get the time back." tone="positive" />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-4 flex flex-wrap gap-1.5">
          {library.map((s) => (
            <span key={s} className={cn("rounded-full border px-2.5 py-1 font-mono text-[11px]", s === "renewal-risk-review" ? "border-brand/40 bg-brand-soft text-brand" : "border-border text-text-muted")}>
              {s}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ───────────────────────── automations ───────────────────────── */

const automations: { cadence: string; name: string; what: string; mode: "auto" | "approve" }[] = [
  { cadence: "Hourly", name: "Device-offline sweep", what: "Spot fleets with devices dropping offline and open a proactive ticket before the customer calls.", mode: "auto" },
  { cadence: "Daily · 6:00", name: "CSM book brief", what: "What changed in each CSM's accounts overnight: risks first, then the top three moves.", mode: "auto" },
  { cadence: "Daily", name: "Bot QA sample", what: "Grade a sample of bot-resolved conversations against the rubric and trend resolution accuracy.", mode: "auto" },
  { cadence: "Weekly · Mon", name: "Churn-risk digest", what: "Accounts that moved health bands, with the evidence, sent to CS leadership.", mode: "auto" },
  { cadence: "Weekly · Fri", name: "Voice-of-customer report", what: "Top friction themes from bot conversations, sent to product.", mode: "auto" },
  { cadence: "T-120 · 90 · 60", name: "Renewal prep pack", what: "Usage story, value delivered, and the expansion case, drafted for the account owner.", mode: "approve" },
  { cadence: "Monthly", name: "QBR drafts", what: "First drafts for top accounts, built from health and ticket history.", mode: "approve" },
];

function AutomationsScene() {
  return (
    <div>
      <div className="relative pl-6">
        <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border-strong" />
        <div className="tour-travel absolute left-[3px] h-[9px] w-[9px] rounded-full bg-brand shadow-[0_0_12px_var(--brand)]" />
        <motion.ul variants={list} initial="hidden" animate="show" className="space-y-2.5">
          {automations.map((a) => (
            <motion.li key={a.name} variants={item} className="relative grid items-center gap-x-4 gap-y-1 rounded-2xl border border-border bg-surface-soft px-4 py-3 sm:grid-cols-[150px_1fr_auto]">
              <span className="absolute -left-[22px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-surface bg-border-strong" />
              <span className="font-mono text-[12px] font-medium text-brand">{a.cadence}</span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-text-primary">{a.name}</p>
                <p className="text-[12.5px] leading-relaxed text-text-secondary">{a.what}</p>
              </div>
              <span
                className={cn(
                  "w-fit whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  a.mode === "auto" ? "bg-positive-soft text-positive" : "bg-warning-soft text-warning"
                )}
              >
                {a.mode === "auto" ? "Runs on its own" : "Drafts · human sends"}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="mt-4 flex flex-wrap gap-2">
        {["Reads automatically, writes with approval", "Every run logged and replayable", "Each one has an owner, a metric, and a kill switch"].map((r) => (
          <span key={r} className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-text-secondary">
            <Check className="h-3.5 w-3.5 text-positive" /> {r}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ───────────────────────── pitch ───────────────────────── */

const onePager = [
  ["Problem, sized", "Contacts by reason, cost per contact, and the churn tied to device downtime."],
  ["Evidence", "A working prototype, its eval baseline, and two weeks of shadow-mode results."],
  ["The smallest ask", "Read-only API scopes and one webhook. No headcount, no roadmap slot."],
  ["What we're not asking for", "No new infrastructure, no on-call rotation, no product changes."],
  ["Guardrails", "Data-access review, PII handling, human approval, and a kill switch."],
  ["Success and kill criteria", "The metric, the bar, and the date we'll decide by."],
];

const ladder = [
  { phase: "Phase 0", name: "Prove it in CX", ask: "Nothing" },
  { phase: "Phase 1", name: "Shadow mode", ask: "Read-only scopes" },
  { phase: "Phase 2", name: "One live queue", ask: "A webhook + one scoped write" },
  { phase: "Phase 3", name: "Scale", ask: "Co-own the platform" },
];

function PitchScene() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <motion.div
        initial={{ opacity: 0, rotate: -1.5, y: 16 }}
        animate={{ opacity: 1, rotate: 0, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="rounded-2xl border border-border bg-surface p-5 shadow-[0_18px_40px_-18px_rgba(5,7,18,0.35)]"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">One-page proposal</p>
        <p className="mt-1 font-serif text-[19px] font-medium text-text-primary">Proactive device-offline outreach: pilot</p>
        <motion.ol variants={list} initial="hidden" animate="show" className="mt-4 space-y-3">
          {onePager.map(([h, b], i) => (
            <motion.li key={h} variants={item} className="flex gap-3">
              <motion.span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-positive text-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.08, type: "spring", stiffness: 400, damping: 15 }}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </motion.span>
              <div>
                <p className="text-[13.5px] font-semibold text-text-primary">{h}</p>
                <p className="text-[12.5px] leading-relaxed text-text-secondary">{b}</p>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </motion.div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface-soft p-5">
          <p className="text-[13px] font-semibold text-text-primary">The ask ladder: earn each rung with results from the last</p>
          <div className="mt-4 flex h-[150px] items-end gap-2.5">
            {ladder.map((l, i) => (
              <div key={l.phase} className="flex h-full flex-1 flex-col justify-end">
                <motion.div
                  className="flex flex-col justify-end rounded-xl bg-gradient-to-t from-brand to-[color-mix(in_oklab,var(--brand)_55%,var(--accent-blue))] p-2 text-white"
                  initial={{ height: 0 }}
                  animate={{ height: `${28 + i * 24}%` }}
                  transition={{ delay: 0.4 + i * 0.18, duration: 0.6, ease: EASE }}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{l.phase}</span>
                </motion.div>
                <p className="mt-2 text-[12px] font-semibold leading-tight text-text-primary">{l.name}</p>
                <p className="text-[11.5px] leading-tight text-text-muted">Ask: {l.ask}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.div variants={list} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2">
          <motion.div variants={item} className="rounded-2xl border border-border bg-surface-soft p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-text-muted">Engineering asks</p>
            <p className="mt-1 text-[12.5px] italic text-text-secondary">&ldquo;Who maintains it? What can it touch? What pages us at 2am?&rdquo;</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-text-primary">CX maintains the behavior, connectors start read-only, and nothing goes on their on-call.</p>
          </motion.div>
          <motion.div variants={item} className="rounded-2xl border border-border bg-surface-soft p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-text-muted">Product asks</p>
            <p className="mt-1 text-[12.5px] italic text-text-secondary">&ldquo;Does this pull from the roadmap? What do we learn?&rdquo;</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-text-primary">No roadmap slot, and they get a weekly friction report from real conversations.</p>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="flex gap-3 rounded-2xl border border-positive/25 bg-positive-soft p-4">
          <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
          <p className="text-[13px] leading-relaxed text-text-primary">
            <strong className="font-semibold">Give before you ask.</strong> Bot conversations are the best voice-of-customer dataset in the company. Product gets it first, and engineering gets fewer escalations landing on their desk.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ───────────────────────── priorities ───────────────────────── */

const capacity = [
  { pct: 70, label: "Run", detail: "SLAs, renewals, escalations, the team", cls: "bg-brand" },
  { pct: 20, label: "Build", detail: "One bot, one score, one workflow at a time", cls: "bg-accent-blue" },
  { pct: 10, label: "Explore", detail: "New models, vendors, prototypes", cls: "bg-positive" },
];

function PrioritiesScene() {
  return (
    <div>
      <div className="rounded-2xl border border-border bg-surface-soft p-5">
        <p className="text-[13px] font-semibold text-text-primary">Team capacity, made explicit</p>
        <div className="mt-3 flex h-12 overflow-hidden rounded-xl">
          {capacity.map((c, i) => (
            <motion.div
              key={c.label}
              className={cn("flex items-center px-3 text-[13px] font-semibold text-white", c.cls)}
              initial={{ width: 0 }}
              animate={{ width: `${c.pct}%` }}
              transition={{ delay: 0.3 + i * 0.25, duration: 0.7, ease: EASE }}
            >
              <span className="truncate">
                {c.label} {c.pct}%
              </span>
            </motion.div>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {capacity.map((c) => (
            <p key={c.label} className="flex items-start gap-2 text-[12.5px] text-text-secondary">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", c.cls)} />
              <span>
                <strong className="font-semibold text-text-primary">{c.label}:</strong> {c.detail}
              </span>
            </p>
          ))}
        </div>
      </div>

      <motion.div variants={list} initial="hidden" animate="show" className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Principle icon={Flag} title="Core metrics are a floor" body="SLA, CSAT, and GRR get reported every week right next to the AI work. If they slip, building pauses." tone="warning" />
        <Principle icon={Eye} title="Shadow mode first" body="The bot drafts and humans send until accuracy clears the agreed bar." />
        <Principle icon={Scale} title="One queue, with a holdout" body="Launch on one queue with a control group, so the lift is measured, not assumed." />
        <Principle icon={Timer} title="Earn the capacity" body="Every automation has to give time back by day 60, or it gets cut." />
        <Principle icon={RotateCcw} title="Retire before adding" body="Each automation replaces a manual task. No new dashboards nobody reads." />
        <Principle icon={UsersRound} title="Upskill in the flow of work" body="CSMs propose skills and I build them with them, so the team gets AI-fluent by shipping." tone="positive" />
      </motion.div>
    </div>
  );
}

/* ───────────────────────── 30 / 60 / 90 ───────────────────────── */

const plan = [
  {
    days: "Days 1–30",
    name: "Listen and baseline",
    icon: Compass,
    items: [
      "Sit in on tickets and ride along with frontline customers",
      "Map contacts by reason, volume, and cost",
      "Baseline deflection, CSAT, cost per contact, GRR and NRR",
      "Pick the first queue and get read-only access",
    ],
  },
  {
    days: "Days 31–60",
    name: "Build in shadow",
    icon: Eye,
    items: [
      "First bot drafting answers on one queue, with an eval set",
      "Health score v1: usage + device telemetry + tickets",
      "Weekly churn-risk digest live for CS leadership",
      "Share shadow-mode results with engineering and product",
    ],
  },
  {
    days: "Days 61–90",
    name: "Ship and prove",
    icon: Rocket,
    items: [
      "Bot live on one queue with a holdout group",
      "Renewal T-120 prep automation running",
      "First expansion plays sourced from health data",
      "Report results, then make the next ask",
    ],
  },
];

function PlanScene() {
  return (
    <div>
      <div className="relative mb-5 hidden h-6 md:block">
        <div className="absolute left-[16.6%] right-[16.6%] top-1/2 h-0.5 -translate-y-1/2 bg-border" />
        <motion.div
          className="absolute left-[16.6%] top-1/2 h-0.5 -translate-y-1/2 bg-brand"
          initial={{ width: 0 }}
          animate={{ width: "66.8%" }}
          transition={{ delay: 0.3, duration: 1.6, ease: "easeInOut" }}
        />
        {[16.6, 50, 83.4].map((left, i) => (
          <motion.span
            key={left}
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-brand shadow-[0_0_0_3px_var(--brand-soft)]"
            style={{ left: `${left}%` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.75, type: "spring", stiffness: 400, damping: 15 }}
          />
        ))}
      </div>
      <motion.div variants={list} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-3">
        {plan.map((p) => (
          <motion.div key={p.days} variants={item} className="rounded-2xl border border-border bg-surface-soft p-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <p.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-mono text-[11.5px] font-medium text-brand">{p.days}</p>
                <p className="text-[15px] font-semibold text-text-primary">{p.name}</p>
              </div>
            </div>
            <ul className="mt-3.5 space-y-2">
              {p.items.map((it) => (
                <li key={it} className="flex gap-2 text-[13px] leading-relaxed text-text-secondary">
                  <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-positive" /> {it}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/* ───────────────────────── close ───────────────────────── */

function CloseScene() {
  const { goTo, stop } = useTour();
  const owned = ["Deflection", "Resolution accuracy", "CSAT", "Cost per contact", "Time to value", "NRR"];
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[1.2fr_1fr]">
      <motion.div variants={list} initial="hidden" animate="show" className="space-y-3">
        <Principle icon={Eye} title="I design for the decision, not the data" body="Every screen answers a question and ends in an action. That's the same bar I'd hold every bot to." />
        <Principle icon={Wrench} title="I build it myself, and measure it honestly" body="Connectors, skills, automations, evals. Including telling you when my own bot scores 3 out of 10." />
        <Principle icon={TrendingUp} title="I run CX as a growth engine" body="Protect the core, earn trust with evidence, and turn health data into renewals and expansion." tone="positive" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
        className="rounded-2xl border border-brand/20 bg-brand-soft p-6 text-center"
      >
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-brand">The numbers I&apos;d own</p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {owned.map((o, i) => (
            <motion.span
              key={o}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.08 }}
              className="rounded-full border border-brand/25 bg-surface px-3 py-1 text-[12.5px] font-medium text-text-primary"
            >
              {o}
            </motion.span>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => goTo(0)}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restart
          </button>
          <button onClick={stop} className="flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-hover">
            <Compass className="h-3.5 w-3.5" /> Explore on my own
          </button>
        </div>
      </motion.div>
    </div>
  );
}
