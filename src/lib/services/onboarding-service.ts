import "server-only";
import { Prisma, type OnboardingPath, type OnboardingSession, type Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCan } from "@/lib/auth/permissions";
import { recordAuditEvent } from "@/lib/services/audit-service";

export class OnboardingError extends Error {}

// ---------------------------------------------------------------------------
// Step registry — the single source of truth for what onboarding steps
// exist, their order, whether they're required, and which roles may
// complete them. This is intentionally a code-level registry rather than a
// database table (see the schema comment above OnboardingSession) — it has
// no per-organization state of its own, only the session's completed/
// skipped arrays reference it by key. A step key that isn't in this array
// is not a valid step; every service function below validates against it.
//
// This is a smaller set than the founder's full 14-step Guided Setup flow —
// see ONBOARDING_ARCHITECTURE.md for what's deliberately not modeled yet
// (no onboarding wizard UI exists to drive a larger registry against).
// ---------------------------------------------------------------------------

export interface OnboardingStepDefinition {
  key: string;
  label: string;
  required: boolean;
  allowedRoles: Role[];
}

const ALL_ROLES: Role[] = [
  "OWNER",
  "ADMINISTRATOR",
  "EXECUTIVE",
  "CS_LEADER",
  "CS_MANAGER",
  "ANALYST",
  "VIEWER",
  "SIGNAL_STATE_CONSULTANT",
];

const OWNER_ADMIN: Role[] = ["OWNER", "ADMINISTRATOR", "SIGNAL_STATE_CONSULTANT"];
const DATA_ROLES: Role[] = ["OWNER", "ADMINISTRATOR", "CS_LEADER", "CS_MANAGER", "SIGNAL_STATE_CONSULTANT"];
const HEALTH_ROLES: Role[] = ["OWNER", "ADMINISTRATOR", "CS_LEADER", "SIGNAL_STATE_CONSULTANT"];
const BRIEF_ROLES: Role[] = ["OWNER", "ADMINISTRATOR", "EXECUTIVE", "CS_LEADER"];

export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  { key: "welcome", label: "Welcome", required: true, allowedRoles: ALL_ROLES },
  { key: "organization_profile", label: "Organization profile", required: true, allowedRoles: OWNER_ADMIN },
  { key: "choose_data_path", label: "Choose your data path", required: true, allowedRoles: OWNER_ADMIN },
  { key: "import_customer_accounts", label: "Import customer accounts", required: true, allowedRoles: DATA_ROLES },
  { key: "renewal_data", label: "Add renewal data", required: false, allowedRoles: DATA_ROLES },
  { key: "data_readiness", label: "Review data readiness", required: true, allowedRoles: DATA_ROLES },
  { key: "health_model", label: "Activate a health model", required: true, allowedRoles: HEALTH_ROLES },
  { key: "risk_preferences", label: "Activate risk rules", required: false, allowedRoles: HEALTH_ROLES },
  { key: "executive_brief_setup", label: "Configure the Executive Brief", required: false, allowedRoles: BRIEF_ROLES },
  { key: "team_invitations", label: "Invite your team", required: false, allowedRoles: OWNER_ADMIN },
  { key: "review_and_activate", label: "Review and activate", required: true, allowedRoles: OWNER_ADMIN },
];

const STEP_BY_KEY = new Map(ONBOARDING_STEPS.map((s) => [s.key, s]));
const STEP_ORDER = new Map(ONBOARDING_STEPS.map((s, i) => [s.key, i]));

function requireStep(stepKey: string): OnboardingStepDefinition {
  const step = STEP_BY_KEY.get(stepKey);
  if (!step) throw new OnboardingError(`Unknown onboarding step: ${stepKey}`);
  return step;
}

export const ONBOARDING_GOALS = [
  "identify_renewal_risk_earlier",
  "improve_customer_health_visibility",
  "increase_product_adoption",
  "strengthen_renewal_forecasting",
  "understand_customer_feedback",
  "create_better_executive_reporting",
  "improve_team_accountability",
  "build_customer_success_operations",
] as const;
export type OnboardingGoal = (typeof ONBOARDING_GOALS)[number];

