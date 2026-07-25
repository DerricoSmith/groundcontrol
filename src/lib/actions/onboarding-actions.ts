"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { OnboardingPath } from "@prisma/client";
import { getCurrentMembership } from "@/lib/auth/session";
import {
  OnboardingError,
  completeOnboarding,
  completeStep,
  ONBOARDING_GOALS,
  type OnboardingGoal,
  resolveChecklistItem,
  selectOnboardingPath,
  setOnboardingGoals,
  skipStep,
  upsertChecklistItem,
} from "@/lib/services/onboarding-service";
import { getSetupProfile, saveOrganizationProfile, activateHealthModel, saveExecutiveBriefConfig, type OrganizationProfileInput } from "@/lib/services/organization-setup-service";
import { prisma } from "@/lib/prisma";
import {
  parseCustomerAccountCsv,
  importCustomerAccounts,
  validateFile,
  CsvImportError,
  type ImportSummary,
} from "@/lib/services/csv-import-service";
import { activateRiskRule, RiskRuleError } from "@/lib/services/risk-rule-service";
import { generatePreviewBrief } from "@/lib/services/executive-brief-service";

async function requireMembership() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  return membership;
}

export interface ActionResult {
  error?: string;
}

export async function saveGoalsAndPathAction(formData: FormData): Promise<ActionResult> {
  const membership = await requireMembership();
  const goals = formData.getAll("goals").filter((g): g is string => typeof g === "string") as OnboardingGoal[];
  const invalid = goals.filter((g) => !ONBOARDING_GOALS.includes(g));
  if (invalid.length > 0) return { error: "Invalid goal selection." };

  const path = String(formData.get("path") ?? "QUICK_START") as OnboardingPath;

  try {
    await setOnboardingGoals({ organizationId: membership.organizationId, goals, actingUserId: membership.userId });
    await selectOnboardingPath({ organizationId: membership.organizationId, path, actingUserId: membership.userId, actingRole: membership.role });
    await completeStep({ organizationId: membership.organizationId, stepKey: "welcome", actingUserId: membership.userId, actingRole: membership.role });
  } catch (error) {
    if (error instanceof OnboardingError) return { error: error.message };
    throw error;
  }

  redirect("/onboarding");
}

export async function saveProfileAction(formData: FormData): Promise<ActionResult> {
  const membership = await requireMembership();
  const profile: OrganizationProfileInput = {
    companyWebsite: String(formData.get("companyWebsite") ?? "") || undefined,
    industry: String(formData.get("industry") ?? "") || undefined,
    businessModel: String(formData.get("businessModel") ?? "") || undefined,
    arrRange: String(formData.get("arrRange") ?? "") || undefined,
    accountCountRange: String(formData.get("accountCountRange") ?? "") || undefined,
    csTeamSizeRange: String(formData.get("csTeamSizeRange") ?? "") || undefined,
    reportingCurrency: String(formData.get("reportingCurrency") ?? "USD"),
    timeZone: String(formData.get("timeZone") ?? "") || undefined,
    currentCrm: String(formData.get("currentCrm") ?? "") || undefined,
    hasFormalHealthScore: formData.get("hasFormalHealthScore") === "on",
    hasFormalRenewalForecast: formData.get("hasFormalRenewalForecast") === "on",
  };

  try {
    await saveOrganizationProfile({ organizationId: membership.organizationId, actingUserId: membership.userId, actingRole: membership.role, profile });
    await completeStep({ organizationId: membership.organizationId, stepKey: "organization_profile", actingUserId: membership.userId, actingRole: membership.role });
  } catch (error) {
    if (error instanceof OnboardingError) return { error: error.message };
    throw error;
  }

  redirect("/onboarding");
}

export async function completeDataPathStepAction(): Promise<void> {
  const membership = await requireMembership();
  await completeStep({ organizationId: membership.organizationId, stepKey: "choose_data_path", actingUserId: membership.userId, actingRole: membership.role });
  redirect("/onboarding");
}

export interface ImportPreviewResult {
  error?: string;
  fileName?: string;
  csvText?: string;
  validRowCount?: number;
  errorCount?: number;
  errors?: { rowNumber: number; message: string }[];
  sampleNames?: string[];
}

