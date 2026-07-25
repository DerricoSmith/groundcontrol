import "server-only";
import type { DataQualitySeverity, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCan } from "@/lib/auth/permissions";
import { recordAuditEvent } from "@/lib/services/audit-service";

/**
 * Deterministic data quality detection.
 *
 * Issues are persisted, not rendered on the fly, so they can be assigned,
 * worked, resolved, and audited like any other operating item. Detection is
 * re-runnable: an issue that still applies is updated in place, and one
 * that no longer applies is auto-resolved with a note.
 */

export const DATA_QUALITY_RULE_VERSION = "dq-v1-2026-07";

export const DATA_QUALITY_CATEGORIES = {
  DUPLICATE_CUSTOMER_ACCOUNT: "duplicate_customer_account",
  MISSING_ACCOUNT_OWNER: "missing_account_owner",
  MISSING_RECURRING_REVENUE: "missing_recurring_revenue",
  MISSING_RENEWAL_DATE: "missing_renewal_date",
  CONFLICTING_RENEWAL_RECORDS: "conflicting_renewal_records",
  STALE_PRODUCT_USAGE: "stale_product_usage",
  MISSING_PRODUCT_USAGE: "missing_product_usage",
  MISSING_EXECUTIVE_SPONSOR: "missing_executive_sponsor",
  MISSING_CHAMPION: "missing_champion",
  MISSING_CONTACT_RELATIONSHIP: "missing_contact_relationship",
  DUPLICATE_CONTACT: "duplicate_contact",
  INCOMPLETE_HEALTH_COMPONENT: "incomplete_health_component",
} as const;

export type DataQualityCategory = (typeof DATA_QUALITY_CATEGORIES)[keyof typeof DATA_QUALITY_CATEGORIES];

interface DetectedIssue {
  customerAccountId: string | null;
  category: DataQualityCategory;
  severity: DataQualitySeverity;
  explanation: string;
  suggestedResolution: string;
  sourceRecordType?: string;
  sourceRecordId?: string;
}

const STALE_USAGE_DAYS = 60;