export type OnboardingEventType =
  | "onboarding_started"
  | "onboarding_path_selected"
  | "goal_selected"
  | "step_viewed"
  | "step_completed"
  | "step_skipped"
  | "validation_failure"
  | "import_started"
  | "import_completed"
  | "import_failed"
  | "health_model_activated"
  | "risk_rule_activated"
  | "invitation_created"
  | "executive_brief_previewed"
  | "onboarding_completed"
  | "onboarding_abandoned"
  | "onboarding_resumed"
  | "first_portfolio_view"
  | "first_account_detail_view"
  | "first_risk_reviewed"
  | "first_action_created"
  | "first_executive_brief_reviewed";

// Fields that must never end up in a local analytics event — see
// LOCAL_BUILD_PROGRESS.md / the founder's brief: no customer names,
// account names, emails, revenue, or free-text content in event metadata.
const SENSITIVE_METADATA_KEYS = new Set([
  "name",
  "customerName",
  "accountName",
  "email",
  "userEmail",
  "revenue",
  "arr",
  "amount",
  "notes",
  "supportText",
  "content",
  "message",
]);

function sanitizeEventMetadata(
  metadata: Record<string, string | number | boolean | null> | undefined
): Record<string, string | number | boolean | null> | undefined {
  if (!metadata) return undefined;
  const clean: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_METADATA_KEYS.has(key)) continue;
    clean[key] = value;
  }
  return clean;
}

function parseStepArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

export async function getOnboardingSession(organizationId: string): Promise<OnboardingSession | null> {
  return prisma.onboardingSession.findUnique({ where: { organizationId } });
}

