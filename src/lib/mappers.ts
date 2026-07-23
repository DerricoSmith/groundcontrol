import type {
  Customer as PrismaCustomer,
  Invoice as PrismaInvoice,
  OpenLoop as PrismaOpenLoop,
  Opportunity as PrismaOpportunity,
  Risk as PrismaRisk,
} from "@prisma/client";
import type {
  Customer,
  Invoice,
  OpenLoop,
  Opportunity,
  Risk,
  Channel,
  CustomerStatus,
  Sentiment,
  WaitingOn,
  InvoiceStatus,
  LoopType,
  Priority,
  TimelineEvent,
} from "@/lib/types";

const DAY_MS = 86_400_000;

export const daysAgoFrom = (date: Date) => Math.max(0, Math.round((Date.now() - date.getTime()) / DAY_MS));
export const daysUntilFrom = (date: Date) => Math.round((date.getTime() - Date.now()) / DAY_MS);

export function mapCustomer(row: PrismaCustomer): Customer {
  return {
    id: row.id,
    name: row.name,
    company: row.company ?? undefined,
    avatarInitials: row.avatarInitials,
    channel: row.channel as Channel,
    status: row.status as CustomerStatus,
    sentiment: row.sentiment as Sentiment,
    isVIP: row.isVIP,
    atRisk: row.atRisk,
    isOpportunity: row.isOpportunity,
    needsReply: row.needsReply,
    waitingOn: (row.waitingOn as WaitingOn) ?? null,
    ltv: row.ltv,
    lastTouchDaysAgo: daysAgoFrom(row.lastTouchAt),
    location: row.location,
    email: row.email,
    tags: (row.tags as string[]) ?? [],
    relationshipSummary: row.relationshipSummary,
    lastMessage: row.lastMessage,
    openIssue: row.openIssue,
    nextAction: row.nextAction,
    suggestedReply: row.suggestedReply,
    notes: row.notes,
    revenueOpportunity: row.revenueOpportunity,
    timeline: (row.timeline as unknown as TimelineEvent[]) ?? [],
  };
}

export function mapInvoice(row: PrismaInvoice): Invoice {
  return {
    id: row.id,
    customerId: row.customerId,
    client: row.client,
    amount: row.amount,
    issuedDaysAgo: daysAgoFrom(row.issuedAt),
    dueInDays: daysUntilFrom(row.dueAt),
    status: row.status as InvoiceStatus,
    channel: row.channel as Channel,
  };
}

export function mapOpenLoop(row: PrismaOpenLoop): OpenLoop {
  return {
    id: row.id,
    title: row.title,
    type: row.type as LoopType,
    source: row.source,
    customerId: row.customerId,
    priority: row.priority as Priority,
    dollarImpact: row.dollarImpact,
    due: row.due as OpenLoop["due"],
    dueLabel: row.dueLabel,
    recommendedAction: row.recommendedAction,
    status: row.status as OpenLoop["status"],
    revenueTied: row.revenueTied,
  };
}

export function mapOpportunity(row: PrismaOpportunity): Opportunity {
  return {
    id: row.id,
    title: row.title,
    customerId: row.customerId,
    customerName: row.customerName,
    value: row.value,
    confidence: row.confidence as Opportunity["confidence"],
    note: row.note,
    nextAction: row.nextAction,
  };
}

export function mapRisk(row: PrismaRisk): Risk {
  return {
    id: row.id,
    title: row.title,
    customerId: row.customerId,
    customerName: row.customerName,
    severity: row.severity as Risk["severity"],
    note: row.note,
    recommendedAction: row.recommendedAction,
  };
}
