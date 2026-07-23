import { prisma } from "@/lib/prisma";
import { customers, invoices, openLoopsSeed, opportunities, risks } from "@/lib/data";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const now = () => Date.now();

/**
 * Clones the product's demo dataset into a brand-new workspace so a real
 * signup gets a fully populated, realistic account in seconds — the "under
 * 3 minutes to value" idea from the case study, now literally true.
 */
export async function seedWorkspaceFromMockData(workspaceId: string) {
  const customerIdMap = new Map<string, string>();

  for (const c of customers) {
    const created = await prisma.customer.create({
      data: {
        workspaceId,
        name: c.name,
        company: c.company ?? null,
        avatarInitials: c.avatarInitials,
        channel: c.channel,
        status: c.status,
        sentiment: c.sentiment,
        isVIP: c.isVIP,
        atRisk: c.atRisk,
        isOpportunity: c.isOpportunity,
        needsReply: c.needsReply,
        waitingOn: c.waitingOn,
        ltv: c.ltv,
        lastTouchAt: new Date(now() - c.lastTouchDaysAgo * DAY_MS),
        location: c.location,
        email: c.email,
        tags: c.tags,
        relationshipSummary: c.relationshipSummary,
        lastMessage: c.lastMessage,
        openIssue: c.openIssue,
        nextAction: c.nextAction,
        suggestedReply: c.suggestedReply,
        notes: c.notes,
        revenueOpportunity: c.revenueOpportunity,
        timeline: c.timeline as object,
      },
    });
    customerIdMap.set(c.id, created.id);
  }

  for (const inv of invoices) {
    await prisma.invoice.create({
      data: {
        workspaceId,
        customerId: inv.customerId ? (customerIdMap.get(inv.customerId) ?? null) : null,
        client: inv.client,
        amount: inv.amount,
        issuedAt: new Date(now() - inv.issuedDaysAgo * DAY_MS),
        dueAt: new Date(now() + inv.dueInDays * DAY_MS),
        status: inv.status,
        channel: inv.channel,
      },
    });
  }

  for (const loop of openLoopsSeed) {
    await prisma.openLoop.create({
      data: {
        workspaceId,
        customerId: loop.customerId ? (customerIdMap.get(loop.customerId) ?? null) : null,
        title: loop.title,
        type: loop.type,
        source: loop.source,
        priority: loop.priority,
        dollarImpact: loop.dollarImpact,
        due: loop.due,
        dueLabel: loop.dueLabel,
        recommendedAction: loop.recommendedAction,
        status: loop.status,
        revenueTied: loop.revenueTied,
      },
    });
  }

  for (const opp of opportunities) {
    await prisma.opportunity.create({
      data: {
        workspaceId,
        customerId: opp.customerId ? (customerIdMap.get(opp.customerId) ?? null) : null,
        title: opp.title,
        customerName: opp.customerName,
        value: opp.value,
        confidence: opp.confidence,
        note: opp.note,
        nextAction: opp.nextAction,
      },
    });
  }

  for (const risk of risks) {
    await prisma.risk.create({
      data: {
        workspaceId,
        customerId: risk.customerId ? (customerIdMap.get(risk.customerId) ?? null) : null,
        title: risk.title,
        customerName: risk.customerName,
        severity: risk.severity,
        note: risk.note,
        recommendedAction: risk.recommendedAction,
      },
    });
  }
}

// Re-exported for anywhere hour-based mock offsets need the same epoch helper.
export const hoursAgoToDate = (hoursAgo: number) => new Date(now() - hoursAgo * HOUR_MS);