export async function previewImportAction(formData: FormData): Promise<ImportPreviewResult> {
  await requireMembership();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Choose a CSV file." };

  try {
    validateFile({ fileName: file.name, sizeBytes: file.size });
    const csvText = await file.text();
    const parsed = parseCustomerAccountCsv(csvText);
    return {
      fileName: file.name,
      csvText,
      validRowCount: parsed.validRows.length,
      errorCount: parsed.errors.length,
      errors: parsed.errors.slice(0, 25),
      sampleNames: parsed.validRows.slice(0, 5).map((r) => r.name),
    };
  } catch (error) {
    if (error instanceof CsvImportError) return { error: error.message };
    throw error;
  }
}

export interface CommitImportResult {
  error?: string;
  summary?: ImportSummary;
}

export async function commitImportAction(fileName: string, csvText: string): Promise<CommitImportResult> {
  const membership = await requireMembership();
  try {
    const parsed = parseCustomerAccountCsv(csvText);
    const summary = await importCustomerAccounts({
      organizationId: membership.organizationId,
      actingUserId: membership.userId,
      fileName,
      parseResult: parsed,
    });
    await completeStep({ organizationId: membership.organizationId, stepKey: "import_customer_accounts", actingUserId: membership.userId, actingRole: membership.role });
    revalidatePath("/onboarding");
    return { summary };
  } catch (error) {
    if (error instanceof CsvImportError || error instanceof OnboardingError) return { error: error.message };
    throw error;
  }
}

export async function deferRenewalDataAction(): Promise<void> {
  const membership = await requireMembership();
  await skipStep({ organizationId: membership.organizationId, stepKey: "renewal_data", actingUserId: membership.userId, actingRole: membership.role });
  redirect("/onboarding");
}

export async function completeDataReadinessStepAction(): Promise<void> {
  const membership = await requireMembership();
  await completeStep({ organizationId: membership.organizationId, stepKey: "data_readiness", actingUserId: membership.userId, actingRole: membership.role });
  redirect("/onboarding");
}

export async function activateRecommendedHealthModelAction(): Promise<ActionResult> {
  const membership = await requireMembership();
  try {
    await activateHealthModel({ organizationId: membership.organizationId, actingUserId: membership.userId, actingRole: membership.role });
    await completeStep({ organizationId: membership.organizationId, stepKey: "health_model", actingUserId: membership.userId, actingRole: membership.role });
  } catch (error) {
    if (error instanceof OnboardingError) return { error: error.message };
    throw error;
  }
  redirect("/onboarding");
}

export async function activateRiskRuleAction(ruleKey: string): Promise<ActionResult & { signalsCreated?: number }> {
  const membership = await requireMembership();
  try {
    const result = await activateRiskRule({ organizationId: membership.organizationId, ruleKey, actingUserId: membership.userId, actingRole: membership.role });
    revalidatePath("/onboarding/risk_preferences");
    return { signalsCreated: result.signalsCreated };
  } catch (error) {
    if (error instanceof RiskRuleError) return { error: error.message };
    throw error;
  }
}

export async function completeRiskPreferencesStepAction(): Promise<void> {
  const membership = await requireMembership();
  await completeStep({ organizationId: membership.organizationId, stepKey: "risk_preferences", actingUserId: membership.userId, actingRole: membership.role });
  redirect("/onboarding");
}

export async function saveBriefConfigAction(formData: FormData): Promise<ActionResult> {
  const membership = await requireMembership();
  const sections = formData.getAll("sections").filter((s): s is string => typeof s === "string");
  const dayOfWeek = String(formData.get("dayOfWeek") ?? "Monday");
  const approvalRequired = formData.get("approvalRequired") === "on";

  try {
    await saveExecutiveBriefConfig({
      organizationId: membership.organizationId,
      actingUserId: membership.userId,
      actingRole: membership.role,
      config: { dayOfWeek, sections, approvalRequired },
    });
    await completeStep({ organizationId: membership.organizationId, stepKey: "executive_brief_setup", actingUserId: membership.userId, actingRole: membership.role });
  } catch (error) {
    if (error instanceof OnboardingError) return { error: error.message };
    throw error;
  }
  redirect("/onboarding");
}