export async function detectDataQualityIssues(params: {
  organizationId: string;
  actingUserId: string;
  actingRole: Role;
  now?: Date;
}): Promise<{ detected: number; resolved: number }> {
  assertCan(params.actingRole, "edit_account_data");
  const now = params.now ?? new Date();
  const { organizationId } = params;

  const [accounts, contacts, usageByAccount, renewals] = await Promise.all([
    prisma.customerAccount.findMany({ where: { organizationId } }),
    prisma.customerContact.findMany({ where: { organizationId } }),
    prisma.productUsageSummary.findMany({
      where: { organizationId },
      orderBy: { periodEnd: "desc" },
      select: { customerAccountId: true, periodEnd: true },
    }),
    prisma.renewal.findMany({ where: { organizationId }, select: { customerAccountId: true, periodEnd: true, status: true } }),
  ]);

  const detected: DetectedIssue[] = [];

  // Duplicate account names within the organization.
  const nameCounts = new Map<string, string[]>();
  for (const account of accounts) {
    const key = account.name.toLowerCase();
    nameCounts.set(key, [...(nameCounts.get(key) ?? []), account.id]);
  }
  for (const [name, ids] of nameCounts) {
    if (ids.length < 2) continue;
    for (const id of ids) {
      detected.push({
        customerAccountId: id,
        category: DATA_QUALITY_CATEGORIES.DUPLICATE_CUSTOMER_ACCOUNT,
        severity: "HIGH",
        explanation: `${ids.length} customer accounts share the name "${name}". Imports matching by name cannot tell them apart.`,
        suggestedResolution: "Merge the duplicates, or give each account a distinct external id.",
        sourceRecordType: "CustomerAccount",
        sourceRecordId: id,
      });
    }
  }

  const latestUsageByAccount = new Map<string, Date>();
  for (const usage of usageByAccount) {
    if (!latestUsageByAccount.has(usage.customerAccountId)) {
      latestUsageByAccount.set(usage.customerAccountId, usage.periodEnd);
    }
  }

  const contactsByAccount = new Map<string, typeof contacts>();
  for (const contact of contacts) {
    contactsByAccount.set(contact.customerAccountId, [...(contactsByAccount.get(contact.customerAccountId) ?? []), contact]);
  }

  const renewalsByAccount = new Map<string, typeof renewals>();
  for (const renewal of renewals) {
    renewalsByAccount.set(renewal.customerAccountId, [...(renewalsByAccount.get(renewal.customerAccountId) ?? []), renewal]);
  }

  const anyUsageImported = usageByAccount.length > 0;
  const anyContactsImported = contacts.length > 0;

  for (const account of accounts) {
    if (!account.ownerId) {
      detected.push({
        customerAccountId: account.id,
        category: DATA_QUALITY_CATEGORIES.MISSING_ACCOUNT_OWNER,
        severity: "MODERATE",
        explanation: `${account.name} has no assigned owner, so no one is accountable for it.`,
        suggestedResolution: "Assign an account owner, or include an owner_email column in the next import.",
        sourceRecordType: "CustomerAccount",
        sourceRecordId: account.id,
      });
    }

    if (account.arr <= 0) {
      detected.push({
        customerAccountId: account.id,
        category: DATA_QUALITY_CATEGORIES.MISSING_RECURRING_REVENUE,
        severity: "MODERATE",
        explanation: `${account.name} has no recurring revenue on file, so it is excluded from every revenue calculation.`,
        suggestedResolution: "Add the account's annual recurring revenue.",
        sourceRecordType: "CustomerAccount",
        sourceRecordId: account.id,
      });
    }

    if (!account.renewalDate) {
      detected.push({
        customerAccountId: account.id,
        category: DATA_QUALITY_CATEGORIES.MISSING_RENEWAL_DATE,
        severity: "HIGH",
        explanation: `${account.name} has no renewal date, so it cannot appear in renewal planning or forecasting.`,
        suggestedResolution: "Add a renewal date to the account, or import a renewal record.",
        sourceRecordType: "CustomerAccount",
        sourceRecordId: account.id,
      });
    }

    // Two open renewals for the same account is a genuine conflict, not a history.
    const openRenewals = (renewalsByAccount.get(account.id) ?? []).filter(
      (r) => r.status !== "RENEWED" && r.status !== "CHURNED"
    );
    if (openRenewals.length > 1) {
      detected.push({
        customerAccountId: account.id,
        category: DATA_QUALITY_CATEGORIES.CONFLICTING_RENEWAL_RECORDS,
        severity: "HIGH",
        explanation: `${account.name} has ${openRenewals.length} open renewal records. Only one renewal can be current.`,
        suggestedResolution: "Close or correct the renewals that are no longer current.",
        sourceRecordType: "Renewal",
      });
    }

    // Usage issues are only meaningful once the organization has started
    // importing usage at all — otherwise every account would be flagged for
    // a feature the customer has not adopted yet.
    if (anyUsageImported) {
      const latestUsage = latestUsageByAccount.get(account.id);
      if (!latestUsage) {
        detected.push({
          customerAccountId: account.id,
          category: DATA_QUALITY_CATEGORIES.MISSING_PRODUCT_USAGE,
          severity: "MODERATE",
          explanation: `${account.name} has no product usage on file, while other accounts do. Adoption cannot be assessed for it.`,
          suggestedResolution: "Include this account in the next product usage import.",
          sourceRecordType: "CustomerAccount",
          sourceRecordId: account.id,
        });
      } else {
        const ageDays = Math.floor((now.getTime() - latestUsage.getTime()) / (1000 * 60 * 60 * 24));
        if (ageDays > STALE_USAGE_DAYS) {
          detected.push({
            customerAccountId: account.id,
            category: DATA_QUALITY_CATEGORIES.STALE_PRODUCT_USAGE,
            severity: "MODERATE",
            explanation: `${account.name}'s most recent usage period ended ${ageDays} days ago. Adoption signals are out of date.`,
            suggestedResolution: "Import a more recent product usage period.",
            sourceRecordType: "ProductUsageSummary",
          });
        }
      }
    }

    if (anyContactsImported) {
      const accountContacts = (contactsByAccount.get(account.id) ?? []).filter((c) => c.isActive);
      const roles = accountContacts.flatMap((c) => (c.roles as string[] | null) ?? []);

      if (accountContacts.length === 0) {
        detected.push({
          customerAccountId: account.id,
          category: DATA_QUALITY_CATEGORIES.MISSING_CONTACT_RELATIONSHIP,
          severity: "MODERATE",
          explanation: `${account.name} has no active contacts, so relationship health cannot be assessed.`,
          suggestedResolution: "Import contacts for this account.",
          sourceRecordType: "CustomerAccount",
          sourceRecordId: account.id,
        });
      } else {
        if (!roles.includes("EXECUTIVE_SPONSOR")) {
          detected.push({
            customerAccountId: account.id,
            category: DATA_QUALITY_CATEGORIES.MISSING_EXECUTIVE_SPONSOR,
            severity: "MODERATE",
            explanation: `${account.name} has contacts but none is recorded as the executive sponsor.`,
            suggestedResolution: "Assign the executive sponsor role to the correct contact.",
            sourceRecordType: "CustomerContact",
          });
        }
        if (!roles.includes("CHAMPION")) {
          detected.push({
            customerAccountId: account.id,
            category: DATA_QUALITY_CATEGORIES.MISSING_CHAMPION,
            severity: "LOW",
            explanation: `${account.name} has contacts but none is recorded as a champion.`,
            suggestedResolution: "Assign the champion role to the correct contact.",
            sourceRecordType: "CustomerContact",
          });
        }
      }

      // Duplicate contact emails within one account.
      const emailCounts = new Map<string, number>();
      for (const contact of accountContacts) {
        if (!contact.email) continue;
        emailCounts.set(contact.email, (emailCounts.get(contact.email) ?? 0) + 1);
      }
      if (Array.from(emailCounts.values()).some((count) => count > 1)) {
        detected.push({
          customerAccountId: account.id,
          category: DATA_QUALITY_CATEGORIES.DUPLICATE_CONTACT,
          severity: "LOW",
          explanation: `${account.name} has more than one contact sharing an email address.`,
          suggestedResolution: "Merge the duplicate contacts.",
          sourceRecordType: "CustomerContact",
        });
      }
    }
  }

  // Persist: upsert detected issues, auto-resolve ones that no longer apply.
  const detectedKeys = new Set(detected.map((d) => `${d.customerAccountId}:${d.category}`));

  for (const issue of detected) {
    const existing = await prisma.dataQualityIssue.findFirst({
      where: { organizationId, customerAccountId: issue.customerAccountId, category: issue.category },
    });

    if (existing) {
      // An issue a person explicitly dismissed stays dismissed.
      if (existing.status === "DISMISSED") continue;
      await prisma.dataQualityIssue.update({
        where: { id: existing.id },
        data: {
          severity: issue.severity,
          explanation: issue.explanation,
          suggestedResolution: issue.suggestedResolution,
          status: existing.status === "RESOLVED" ? "OPEN" : existing.status,
          resolvedAt: existing.status === "RESOLVED" ? null : existing.resolvedAt,
          ruleVersion: DATA_QUALITY_RULE_VERSION,
        },
      });
    } else {
      await prisma.dataQualityIssue.create({
        data: {
          organizationId,
          customerAccountId: issue.customerAccountId,
          category: issue.category,
          severity: issue.severity,
          explanation: issue.explanation,
          suggestedResolution: issue.suggestedResolution,
          sourceRecordType: issue.sourceRecordType,
          sourceRecordId: issue.sourceRecordId,
          ruleVersion: DATA_QUALITY_RULE_VERSION,
        },
      });
    }
  }

  const openIssues = await prisma.dataQualityIssue.findMany({
    where: { organizationId, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] } },
  });
  let resolved = 0;
  for (const issue of openIssues) {
    if (detectedKeys.has(`${issue.customerAccountId}:${issue.category}`)) continue;
    await prisma.dataQualityIssue.update({
      where: { id: issue.id },
      data: { status: "RESOLVED", resolvedAt: now },
    });
    resolved++;
  }

  // Stamping the organization is what lets "no open issues" be distinguished
  // from "nobody has looked yet".
  await prisma.organization.update({
    where: { id: organizationId },
    data: { dataQualityEvaluatedAt: now },
  });

  await recordAuditEvent({
    organizationId,
    actorUserId: params.actingUserId,
    eventType: "organization_setting_changed",
    targetType: "DataQualityIssue",
    metadata: { action: "data_quality_recalculated", detected: detected.length, resolved },
  });

  return { detected: detected.length, resolved };
}

