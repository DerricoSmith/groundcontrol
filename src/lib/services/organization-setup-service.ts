import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCan } from "@/lib/auth/permissions";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { trackOnboardingEvent } from "@/lib/services/onboarding-service";
import { DEFAULT_HEALTH_WEIGHTS, validateHealthWeights } from "@/lib/services/health-score-service";
import type { HealthComponentType, Role } from "@prisma/client";

export class OrganizationSetupError extends Error {}

export async function getSetupProfile(organizationId: string) {
  return prisma.organizationSetupProfile.findUnique({ where: { organizationId } });
}

export interface OrganizationProfileInput {
  companyWebsite?: string;
  industry?: string;
  businessModel?: string;
  arrRange?: string;
  accountCountRange?: string;
  csTeamSizeRange?: string;
  reportingCurrency?: string;
  timeZone?: string;
  contractModel?: string;
  renewalPeriod?: string;
  currentCrm?: string;
  currentSupportSystem?: string;
  currentBillingSystem?: string;
  currentAnalyticsSystem?: string;
  currentCsPlatform?: string;
  hasFormalHealthScore?: boolean;
  hasFormalRenewalForecast?: boolean;
  reviewsFeedbackRegularly?: boolean;
}

export async function saveOrganizationProfile(params: {
  organizationId: string;
  actingUserId: string;
  actingRole: Role;
  profile: OrganizationProfileInput;
}) {
  assertCan(params.actingRole, "manage_onboarding");

  const saved = await prisma.organizationSetupProfile.upsert({
    where: { organizationId: params.organizationId },
    create: { organizationId: params.organizationId, ...params.profile },
    update: params.profile,
  });

  await trackOnboardingEvent({
    organizationId: params.organizationId,
    userId: params.actingUserId,
    eventType: "step_completed",
    metadata: { step: "organization_profile" },
  });

  return saved;
}

export async function activateHealthModel(params: {
  organizationId: string;
  actingUserId: string;
  actingRole: Role;
  weights?: Partial<Record<HealthComponentType, number>>;
}) {
  assertCan(params.actingRole, "edit_health_model");

  const weights = params.weights ?? DEFAULT_HEALTH_WEIGHTS;
  const validation = validateHealthWeights(weights);
  if (!validation.valid) {
    throw new OrganizationSetupError(`Cannot activate health model: ${validation.error}`);
  }

  const isDefault = weights === DEFAULT_HEALTH_WEIGHTS;

  const profile = await prisma.organizationSetupProfile.upsert({
    where: { organizationId: params.organizationId },
    create: {
      organizationId: params.organizationId,
      healthModelActivated: true,
      healthModelWeights: isDefault ? undefined : (weights as Prisma.InputJsonValue),
    },
    update: {
      healthModelActivated: true,
      healthModelWeights: isDefault ? Prisma.JsonNull : (weights as Prisma.InputJsonValue),
    },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "health_model_changed",
    targetType: "OrganizationSetupProfile",
    metadata: { activated: true, customWeights: !isDefault },
  });
  await trackOnboardingEvent({
    organizationId: params.organizationId,
    userId: params.actingUserId,
    eventType: "health_model_activated",
  });

  return profile;
}

export async function saveExecutiveBriefConfig(params: {
  organizationId: string;
  actingUserId: string;
  actingRole: Role;
  config: { dayOfWeek: string; sections: string[]; approvalRequired: boolean };
}) {
  assertCan(params.actingRole, "manage_executive_brief");

  const profile = await prisma.organizationSetupProfile.upsert({
    where: { organizationId: params.organizationId },
    create: { organizationId: params.organizationId, executiveBriefConfig: params.config },
    update: { executiveBriefConfig: params.config },
  });

  await trackOnboardingEvent({
    organizationId: params.organizationId,
    userId: params.actingUserId,
    eventType: "step_completed",
    metadata: { step: "executive_brief_setup" },
  });

  return profile;
}