export async function skipExecutiveBriefSetupAction(): Promise<void> {
  const membership = await requireMembership();
  await skipStep({ organizationId: membership.organizationId, stepKey: "executive_brief_setup", actingUserId: membership.userId, actingRole: membership.role });
  redirect("/onboarding");
}

export async function skipTeamInvitationsStepAction(): Promise<void> {
  const membership = await requireMembership();
  await skipStep({ organizationId: membership.organizationId, stepKey: "team_invitations", actingUserId: membership.userId, actingRole: membership.role });
  redirect("/onboarding");
}

export async function completeTeamInvitationsStepAction(): Promise<void> {
  const membership = await requireMembership();
  await completeStep({ organizationId: membership.organizationId, stepKey: "team_invitations", actingUserId: membership.userId, actingRole: membership.role });
  redirect("/onboarding");
}

const DEFAULT_CHECKLIST_ITEMS = [
  { key: "import_customer_accounts", label: "Import customer accounts", description: "Bring your customer list into Ground Control.", required: true },
  { key: "add_renewal_dates", label: "Add renewal dates", description: "Renewal Center and forecasting need this to work.", required: false },
  { key: "assign_account_owners", label: "Assign account owners", description: "Know who's responsible for each account.", required: false },
  { key: "activate_health_model", label: "Activate a health model", description: "See which accounts need attention.", required: true },
  { key: "activate_risk_rules", label: "Activate risk rules", description: "Start detecting risk automatically.", required: false },
  { key: "invite_team", label: "Invite your team", description: "Bring your Customer Success team into Ground Control.", required: false },
  { key: "review_first_executive_brief", label: "Review your first Executive Brief", description: "See what leadership will see.", required: false },
] as const;

export async function activateOnboardingAction(): Promise<ActionResult> {
  const membership = await requireMembership();
  try {
    // Reaching this step and choosing to activate IS how "review_and_activate"
    // gets completed — nothing else marks it done, so without this call its
    // own required-step check could never pass.
    await completeStep({ organizationId: membership.organizationId, stepKey: "review_and_activate", actingUserId: membership.userId, actingRole: membership.role });
    await completeOnboarding({ organizationId: membership.organizationId, actingUserId: membership.userId, actingRole: membership.role });

    for (const item of DEFAULT_CHECKLIST_ITEMS) {
      await upsertChecklistItem({ organizationId: membership.organizationId, ...item });
    }

    // Checklist items should reflect what onboarding already accomplished,
    // not start blank and force the owner to re-confirm things they just
    // did — see founder's "automatically updated where possible."
    const [accountCount, ownedAccountCount, profile, accountsWithRenewalDateCount, invitationCount] = await Promise.all([
      prisma.customerAccount.count({ where: { organizationId: membership.organizationId } }),
      prisma.customerAccount.count({ where: { organizationId: membership.organizationId, ownerId: { not: null } } }),
      getSetupProfile(membership.organizationId),
      prisma.customerAccount.count({ where: { organizationId: membership.organizationId, renewalDate: { not: null } } }),
      prisma.organizationInvitation.count({ where: { organizationId: membership.organizationId } }),
    ]);
    const activatedRiskRuleKeys = (profile?.activatedRiskRuleKeys as string[] | undefined) ?? [];

    const alreadyDone: Record<string, boolean> = {
      import_customer_accounts: accountCount > 0,
      add_renewal_dates: accountsWithRenewalDateCount > 0,
      assign_account_owners: ownedAccountCount > 0,
      activate_health_model: profile?.healthModelActivated ?? false,
      activate_risk_rules: activatedRiskRuleKeys.length > 0,
      invite_team: invitationCount > 0,
    };
    for (const [key, done] of Object.entries(alreadyDone)) {
      if (done) await resolveChecklistItem({ organizationId: membership.organizationId, key, actingUserId: membership.userId });
    }

    await generatePreviewBrief({ organizationId: membership.organizationId, actingUserId: membership.userId, actingRole: membership.role });
  } catch (error) {
    if (error instanceof OnboardingError) return { error: error.message };
    throw error;
  }
  redirect("/onboarding/first-value");
}
