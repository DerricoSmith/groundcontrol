import { customers, invoices, risks, opportunities, openLoopsSeed, dailyBrief } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export interface AIResponse {
  question: string;
  answer: string;
  signals: string[];
  actionLabel: string;
  actionHref: string;
  draftTarget?: string;
}

const overdueInvoices = invoices.filter((i) => i.status === "overdue");
const overdueTotal = overdueInvoices.reduce((s, i) => s + i.amount, 0);
const needsReply = customers.filter((c) => c.needsReply);
const atRiskCustomers = customers.filter((c) => c.atRisk);
const urgentLoops = openLoopsSeed.filter((l) => l.priority === "urgent");
const topOpportunity = [...opportunities].sort((a, b) => b.value - a.value)[0];

function match(prompt: string, ...keywords: string[]) {
  const p = prompt.toLowerCase();
  return keywords.some((k) => p.includes(k));
}

export function getAIResponse(prompt: string): AIResponse {
  if (match(prompt, "overnight", "changed", "what happened")) {
    return {
      question: prompt,
      answer: dailyBrief.summary,
      signals: dailyBrief.chips.map((c) => c.label),
      actionLabel: "Open Morning Brief",
      actionHref: "/morning-brief",
    };
  }

  if (match(prompt, "follow up", "follow-up", "who do i need")) {
    const names = needsReply.slice(0, 4).map((c) => c.name);
    return {
      question: prompt,
      answer: `${needsReply.length} people are waiting on you right now. Start with ${names.slice(0, 3).join(", ")} — they're the ones with the clearest next step and the most upside if you act today.`,
      signals: needsReply.slice(0, 5).map((c) => `${c.name} — ${c.status.toLowerCase()}`),
      actionLabel: "Open Customer Radar",
      actionHref: "/customer-radar",
    };
  }

  if (match(prompt, "money", "stuck", "cash", "overdue")) {
    return {
      question: prompt,
      answer: `${formatCurrency(overdueTotal)} is stuck across ${overdueInvoices.length} overdue invoices. The biggest is Carvalho Consulting Group at ${formatCurrency(overdueInvoices[0]?.amount ?? 0)}, now 12 days late after two reminders — that one's worth a call instead of another email.`,
      signals: overdueInvoices.map((i) => `${i.client} — ${formatCurrency(i.amount)} overdue`),
      actionLabel: "Open Money Watch",
      actionHref: "/money-watch",
    };
  }

  if (match(prompt, "at risk", "at-risk", "churn", "risky")) {
    return {
      question: prompt,
      answer: `${atRiskCustomers.length} relationships need attention before they quietly become problems: ${risks.map((r) => r.customerName).join(", ")}. None of these are lost yet — they just need a human touch before they drift further.`,
      signals: risks.map((r) => `${r.customerName} — ${r.note}`),
      actionLabel: "Open Customer Radar",
      actionHref: "/customer-radar",
    };
  }

  if (match(prompt, "draft", "delayed order", "reply to")) {
    const kenji = customers.find((c) => c.id === "cus_kenji")!;
    return {
      question: prompt,
      answer: `Here's a draft for Kenji Mori, whose order has been stuck in transit for 4 days without a carrier scan:\n\n"${kenji.suggestedReply}"`,
      signals: ["Order #4821 — no carrier scan since Tuesday", "First message from Kenji in 6 days"],
      actionLabel: "Open Customer Radar",
      actionHref: "/customer-radar",
      draftTarget: kenji.suggestedReply,
    };
  }

  if (match(prompt, "summarize", "summary", "this week", "week")) {
    return {
      question: prompt,
      answer: `This week: revenue is trending up 18% month over month, led by consulting. You closed one wholesale payment from Bellweather & Finch, opened a hot lead with Mira Studio, and picked up an inbound partnership from Vela House. The drag is ${formatCurrency(overdueTotal)} still stuck in overdue invoices and a production delay on Northline's launch order.`,
      signals: ["Revenue +18% MoM", `${formatCurrency(overdueTotal)} stuck`, `${opportunities.length} warm opportunities open`],
      actionLabel: "Open Money Watch",
      actionHref: "/money-watch",
    };
  }

  if (match(prompt, "forget", "forgot", "miss", "missed")) {
    return {
      question: prompt,
      answer: `Nothing urgent has been dropped, but a few things are quietly aging: Apex Creative has been quiet for 34 days after a great retainer engagement, and June Park hasn't logged into the community in 22 days. Neither is on fire, but both are worth closing the loop on before they go cold.`,
      signals: ["Apex Creative — 34 days quiet", "June Park — 22 days inactive", "3 low-priority admin tasks pending"],
      actionLabel: "Open Open Loops",
      actionHref: "/open-loops",
    };
  }

  if (match(prompt, "first", "priorit", "should i do")) {
    return {
      question: prompt,
      answer: `Start with ${urgentLoops[0]?.title ?? "your top urgent loop"}. It's the highest combination of urgency and dollar impact on your board right now — then move to sending ${topOpportunity.customerName} what they asked for, since that one is a pure send, not a pitch.`,
      signals: urgentLoops.map((l) => l.title),
      actionLabel: "Open Open Loops",
      actionHref: "/open-loops",
    };
  }

  return {
    question: prompt,
    answer: `Here's the state of things: ${formatCurrency(overdueTotal)} stuck in overdue invoices, ${needsReply.length} people waiting on a reply, and ${opportunities.length} warm opportunities worth ${formatCurrency(opportunities.reduce((s, o) => s + o.value, 0))} if you close them. Try asking about money, follow-ups, or risk for a sharper answer.`,
    signals: dailyBrief.chips.map((c) => c.label),
    actionLabel: "Open Morning Brief",
    actionHref: "/morning-brief",
  };
}

export const suggestedPrompts = [
  "What changed overnight?",
  "Who do I need to follow up with today?",
  "Where is money stuck?",
  "What should I do first?",
  "Which customers are at risk?",
  "Draft a reply to the delayed order customer.",
  "Summarize my business this week.",
  "What did I forget?",
];
