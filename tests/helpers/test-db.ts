import { PrismaClient } from "@prisma/client";

// tests/helpers/setup-env.ts (a Vitest setupFile) has already pointed
// DATABASE_URL at the dedicated test schema before this module is evaluated,
// so this is a client for the disposable test database, never production and
// never the development schema.
export const testDb = new PrismaClient();

/**
 * Every table cleared between test files, ordered parents-last so the list
 * also reads as a dependency map.
 *
 * The list is intentionally explicit rather than introspected: a new model
 * added to schema.prisma without being added here should make isolation tests
 * fail loudly rather than silently pass against a half-cleared database.
 */
const TABLES = [
  "OnboardingEvent",
  "SetupChecklistItem",
  "OnboardingSession",
  "OrganizationInvitation",
  "AuditEvent",
  "ImportJob",
  // Customer Intelligence Core — child rows first, then their parents.
  "ActionComment",
  "ActionStatusChange",
  "RecommendedAction",
  "RiskStatusChange",
  "RiskEvaluationRun",
  "RiskRuleConfiguration",
  "RenewalMilestone",
  "RenewalPlan",
  "RenewalForecastChange",
  "CustomerInteraction",
  "SupportTicket",
  "ProductUsageSummary",
  "CustomerContact",
  "Escalation",
  "DataQualityIssue",
  "DataFreshnessExpectation",
  "HealthScoreSnapshot",
  "HealthScoreOverride",
  "HealthModelVersion",
  "ExecutiveBriefSection",
  "ExecutiveBrief",
  "OrganizationSetupProfile",
  "AIAnalysisRecord",
  "AIUsageRecord",
  "RiskSignal",
  "HealthScoreComponent",
  "HealthScore",
  "Renewal",
  "CustomerAccount",
  "DataSource",
  "Lead",
  "Membership",
  "Organization",
  "User",
] as const;

/**
 * One TRUNCATE for every table rather than 40 sequential DELETEs. Against a
 * network Postgres that is the difference between a suite that takes seconds
 * and one that takes minutes, and CASCADE makes the ordering above a
 * readability aid rather than a correctness requirement.
 */
/**
 * The schema the test database lives in, taken from the connection string.
 * Raw SQL does not inherit the search_path Prisma uses for its own queries on
 * a pooled connection, so every table name here is qualified explicitly.
 */
const TEST_SCHEMA = (() => {
  const match = /[?&]schema=([A-Za-z0-9_]+)/.exec(process.env.DATABASE_URL ?? "");
  if (!match) throw new Error("DATABASE_URL has no schema parameter; refusing to truncate.");
  return match[1];
})();

export async function resetTestDatabase(): Promise<void> {
  const qualified = TABLES.map((table) => `"${TEST_SCHEMA}"."${table}"`).join(", ");
  await testDb.$executeRawUnsafe(`TRUNCATE TABLE ${qualified} RESTART IDENTITY CASCADE`);
}

export async function disconnectTestDatabase(): Promise<void> {
  await testDb.$disconnect();
}
