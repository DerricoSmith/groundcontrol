import "server-only";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AccountMatcher } from "./account-matcher";
import { runImport, type ImportSummary } from "./import-runner";
import {
  readCsvTable,
  readRequiredDate,
  readDate,
  readInteger,
  readNumber,
  readPercentage,
  RowCollector,
  type RowError,
} from "./csv-core";

export interface ParsedUsageRow {
  rowNumber: number;
  accountName?: string;
  externalAccountId?: string;
  periodStart: Date;
  periodEnd: Date;
  activeUsers?: number;
  licensedUsers?: number;
  loginCount?: number;
  coreActionsCompleted?: number;
  featureAdoptionCount?: number;
  usageFrequency?: string;
  adoptionPercentage?: number;
  seatUtilizationPercentage?: number;
  lastActiveAt?: Date;
  sourceTrend?: string;
  productArea?: string;
  customMetric?: number;
  externalId?: string;
  sourceSystem?: string;
}

export interface UsageParseResult {
  headers: string[];
  validRows: ParsedUsageRow[];
  errors: RowError[];
}

export function parseProductUsageCsv(csvText: string): UsageParseResult {
  const { headers, rows } = readCsvTable(csvText, ["period_start", "period_end"]);

  if (!headers.includes("account_name") && !headers.includes("external_account_id")) {
    throw new Error('The file must have an "account_name" or "external_account_id" column.');
  }

  const validRows: ParsedUsageRow[] = [];
  const errors: RowError[] = [];

  for (const { rowNumber, get } of rows) {
    const collector = new RowCollector();

    const periodStart = collector.take(readRequiredDate(get("period_start"), "period start"));
    const periodEnd = collector.take(readRequiredDate(get("period_end"), "period end"));
    const activeUsers = collector.take(readInteger(get("active_users"), "active users", { min: 0 }));
    const licensedUsers = collector.take(readInteger(get("licensed_users"), "licensed users", { min: 0 }));
    const loginCount = collector.take(readInteger(get("login_count"), "login count", { min: 0 }));
    const coreActionsCompleted = collector.take(readInteger(get("core_actions_completed"), "core actions completed", { min: 0 }));
    const featureAdoptionCount = collector.take(readInteger(get("feature_adoption_count"), "feature adoption count", { min: 0 }));
    const adoptionPercentage = collector.take(readPercentage(get("adoption_percentage"), "adoption percentage"));
    const seatUtilizationPercentage = collector.take(readPercentage(get("seat_utilization_percentage"), "seat utilization percentage"));
    const lastActiveAt = collector.take(readDate(get("last_active_date"), "last active date"));
    const customMetric = collector.take(readNumber(get("custom_metric"), "custom metric"));

    if (!collector.failure && periodStart && periodEnd && periodEnd < periodStart) {
      collector.reject("Invalid date range: period end is before period start.");
    }

    const failure = collector.failure;
    if (failure || !periodStart || !periodEnd) {
      errors.push({ rowNumber, message: failure ?? "Missing required period dates." });
      continue;
    }

    validRows.push({
      rowNumber,
      accountName: get("account_name"),
      externalAccountId: get("external_account_id"),
      periodStart,
      periodEnd,
      activeUsers,
      licensedUsers,
      loginCount,
      coreActionsCompleted,
      featureAdoptionCount,
      usageFrequency: get("usage_frequency"),
      adoptionPercentage,
      seatUtilizationPercentage,
      lastActiveAt,
      sourceTrend: get("usage_trend"),
      productArea: get("product_area"),
      customMetric,
      externalId: get("external_id"),
      sourceSystem: get("source_system"),
    });
  }

  return { headers, validRows, errors };
}

/**
 * Commits usage periods. A later import never overwrites an earlier period
 * — each (account, periodStart, periodEnd) is unique, and a repeat is
 * reported as a duplicate. Usage history is the evidence behind the
 * usage-decline risk rule, so silently replacing it would destroy the
 * ability to explain why a risk fired.
 */
export async function importProductUsage(params: {
  organizationId: string;
  actingUserId: string;
  actingRole: Role;
  fileName: string;
  parseResult: UsageParseResult;
}): Promise<ImportSummary> {
  const matcher = await AccountMatcher.forOrganization(params.organizationId);

  return runImport({
    organizationId: params.organizationId,
    actingUserId: params.actingUserId,
    actingRole: params.actingRole,
    entityType: "product_usage_summary",
    fileName: params.fileName,
    parseErrors: params.parseResult.errors,
    parsedRowCount: params.parseResult.validRows.length,
    persist: async () => {
      const errors: RowError[] = [];
      let created = 0;
      let duplicates = 0;

      const existing = await prisma.productUsageSummary.findMany({
        where: { organizationId: params.organizationId },
        select: { customerAccountId: true, periodStart: true, periodEnd: true },
      });
      const key = (accountId: string, start: Date, end: Date) =>
        `${accountId}:${start.toISOString().slice(0, 10)}:${end.toISOString().slice(0, 10)}`;
      const seen = new Set(existing.map((e) => key(e.customerAccountId, e.periodStart, e.periodEnd)));

      for (const row of params.parseResult.validRows) {
        const match = matcher.match({ accountName: row.accountName, externalAccountId: row.externalAccountId });
        if (!match.ok) {
          errors.push({ rowNumber: row.rowNumber, message: match.message });
          continue;
        }

        const rowKey = key(match.accountId, row.periodStart, row.periodEnd);
        if (seen.has(rowKey)) {
          duplicates++;
          continue;
        }
        seen.add(rowKey);

        await prisma.productUsageSummary.create({
          data: {
            organizationId: params.organizationId,
            customerAccountId: match.accountId,
            periodStart: row.periodStart,
            periodEnd: row.periodEnd,
            activeUsers: row.activeUsers,
            licensedUsers: row.licensedUsers,
            loginCount: row.loginCount,
            coreActionsCompleted: row.coreActionsCompleted,
            featureAdoptionCount: row.featureAdoptionCount,
            usageFrequency: row.usageFrequency,
            adoptionPercentage: row.adoptionPercentage,
            seatUtilizationPercentage: row.seatUtilizationPercentage,
            lastActiveAt: row.lastActiveAt,
            sourceTrend: row.sourceTrend,
            productArea: row.productArea,
            customMetric: row.customMetric,
            externalId: row.externalId,
            sourceSystem: row.sourceSystem,
          },
        });
        created++;
      }

      return { created, duplicates, errors };
    },
  });
}

export function generateProductUsageSampleCsv(): string {
  return [
    "account_name,period_start,period_end,active_users,licensed_users,adoption_percentage,seat_utilization_percentage,last_active_date",
    "Acme Logistics,2026-05-01,2026-05-31,42,60,68,70,2026-05-30",
    "Acme Logistics,2026-06-01,2026-06-30,30,60,50,50,2026-06-28",
    "Brightline Health,2026-06-01,2026-06-30,88,90,92,98,2026-06-30",
  ].join("\n");
}
