import "server-only";
import type { ForecastCategory, RenewalStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AccountMatcher } from "./account-matcher";
import { runImport, type ImportSummary } from "./import-runner";
import {
  readCsvTable,
  readRequiredDate,
  readNumber,
  readEnum,
  readInteger,
  readBoolean,
  readCurrency,
  RowCollector,
  type RowError,
} from "./csv-core";

const FORECAST_CATEGORIES = [
  "COMMITTED",
  "LIKELY",
  "AT_RISK",
  "UNCERTAIN",
  "EXPECTED_CHURN",
  "RENEWED",
  "CHURNED",
] as const;

const RENEWAL_STATUSES = [
  "NOT_STARTED",
  "PLANNING",
  "CUSTOMER_DISCUSSION",
  "COMMERCIAL_REVIEW",
  "LEGAL_REVIEW",
  "PROCUREMENT",
  "VERBAL_COMMITMENT",
  "RENEWED",
  "CHURNED",
  "DEFERRED",
] as const;

export interface ParsedRenewalRow {
  rowNumber: number;
  accountName?: string;
  externalAccountId?: string;
  renewalDate: Date;
  externalId?: string;
  arr?: number;
  contractValue?: number;
  currency?: string;
  ownerEmail?: string;
  status?: RenewalStatus;
  forecastCategory?: ForecastCategory;
  forecastConfidence?: number;
  autoRenew?: boolean;
  noticePeriodDays?: number;
  renewalTermMonths?: number;
  customerIntent?: string;
  expectedRenewalAmount?: number;
  expectedExpansionAmount?: number;
  expectedContractionAmount?: number;
  expectedChurnAmount?: number;
  sourceSystem?: string;
}

export interface RenewalParseResult {
  headers: string[];
  validRows: ParsedRenewalRow[];
  errors: RowError[];
}

export function parseRenewalCsv(csvText: string): RenewalParseResult {
  const { headers, rows } = readCsvTable(csvText, ["renewal_date"]);

  if (!headers.includes("account_name") && !headers.includes("external_account_id")) {
    throw new Error('The file must have an "account_name" or "external_account_id" column.');
  }

  const validRows: ParsedRenewalRow[] = [];
  const errors: RowError[] = [];

  for (const { rowNumber, get } of rows) {
    const collector = new RowCollector();

    const renewalDate = collector.take(readRequiredDate(get("renewal_date"), "renewal date"));
    const arr = collector.take(readNumber(get("arr") ?? get("annual_recurring_revenue"), "recurring revenue", { min: 0 }));
    const contractValue = collector.take(readNumber(get("contract_value"), "contract value", { min: 0 }));
    const currency = collector.take(readCurrency(get("currency")));
    const status = collector.take(readEnum(get("renewal_status") ?? get("status"), "renewal status", RENEWAL_STATUSES));
    const forecastCategory = collector.take(readEnum(get("forecast_category"), "forecast category", FORECAST_CATEGORIES));
    const forecastConfidence = collector.take(readNumber(get("forecast_confidence"), "forecast confidence", { min: 0, max: 1 }));
    const noticePeriodDays = collector.take(readInteger(get("notice_period_days"), "notice period", { min: 0 }));
    const renewalTermMonths = collector.take(readInteger(get("renewal_term_months"), "renewal term", { min: 0 }));
    const expectedRenewalAmount = collector.take(readNumber(get("expected_renewal_amount"), "expected renewal amount", { min: 0 }));
    const expectedExpansionAmount = collector.take(readNumber(get("expected_expansion_amount"), "expected expansion amount", { min: 0 }));
    const expectedContractionAmount = collector.take(readNumber(get("expected_contraction_amount"), "expected contraction amount", { min: 0 }));
    const expectedChurnAmount = collector.take(readNumber(get("expected_churn_amount"), "expected churn amount", { min: 0 }));

    const failure = collector.failure;
    if (failure || !renewalDate) {
      errors.push({ rowNumber, message: failure ?? "Missing required field: renewal date." });
      continue;
    }

    validRows.push({
      rowNumber,
      accountName: get("account_name"),
      externalAccountId: get("external_account_id"),
      renewalDate,
      externalId: get("renewal_id") ?? get("external_id"),
      arr,
      contractValue,
      currency,
      ownerEmail: get("renewal_owner")?.toLowerCase() ?? get("owner_email")?.toLowerCase(),
      status,
      forecastCategory,
      forecastConfidence,
      autoRenew: readBoolean(get("auto_renew")),
      noticePeriodDays,
      renewalTermMonths,
      customerIntent: get("customer_intent"),
      expectedRenewalAmount,
      expectedExpansionAmount,
      expectedContractionAmount,
      expectedChurnAmount,
      sourceSystem: get("source_system"),
    });
  }

  return { headers, validRows, errors };
}

/**
 * Commits parsed renewals.
 *
 * Historical renewal records are never overwritten. A row matching an
 * existing renewal (by external id, or by account + identical renewal date)
 * is reported as a duplicate and skipped — correcting a renewal is an
 * explicit edit through the Renewal Center, not a silent side effect of
 * re-running an import.
 */