/**
 * "Not Evaluated" is deliberately part of this vocabulary. An organization
 * that has never run detection has not earned "Ready", and reporting it that
 * way would tell an executive the data is clean when nothing has been checked.
 */
export type DataQualityState = "Ready" | "Usable" | "Limited" | "Needs Attention" | "Not Evaluated";

export interface DataQualitySummary {
  state: DataQualityState;
  explanation: string;
  openIssues: number;
  criticalIssues: number;
  highIssues: number;
  moderateIssues: number;
  lowIssues: number;
  accountsAffected: number;
  totalAccounts: number;
  reasons: string[];
}

/**
 * Summarizes data quality with the founder's four-label vocabulary. The
 * state always comes with the reasons that produced it — a bare percentage
 * is explicitly not acceptable.
 */
export async function getDataQualitySummary(organizationId: string): Promise<DataQualitySummary> {
  const [issues, totalAccounts, organization] = await Promise.all([
    prisma.dataQualityIssue.findMany({
      where: { organizationId, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] } },
    }),
    prisma.customerAccount.count({ where: { organizationId } }),
    prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { dataQualityEvaluatedAt: true },
    }),
  ]);

  const bySeverity = (severity: DataQualitySeverity) => issues.filter((i) => i.severity === severity).length;
  const critical = bySeverity("CRITICAL");
  const high = bySeverity("HIGH");
  const moderate = bySeverity("MODERATE");
  const low = bySeverity("LOW");

  const accountsAffected = new Set(issues.map((i) => i.customerAccountId).filter(Boolean)).size;

  const reasons: string[] = [];
  const byCategory = new Map<string, number>();
  for (const issue of issues) byCategory.set(issue.category, (byCategory.get(issue.category) ?? 0) + 1);
  for (const [category, count] of [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)) {
    reasons.push(`${count} ${category.replace(/_/g, " ")} issue${count === 1 ? "" : "s"}.`);
  }

  let state: DataQualityState;
  let explanation: string;

  if (totalAccounts === 0) {
    state = "Needs Attention";
    explanation = "No customer accounts have been imported yet.";
  } else if (organization.dataQualityEvaluatedAt === null) {
    state = "Not Evaluated";
    explanation =
      "Data quality has never been checked for this organization, so nothing here should be read as clean. Run a data quality check to find out what the imported data can support.";
  } else if (critical > 0 || high > totalAccounts * 0.5) {
    state = "Needs Attention";
    explanation = `${critical > 0 ? `${critical} critical and ` : ""}${high} high severity issue${critical === 0 && high === 1 ? " affects" : "s affect"} ${accountsAffected} of ${totalAccounts} accounts.`;
  } else if (high > 0) {
    state = "Limited";
    explanation = `${high} high severity issue${high === 1 ? " affects" : "s affect"} ${accountsAffected} of ${totalAccounts} accounts. Some calculations will be incomplete.`;
  } else if (moderate + low > 0) {
    state = "Usable";
    explanation = `${moderate + low} lower severity issue${moderate + low === 1 ? "" : "s"} remain across ${accountsAffected} of ${totalAccounts} accounts. Core calculations are reliable.`;
  } else {
    state = "Ready";
    explanation = `No open data quality issues across ${totalAccounts} account${totalAccounts === 1 ? "" : "s"}, as of the check on ${organization.dataQualityEvaluatedAt.toISOString().slice(0, 10)}.`;
  }

  return {
    state,
    explanation,
    openIssues: issues.length,
    criticalIssues: critical,
    highIssues: high,
    moderateIssues: moderate,
    lowIssues: low,
    accountsAffected,
    totalAccounts,
    reasons,
  };
}

export async function resolveDataQualityIssue(params: {
  organizationId: string;
  issueId: string;
  actingUserId: string;
  actingRole: Role;
  dismiss?: boolean;
  dismissalReason?: string;
}) {
  assertCan(params.actingRole, "edit_account_data");

  const issue = await prisma.dataQualityIssue.findFirst({
    where: { id: params.issueId, organizationId: params.organizationId },
  });
  if (!issue) throw new Error("Data quality issue not found.");

  if (params.dismiss && !params.dismissalReason) {
    throw new Error("Dismissing a data quality issue requires a reason.");
  }

  const updated = await prisma.dataQualityIssue.update({
    where: { id: issue.id },
    data: params.dismiss
      ? { status: "DISMISSED", dismissalReason: params.dismissalReason, resolvedAt: new Date() }
      : { status: "RESOLVED", resolvedAt: new Date() },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "organization_setting_changed",
    targetType: "DataQualityIssue",
    targetId: issue.id,
    metadata: { action: params.dismiss ? "dismissed" : "resolved", category: issue.category },
  });

  return updated;
}