export async function startOrResumeOnboarding(params: {
  organizationId: string;
  actingUserId: string;
}): Promise<OnboardingSession> {
  const existing = await getOnboardingSession(params.organizationId);
  if (existing) {
    await trackOnboardingEvent({ organizationId: params.organizationId, userId: params.actingUserId, eventType: "onboarding_resumed" });
    return existing;
  }

  // Onboarding entry is where concurrent requests genuinely arrive: the
  // redirect after signup, a router prefetch, and a double-clicked link can all
  // reach here at once. The existence check above and this insert are not one
  // atomic operation, and neither is Prisma's upsert in every case, so the
  // only reliable pattern is to attempt the insert and treat a unique
  // violation as "someone else won the race" rather than as an error.
  let session: OnboardingSession;
  try {
    session = await prisma.onboardingSession.create({
      data: {
        organizationId: params.organizationId,
        status: "IN_PROGRESS",
        currentStep: ONBOARDING_STEPS[0].key,
        completedSteps: [],
        skippedSteps: [],
        goals: [],
        startedAt: new Date(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const winner = await getOnboardingSession(params.organizationId);
      if (winner) return winner;
    }
    throw error;
  }

  await trackOnboardingEvent({ organizationId: params.organizationId, userId: params.actingUserId, eventType: "onboarding_started" });
  return session;
}

export async function selectOnboardingPath(params: {
  organizationId: string;
  path: OnboardingPath;
  actingUserId: string;
  actingRole: Role;
}): Promise<OnboardingSession> {
  assertCan(params.actingRole, "manage_onboarding");
  const session = await getOnboardingSession(params.organizationId);
  if (!session) throw new OnboardingError("Onboarding has not been started for this organization.");

  const updated = await prisma.onboardingSession.update({
    where: { organizationId: params.organizationId },
    data: { path: params.path },
  });

  await trackOnboardingEvent({
    organizationId: params.organizationId,
    userId: params.actingUserId,
    eventType: "onboarding_path_selected",
    metadata: { path: params.path },
  });

  return updated;
}

export async function setOnboardingGoals(params: {
  organizationId: string;
  goals: OnboardingGoal[];
  actingUserId: string;
}): Promise<OnboardingSession> {
  const invalid = params.goals.filter((g) => !ONBOARDING_GOALS.includes(g));
  if (invalid.length > 0) throw new OnboardingError(`Unknown goal(s): ${invalid.join(", ")}`);

  const session = await getOnboardingSession(params.organizationId);
  if (!session) throw new OnboardingError("Onboarding has not been started for this organization.");

  const updated = await prisma.onboardingSession.update({
    where: { organizationId: params.organizationId },
    data: { goals: params.goals },
  });

  await trackOnboardingEvent({
    organizationId: params.organizationId,
    userId: params.actingUserId,
    eventType: "goal_selected",
    metadata: { count: params.goals.length },
  });

  return updated;
}

function assertStepRole(step: OnboardingStepDefinition, role: Role) {
  if (!step.allowedRoles.includes(role)) {
    throw new OnboardingError(`Role ${role} cannot complete the "${step.label}" step.`);
  }
}

export async function completeStep(params: {
  organizationId: string;
  stepKey: string;
  actingUserId: string;
  actingRole: Role;
}): Promise<OnboardingSession> {
  const step = requireStep(params.stepKey);
  assertStepRole(step, params.actingRole);

  const session = await getOnboardingSession(params.organizationId);
  if (!session) throw new OnboardingError("Onboarding has not been started for this organization.");

  const completed = new Set(parseStepArray(session.completedSteps));
  completed.add(step.key);
  const skipped = parseStepArray(session.skippedSteps).filter((k) => k !== step.key);

  const nextStep = recommendNextStep({ ...session, completedSteps: Array.from(completed), skippedSteps: skipped });

  const updated = await prisma.onboardingSession.update({
    where: { organizationId: params.organizationId },
    data: {
      completedSteps: Array.from(completed),
      skippedSteps: skipped,
      currentStep: nextStep ?? step.key,
    },
  });

  await trackOnboardingEvent({
    organizationId: params.organizationId,
    userId: params.actingUserId,
    eventType: "step_completed",
    metadata: { step: step.key },
  });

  return updated;
}

export async function skipStep(params: {
  organizationId: string;
  stepKey: string;
  actingUserId: string;
  actingRole: Role;
}): Promise<OnboardingSession> {
  const step = requireStep(params.stepKey);
  if (step.required) throw new OnboardingError(`"${step.label}" is required and cannot be skipped.`);
  assertStepRole(step, params.actingRole);

  const session = await getOnboardingSession(params.organizationId);
  if (!session) throw new OnboardingError("Onboarding has not been started for this organization.");

  const completedSteps = parseStepArray(session.completedSteps);
  if (completedSteps.includes(step.key)) return session; // already done — skipping a completed step is a no-op

  const skipped = new Set(parseStepArray(session.skippedSteps));
  skipped.add(step.key);

  const nextStep = recommendNextStep({ ...session, completedSteps, skippedSteps: Array.from(skipped) });

  const updated = await prisma.onboardingSession.update({
    where: { organizationId: params.organizationId },
    data: { skippedSteps: Array.from(skipped), currentStep: nextStep ?? step.key },
  });

  await trackOnboardingEvent({
    organizationId: params.organizationId,
    userId: params.actingUserId,
    eventType: "step_skipped",
    metadata: { step: step.key },
  });

  return updated;
}

/**
 * Read-only check: can the session's owner currently view this step? Used
 * by the [step] route to decide whether to render a step or bounce back to
 * the real current step — deliberately never mutates currentStep itself.
 * Reviewing an already-completed or already-skipped step is always fine;
 * jumping to a step that hasn't been reached yet is not.
 */
export function canNavigateToStep(session: Pick<OnboardingSession, "currentStep" | "completedSteps" | "skippedSteps">, stepKey: string): boolean {
  if (!STEP_BY_KEY.has(stepKey)) return false;
  const visited = new Set([...parseStepArray(session.completedSteps), ...parseStepArray(session.skippedSteps)]);
  if (visited.has(stepKey)) return true;

  const currentIndex = session.currentStep ? (STEP_ORDER.get(session.currentStep) ?? 0) : 0;
  const targetIndex = STEP_ORDER.get(stepKey)!;
  return targetIndex <= currentIndex;
}

export async function returnToStep(params: { organizationId: string; stepKey: string }): Promise<OnboardingSession> {
  const step = requireStep(params.stepKey);
  const session = await getOnboardingSession(params.organizationId);
  if (!session) throw new OnboardingError("Onboarding has not been started for this organization.");

  const visited = new Set([...parseStepArray(session.completedSteps), ...parseStepArray(session.skippedSteps)]);
  const currentIndex = session.currentStep ? (STEP_ORDER.get(session.currentStep) ?? 0) : 0;
  const targetIndex = STEP_ORDER.get(step.key)!;

  if (!visited.has(step.key) && targetIndex > currentIndex) {
    throw new OnboardingError("Cannot skip ahead to a step that hasn't been reached yet.");
  }

  return prisma.onboardingSession.update({ where: { organizationId: params.organizationId }, data: { currentStep: step.key } });
}

// ---------------------------------------------------------------------------
// Pure calculations — no DB access, safe to unit test directly
// ---------------------------------------------------------------------------

export interface OnboardingProgress {
  completedRequired: number;
  totalRequired: number;
  completedOptional: number;
  totalOptional: number;
  percentRequired: number;
}

export function calculateProgress(
  session: Pick<OnboardingSession, "completedSteps">
): OnboardingProgress {
  const completed = new Set(parseStepArray(session.completedSteps));
  const required = ONBOARDING_STEPS.filter((s) => s.required);
  const optional = ONBOARDING_STEPS.filter((s) => !s.required);
  const completedRequired = required.filter((s) => completed.has(s.key)).length;
  const completedOptional = optional.filter((s) => completed.has(s.key)).length;

  return {
    completedRequired,
    totalRequired: required.length,
    completedOptional,
    totalOptional: optional.length,
    percentRequired: required.length === 0 ? 100 : Math.round((completedRequired / required.length) * 100),
  };
}

/** First incomplete, unskipped step in registry order — required steps first-in-order still apply since the registry itself is ordered required-and-optional interleaved by workflow, not grouped. Returns null once every step is completed or (for optional steps) skipped. */
export function recommendNextStep(
  session: Pick<OnboardingSession, "completedSteps" | "skippedSteps">
): string | null {
  const completed = new Set(parseStepArray(session.completedSteps));
  const skipped = new Set(parseStepArray(session.skippedSteps));

  for (const step of ONBOARDING_STEPS) {
    if (completed.has(step.key)) continue;
    if (!step.required && skipped.has(step.key)) continue;
    return step.key;
  }
  return null;
}

export interface OnboardingReadiness {
  valid: boolean;
  missingSteps: string[];
}

export function validateReadyToComplete(
  session: Pick<OnboardingSession, "completedSteps">
): OnboardingReadiness {
  const completed = new Set(parseStepArray(session.completedSteps));
  const missingSteps = ONBOARDING_STEPS.filter((s) => s.required && !completed.has(s.key)).map((s) => s.key);
  return { valid: missingSteps.length === 0, missingSteps };
}

// ---------------------------------------------------------------------------
// Completion / reopen / demo reset
// ---------------------------------------------------------------------------

export async function completeOnboarding(params: {
  organizationId: string;
  actingUserId: string;
  actingRole: Role;
}): Promise<OnboardingSession> {
  assertCan(params.actingRole, "manage_onboarding");

  const session = await getOnboardingSession(params.organizationId);
  if (!session) throw new OnboardingError("Onboarding has not been started for this organization.");

  const readiness = validateReadyToComplete(session);
  if (!readiness.valid) {
    throw new OnboardingError(
      `Cannot complete onboarding — required steps still missing: ${readiness.missingSteps.join(", ")}.`
    );
  }

  const updated = await prisma.onboardingSession.update({
    where: { organizationId: params.organizationId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "organization_setting_changed",
    targetType: "OnboardingSession",
    metadata: { action: "onboarding_completed" },
  });
  await trackOnboardingEvent({ organizationId: params.organizationId, userId: params.actingUserId, eventType: "onboarding_completed" });

  return updated;
}

export async function reopenOnboarding(params: {
  organizationId: string;
  actingUserId: string;
  actingRole: Role;
}): Promise<OnboardingSession> {
  assertCan(params.actingRole, "manage_onboarding");

  const session = await getOnboardingSession(params.organizationId);
  if (!session) throw new OnboardingError("Onboarding has not been started for this organization.");
  if (session.status !== "COMPLETED") throw new OnboardingError("Onboarding is not completed yet — there's nothing to reopen.");

  return prisma.onboardingSession.update({
    where: { organizationId: params.organizationId },
    data: { status: "REOPENED", reopenedAt: new Date() },
  });
}

/** Only ever valid for organizations flagged isDemo — resetting a real customer's onboarding this way would destroy their genuine progress. */
export async function resetDemoOnboarding(organizationId: string): Promise<void> {
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!organization) throw new OnboardingError("Organization not found.");
  if (!organization.isDemo) throw new OnboardingError("Only demo organizations can be reset this way.");

  await prisma.$transaction([
    prisma.onboardingEvent.deleteMany({ where: { organizationId } }),
    prisma.setupChecklistItem.deleteMany({ where: { organizationId } }),
    prisma.onboardingSession.deleteMany({ where: { organizationId } }),
  ]);
}

// ---------------------------------------------------------------------------
// Local analytics
// ---------------------------------------------------------------------------

export async function trackOnboardingEvent(params: {
  organizationId: string;
  userId?: string | null;
  eventType: OnboardingEventType;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  await prisma.onboardingEvent.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId ?? null,
      eventType: params.eventType,
      metadata: sanitizeEventMetadata(params.metadata),
    },
  });
}

// ---------------------------------------------------------------------------
// Setup checklist
// ---------------------------------------------------------------------------

export async function upsertChecklistItem(params: {
  organizationId: string;
  key: string;
  label: string;
  description: string;
  required: boolean;
}) {
  return prisma.setupChecklistItem.upsert({
    where: { organizationId_key: { organizationId: params.organizationId, key: params.key } },
    create: {
      organizationId: params.organizationId,
      key: params.key,
      label: params.label,
      description: params.description,
      required: params.required,
    },
    update: { label: params.label, description: params.description, required: params.required },
  });
}

export async function resolveChecklistItem(params: { organizationId: string; key: string; actingUserId: string }) {
  const item = await prisma.setupChecklistItem.findUnique({
    where: { organizationId_key: { organizationId: params.organizationId, key: params.key } },
  });
  if (!item) throw new OnboardingError(`Checklist item not found: ${params.key}`);

  return prisma.setupChecklistItem.update({
    where: { id: item.id },
    data: { status: "COMPLETED", resolvedAt: new Date(), resolvedById: params.actingUserId },
  });
}

export async function getSetupChecklist(organizationId: string) {
  return prisma.setupChecklistItem.findMany({ where: { organizationId }, orderBy: { createdAt: "asc" } });
}

export type SetupReadinessLabel = "Ready" | "Usable" | "Limited" | "Needs Attention";

export async function calculateSetupReadiness(organizationId: string): Promise<{ label: SetupReadinessLabel; completedRequired: number; totalRequired: number }> {
  const items = await getSetupChecklist(organizationId);
  const required = items.filter((i) => i.required);
  const completedRequired = required.filter((i) => i.status === "COMPLETED").length;

  let label: SetupReadinessLabel;
  if (required.length === 0) label = "Needs Attention";
  else if (completedRequired === required.length) label = "Ready";
  else if (completedRequired / required.length >= 0.5) label = "Usable";
  else label = "Limited";

  return { label, completedRequired, totalRequired: required.length };
}

// ---------------------------------------------------------------------------
// First value moment
// ---------------------------------------------------------------------------

export async function determineFirstValueMoment(organizationId: string): Promise<{ reached: boolean; reason: string }> {
  const accountCount = await prisma.customerAccount.count({ where: { organizationId } });
  if (accountCount === 0) {
    return { reached: false, reason: "No customer accounts loaded yet." };
  }
  return { reached: true, reason: `${accountCount} customer account${accountCount === 1 ? "" : "s"} loaded.` };
}