export async function importRenewals(params: {
  organizationId: string;
  actingUserId: string;
  actingRole: Role;
  fileName: string;
  parseResult: RenewalParseResult;
}): Promise<ImportSummary> {
  const matcher = await AccountMatcher.forOrganization(params.organizationId);

  return runImport({
    organizationId: params.organizationId,
    actingUserId: params.actingUserId,
    actingRole: params.actingRole,
    entityType: "renewal",
    fileName: params.fileName,
    parseErrors: params.parseResult.errors,
    parsedRowCount: params.parseResult.validRows.length,
    persist: async () => {
      const errors: RowError[] = [];
      let created = 0;
      let duplicates = 0;

      const [existingRenewals, memberships, accounts] = await Promise.all([
        prisma.renewal.findMany({
          where: { organizationId: params.organizationId },
          select: { externalId: true, customerAccountId: true, periodEnd: true },
        }),
        prisma.membership.findMany({ where: { organizationId: params.organizationId }, include: { user: true } }),
        prisma.customerAccount.findMany({
          where: { organizationId: params.organizationId },
          select: { id: true, arr: true, currency: true },
        }),
      ]);

      const existingExternalIds = new Set(existingRenewals.filter((r) => r.externalId).map((r) => r.externalId!.toLowerCase()));
      const existingByAccountDate = new Set(
        existingRenewals.map((r) => `${r.customerAccountId}:${r.periodEnd.toISOString().slice(0, 10)}`)
      );
      const emailToUserId = new Map(memberships.map((m) => [m.user.email.toLowerCase(), m.userId]));
      const accountById = new Map(accounts.map((a) => [a.id, a]));
      const seenInFile = new Set<string>();

      for (const row of params.parseResult.validRows) {
        const match = matcher.match({ accountName: row.accountName, externalAccountId: row.externalAccountId });
        if (!match.ok) {
          errors.push({ rowNumber: row.rowNumber, message: match.message });
          continue;
        }

        const dateKey = row.renewalDate.toISOString().slice(0, 10);
        const accountDateKey = `${match.accountId}:${dateKey}`;
        const externalKey = row.externalId?.toLowerCase();

        if (
          (externalKey && existingExternalIds.has(externalKey)) ||
          existingByAccountDate.has(accountDateKey) ||
          seenInFile.has(accountDateKey)
        ) {
          duplicates++;
          continue;
        }
        seenInFile.add(accountDateKey);
        if (externalKey) existingExternalIds.add(externalKey);

        const account = accountById.get(match.accountId);
        // Renewal period start is the day after the previous period would
        // have ended. With no contract history imported, a one-year term is
        // the honest default and is stated in RENEWAL_IMPORT_GUIDE.md
        // rather than presented as known fact.
        const termMonths = row.renewalTermMonths ?? 12;
        const periodStart = new Date(row.renewalDate);
        periodStart.setMonth(periodStart.getMonth() - termMonths);

        await prisma.renewal.create({
          data: {
            organizationId: params.organizationId,
            customerAccountId: match.accountId,
            periodStart,
            periodEnd: row.renewalDate,
            arr: row.arr ?? row.contractValue ?? account?.arr ?? 0,
            currency: row.currency ?? account?.currency ?? "USD",
            externalId: row.externalId,
            status: row.status ?? "NOT_STARTED",
            forecastCategory: row.forecastCategory ?? "UNCERTAIN",
            forecastConfidence: row.forecastConfidence ?? 0,
            ownerId: row.ownerEmail ? emailToUserId.get(row.ownerEmail) : undefined,
            autoRenew: row.autoRenew,
            noticePeriodDays: row.noticePeriodDays,
            renewalTermMonths: row.renewalTermMonths,
            customerIntent: row.customerIntent,
            expectedRenewalAmount: row.expectedRenewalAmount,
            expectedExpansionAmount: row.expectedExpansionAmount,
            expectedContractionAmount: row.expectedContractionAmount,
            expectedChurnAmount: row.expectedChurnAmount,
          },
        });

        // Keep the account's convenience renewalDate aligned with its
        // nearest upcoming renewal, so Portfolio and risk rules that read
        // the account directly stay consistent with the renewal record.
        const existingAccountDate = await prisma.customerAccount.findUnique({
          where: { id: match.accountId },
          select: { renewalDate: true },
        });
        if (!existingAccountDate?.renewalDate || row.renewalDate < existingAccountDate.renewalDate) {
          await prisma.customerAccount.update({
            where: { id: match.accountId },
            data: { renewalDate: row.renewalDate },
          });
        }

        created++;
      }

      return { created, duplicates, errors };
    },
  });
}

export function generateRenewalSampleCsv(): string {
  return [
    "account_name,renewal_date,arr,currency,renewal_status,forecast_category,auto_renew,renewal_term_months",
    "Acme Logistics,2026-11-15,84000,USD,PLANNING,LIKELY,true,12",
    "Brightline Health,2026-09-01,152000,USD,CUSTOMER_DISCUSSION,AT_RISK,false,12",
    "Coastal Analytics,2027-01-20,26000,USD,NOT_STARTED,UNCERTAIN,true,12",
  ].join("\n");
}
