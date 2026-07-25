import "server-only";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCan } from "@/lib/auth/permissions";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { trackOnboardingEvent } from "@/lib/services/onboarding-service";
import { RISK_RULE_BY_KEY, listRuleAvailability, evaluateOrganizationRisks } from "@/lib/services/risk-engine";

/**
 * Thin onboarding-facing wrapper over the real risk engine.
 *
 * This file used to hold its own hardcoded catalog with eleven permanently
 * unavailable stubs. That catalog is gone: availability and evaluation now
 * come from risk-engine.ts, so the onboarding screen and the Risk Radar
 * can never disagree about which rules are usable.
 */

export class RiskRuleError extends Error {}

export interface RiskRuleStatus {
  key: string;
  label: string;
  monitors: string;
  requiredData: string;
  available: boolean;
  activated: boolean;
  unavailableReason: string;
}

export async function listRiskRuleStatus(organizationId: string): Promise<RiskRuleStatus[]> {
  const availability = await listRuleAvailability(organizationId);
  const profile = await prisma.organizationSetupProfile.findUnique({ where: { organizationId } });
  const activated = new Set((profile?.activatedRiskRuleKeys as string[] | undefined) ?? []);

  return availability.map((rule) => ({
    key: rule.key,
    label: rule.label,
    monitors: rule.purpose,
    requiredData: rule.requiredData,
    available: rule.available,
    activated: activated.has(rule.key),
    unavailableReason: rule.unavailableReason,
  }));
}

/**
 * Activating a rule during onboarding records the choice and then runs a
 * full evaluation, so the user immediately sees real signals rather than a
 * promise that something will happen later.
 */
export async function activateRiskRule(params: {
  organizationId: string;
  ruleKey: string;
  actingUserId: string;
  actingRole: Role;
}): Promise<{ signalsCreated: number }> {
  assertCan(params.actingRole, "edit_health_model");

  const rule = RISK_RULE_BY_KEY.get(params.ruleKey);
  if (!rule) throw new RiskRuleError(`Unknown risk rule: ${params.ruleKey}`);

  const available = await rule.isAvailable(params.organizationId);
  if (!available) {
    throw new RiskRuleError(`"${rule.label}" cannot be activated yet. ${rule.unavailableReason}`);
  }

  await prisma.riskRuleConfiguration.upsert({
    where: { organizationId_ruleKey: { organizationId: params.organizationId, ruleKey: rule.key } },
    create: { organizationId: params.organizationId, ruleKey: rule.key, enabled: true },
    update: { enabled: true },
  });

  const profile = await prisma.organizationSetupProfile.upsert({
    where: { organizationId: params.organizationId },
    create: { organizationId: params.organizationId, activatedRiskRuleKeys: [rule.key] },
    update: {},
  });
  const current = new Set((profile.activatedRiskRuleKeys as string[] | undefined) ?? []);
  if (!current.has(rule.key)) {
    current.add(rule.key);
    await prisma.organizationSetupProfile.update({
      where: { organizationId: params.organizationId },
      data: { activatedRiskRuleKeys: Array.from(current) },
    });
  }

  const before = await prisma.riskSignal.count({ where: { organizationId: params.organizationId } });
  await evaluateOrganizationRisks({
    organizationId: params.organizationId,
    actingUserId: params.actingUserId,
    actingRole: params.actingRole,
    triggerSource: "onboarding",
  });
  const after = await prisma.riskSignal.count({ where: { organizationId: params.organizationId } });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "risk_created",
    targetType: "RiskRule",
    targetId: rule.key,
    metadata: { rule: rule.key, signalsCreated: after - before },
  });
  await trackOnboardingEvent({
    organizationId: params.organizationId,
    userId: params.actingUserId,
    eventType: "risk_rule_activated",
    metadata: { rule: rule.key },
  });

  return { signalsCreated: Math.max(0, after - before) };
}
