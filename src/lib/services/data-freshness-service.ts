import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Source freshness per data category.
 *
 * "Missing" is a distinct state from "current" — a category that was never
 * imported is never reported as up to date. That distinction is the whole
 * point: silence about support tickets must not read as "no support
 * problems".
 */

export type FreshnessState = "CURRENT" | "AGING" | "STALE" | "MISSING" | "UNKNOWN";

export const DATA_CATEGORIES = [
  "customer_account",
  "renewal",
  "product_usage",
  "support_ticket",
  "interaction",
  "contact",
] as const;
export type DataCategory = (typeof DATA_CATEGORIES)[number];

export const DEFAULT_EXPECTED_MAX_AGE_DAYS: Record<DataCategory, number> = {
  customer_account: 90,
  renewal: 30,
  product_usage: 30,
  support_ticket: 14,
  interaction: 30,
  contact: 90,
};

export const CATEGORY_LABELS: Record<DataCategory, string> = {
  customer_account: "Customer accounts",
  renewal: "Renewals",
  product_usage: "Product usage",
  support_ticket: "Support tickets",
  interaction: "Customer interactions",
  contact: "Contacts",
};

export interface CategoryFreshness {
  category: DataCategory;
  label: string;
  state: FreshnessState;
  explanation: string;
  recordCount: number;
  lastImportedAt?: Date;
  mostRecentSourceRecordAt?: Date;
  expectedMaxAgeDays: number;
  ageDays?: number;
}

async function countAndLatest(
  category: DataCategory,
  organizationId: string
): Promise<{ count: number; latest?: Date }> {
  switch (category) {
    case "customer_account": {
      const count = await prisma.customerAccount.count({ where: { organizationId } });
      const latest = await prisma.customerAccount.findFirst({
        where: { organizationId },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      });
      return { count, latest: latest?.updatedAt };
    }
    case "renewal": {
      const count = await prisma.renewal.count({ where: { organizationId } });
      const latest = await prisma.renewal.findFirst({
        where: { organizationId },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      });
      return { count, latest: latest?.updatedAt };
    }
    case "product_usage": {
      const count = await prisma.productUsageSummary.count({ where: { organizationId } });
      const latest = await prisma.productUsageSummary.findFirst({
        where: { organizationId },
        orderBy: { periodEnd: "desc" },
        select: { periodEnd: true },
      });
      return { count, latest: latest?.periodEnd };
    }
    case "support_ticket": {
      const count = await prisma.supportTicket.count({ where: { organizationId } });
      const latest = await prisma.supportTicket.findFirst({
        where: { organizationId },
        orderBy: { createdDate: "desc" },
        select: { createdDate: true },
      });
      return { count, latest: latest?.createdDate };
    }
    case "interaction": {
      const count = await prisma.customerInteraction.count({ where: { organizationId } });
      const latest = await prisma.customerInteraction.findFirst({
        where: { organizationId },
        orderBy: { interactionDate: "desc" },
        select: { interactionDate: true },
      });
      return { count, latest: latest?.interactionDate };
    }
    case "contact": {
      const count = await prisma.customerContact.count({ where: { organizationId } });
      const latest = await prisma.customerContact.findFirst({
        where: { organizationId },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      });
      return { count, latest: latest?.updatedAt };
    }
  }
}

const IMPORT_ENTITY_BY_CATEGORY: Record<DataCategory, string> = {
  customer_account: "customer_account",
  renewal: "renewal",
  product_usage: "product_usage_summary",
  support_ticket: "support_ticket",
  interaction: "customer_interaction",
  contact: "customer_contact",
};

export async function getDataFreshness(organizationId: string, now = new Date()): Promise<CategoryFreshness[]> {
  const overrides = await prisma.dataFreshnessExpectation.findMany({ where: { organizationId } });
  const overrideByCategory = new Map(overrides.map((o) => [o.category, o.expectedMaxAgeDays]));

  return Promise.all(
    DATA_CATEGORIES.map(async (category) => {
      const expectedMaxAgeDays = overrideByCategory.get(category) ?? DEFAULT_EXPECTED_MAX_AGE_DAYS[category];
      const { count, latest } = await countAndLatest(category, organizationId);

      const lastImport = await prisma.importJob.findFirst({
        where: { organizationId, entityType: IMPORT_ENTITY_BY_CATEGORY[category] },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

      if (count === 0) {
        return {
          category,
          label: CATEGORY_LABELS[category],
          state: "MISSING" as FreshnessState,
          explanation: `No ${CATEGORY_LABELS[category].toLowerCase()} have been imported. This is not the same as having none — Ground Control simply cannot see this category.`,
          recordCount: 0,
          expectedMaxAgeDays,
          lastImportedAt: lastImport?.createdAt,
        };
      }

      if (!latest) {
        return {
          category,
          label: CATEGORY_LABELS[category],
          state: "UNKNOWN" as FreshnessState,
          explanation: `${count} record${count === 1 ? "" : "s"} exist but carry no usable date, so freshness cannot be determined.`,
          recordCount: count,
          expectedMaxAgeDays,
          lastImportedAt: lastImport?.createdAt,
        };
      }

      const ageDays = Math.floor((now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24));
      let state: FreshnessState;
      if (ageDays <= expectedMaxAgeDays) state = "CURRENT";
      else if (ageDays <= expectedMaxAgeDays * 2) state = "AGING";
      else state = "STALE";

      const explanation =
        state === "CURRENT"
          ? `Most recent record is ${ageDays} day${ageDays === 1 ? "" : "s"} old, within the ${expectedMaxAgeDays} day expectation.`
          : `Most recent record is ${ageDays} days old, beyond the ${expectedMaxAgeDays} day expectation.`;

      return {
        category,
        label: CATEGORY_LABELS[category],
        state,
        explanation,
        recordCount: count,
        lastImportedAt: lastImport?.createdAt,
        mostRecentSourceRecordAt: latest,
        expectedMaxAgeDays,
        ageDays,
      };
    })
  );
}

export async function setFreshnessExpectation(params: {
  organizationId: string;
  category: DataCategory;
  expectedMaxAgeDays: number;
}) {
  if (params.expectedMaxAgeDays < 1) throw new Error("Expected maximum age must be at least one day.");

  return prisma.dataFreshnessExpectation.upsert({
    where: { organizationId_category: { organizationId: params.organizationId, category: params.category } },
    create: { organizationId: params.organizationId, category: params.category, expectedMaxAgeDays: params.expectedMaxAgeDays },
    update: { expectedMaxAgeDays: params.expectedMaxAgeDays },
  });
}
