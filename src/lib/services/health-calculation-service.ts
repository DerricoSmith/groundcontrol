import "server-only";
import type { HealthCategory, HealthComponentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_HEALTH_WEIGHTS, validateHealthWeights } from "@/lib/services/health-score-service";
import { getAccountMetrics, type AccountMetrics } from "@/lib/services/account-metrics-service";

/**
 * Deterministic per-account health calculation.
 *
 * The rules the founder set, implemented literally:
 *  - The numeric score is a weighted sum, nothing else. No AI touches it.
 *  - Every component carries its own evidence and its own confidence.
 *  - Missing data lowers confidence. It does NOT push an account toward
 *    Critical, and it never counts as good behavior — a component with no
 *    data scores at a documented neutral baseline and reports zero
 *    confidence, so the UI can say "we don't know" rather than "fine".
 *  - A severe risk stays visible separately from the score; nothing here
 *    suppresses a risk because the overall number looks acceptable.
 */

export const HEALTH_CALCULATION_VERSION = "health-v2-2026-07";

/**
 * Neutral baseline for a component with no supporting data. Deliberately
 * mid-scale: scoring 0 would fabricate a crisis, scoring 100 would
 * fabricate health. 50 says "no evidence either way", and the component's
 * confidence of 0 is what actually communicates the gap.
 */
const NO_DATA_BASELINE = 50;

export const DEFAULT_THRESHOLDS: Record<Exclude<HealthCategory, "CRITICAL">, number> = {
  STRONG: 80,
  STABLE: 65,
  WATCH: 50,
  AT_RISK: 35,
};

export interface ComponentResult {
  type: HealthComponentType;
  score: number;
  weight: number;
  confidence: number;
  explanation: string;
  evidence: string[];
}

export interface HealthCalculation {
  overallScore: number;
  category: HealthCategory;
  dataConfidence: number;
  components: ComponentResult[];
  calculationVersion: string;
  limitations: string[];
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function scoreProductAdoption(metrics: AccountMetrics): ComponentResult {
  const { usage } = metrics;
  const evidence = [...usage.evidence];

  if (usage.trend === "INSUFFICIENT_DATA") {
    return {
      type: "PRODUCT_ADOPTION",
      score: NO_DATA_BASELINE,
      weight: 0,
      confidence: 0,
      explanation: usage.explanation,
      evidence,
    };
  }

  // Start from adoption percentage when supplied, since it is the most
  // direct measure the customer's own system provides. Otherwise start
  // neutral and let movement decide.
  let score = usage.adoptionPercentage ?? NO_DATA_BASELINE;
  let confidence = usage.adoptionPercentage != null ? 0.6 : 0.3;

  if (usage.seatUtilizationPercentage != null) {
    score = (score + usage.seatUtilizationPercentage) / 2;
    confidence += 0.15;
    evidence.push(`Seat utilization ${usage.seatUtilizationPercentage.toFixed(0)}%.`);
  }

  switch (usage.trend) {
    case "INACTIVE":
      score = Math.min(score, 20);
      confidence = Math.max(confidence, 0.7);
      break;
    case "DECLINING":
      score -= Math.min(30, Math.abs(usage.changePercent ?? 0));
      confidence += 0.2;
      break;
    case "INCREASING":
      score += Math.min(15, (usage.changePercent ?? 0) / 2);
      confidence += 0.2;
      break;
    case "STABLE":
      confidence += 0.2;
      break;
  }

  return {
    type: "PRODUCT_ADOPTION",
    score: clamp(score),
    weight: 0,
    confidence: Math.min(1, confidence),
    explanation: usage.explanation,
    evidence,
  };
}

function scoreCustomerRelationship(metrics: AccountMetrics): ComponentResult {
  const { relationship } = metrics;
  const evidence = [...relationship.evidence];

  if (relationship.confidence === 0) {
    return {
      type: "CUSTOMER_RELATIONSHIP",
      score: NO_DATA_BASELINE,
      weight: 0,
      confidence: 0,
      explanation: "No contacts or interactions have been imported, so relationship strength cannot be assessed.",
      evidence,
    };
  }

  let score = NO_DATA_BASELINE;
  const reasons: string[] = [];

  const days = relationship.daysSinceMeaningfulInteraction;
  if (days === undefined) {
    score -= 15;
    reasons.push("no meaningful interaction has ever been recorded");
  } else if (days <= 30) {
    score += 20;
    reasons.push(`last meaningful interaction ${days} days ago`);
  } else if (days <= 60) {
    score += 5;
    reasons.push(`last meaningful interaction ${days} days ago`);
  } else if (days <= 90) {
    score -= 10;
    reasons.push(`last meaningful interaction ${days} days ago`);
  } else {
    score -= 25;
    reasons.push(`no meaningful interaction for ${days} days`);
  }

  if (relationship.hasExecutiveSponsor) {
    score += 10;
    reasons.push("an executive sponsor is on file");
  } else {
    score -= 10;
    reasons.push("no executive sponsor is on file");
  }

  if (relationship.hasChampion) {
    score += 10;
    reasons.push("a champion is on file");
  } else {
    score -= 5;
    reasons.push("no champion is on file");
  }

  if (relationship.departedChampionNames.length > 0) {
    score -= 15;
    reasons.push(`a champion has departed (${relationship.departedChampionNames.join(", ")})`);
  }

  if (relationship.executiveEngagement === "DISENGAGED") {
    score -= 15;
    reasons.push("executive engagement has lapsed");
  } else if (relationship.executiveEngagement === "COOLING") {
    score -= 5;
    reasons.push("executive engagement is cooling");
  }

  return {
    type: "CUSTOMER_RELATIONSHIP",
    score: clamp(score),
    weight: 0,
    confidence: relationship.confidence,
    explanation: `Relationship assessed because ${reasons.join(", ")}.`,
    evidence,
  };
}

function scoreSupportExperience(metrics: AccountMetrics): ComponentResult {
  const { support, openEscalations, criticalEscalations } = metrics;
  const evidence = [...support.evidence];

  if (support.trend === "INSUFFICIENT_DATA" && openEscalations === 0) {
    return {
      type: "SUPPORT_EXPERIENCE",
      score: NO_DATA_BASELINE,
      weight: 0,
      confidence: 0,
      explanation: support.explanation,
      evidence,
    };
  }

  let score = 75; // no open problems is genuinely a good support experience
  let confidence = support.ticketsAvailable > 0 ? 0.6 : 0.3;

  score -= support.openUrgentTickets * 20;
  score -= support.openHighPriorityTickets * 8;
  score -= support.reopenedTickets * 4;

  if (support.trend === "DETERIORATING") score -= 10;
  if (support.trend === "IMPROVING") score += 8;

  if (support.averageSatisfaction != null) {
    // Satisfaction arrives on the source system's own scale; a 1-5 scale is
    // the common case and is normalized here. Anything above 5 is assumed
    // to already be percentage-like.
    const normalized = support.averageSatisfaction <= 5 ? (support.averageSatisfaction / 5) * 100 : support.averageSatisfaction;
    score = (score + normalized) / 2;
    confidence += 0.2;
    evidence.push(`Average satisfaction ${support.averageSatisfaction.toFixed(1)}.`);
  }

  if (openEscalations > 0) {
    score -= criticalEscalations > 0 ? 30 : 15;
    confidence = Math.max(confidence, 0.7);
    evidence.push(`${openEscalations} open escalation${openEscalations === 1 ? "" : "s"}${criticalEscalations > 0 ? `, ${criticalEscalations} critical` : ""}.`);
  }

  const explanation =
    openEscalations > 0
      ? `${support.explanation} ${openEscalations} escalation${openEscalations === 1 ? " is" : "s are"} still open.`
      : support.explanation;

  return {
    type: "SUPPORT_EXPERIENCE",
    score: clamp(score),
    weight: 0,
    confidence: Math.min(1, confidence),
    explanation,
    evidence,
  };
}

async function scoreCommercialPosition(
  customerAccountId: string,
  now: Date
): Promise<ComponentResult> {
  const [account, renewal] = await Promise.all([
    prisma.customerAccount.findUnique({ where: { id: customerAccountId }, select: { renewalDate: true, arr: true } }),
    prisma.renewal.findFirst({
      where: { customerAccountId, status: { notIn: ["RENEWED", "CHURNED"] } },
      orderBy: { periodEnd: "asc" },
      include: { plan: { include: { milestones: true } } },
    }),
  ]);

  const evidence: string[] = [];
  const renewalDate = renewal?.periodEnd ?? account?.renewalDate ?? null;

  if (!renewalDate) {
    return {
      type: "COMMERCIAL_POSITION",
      score: NO_DATA_BASELINE,
      weight: 0,
      confidence: 0,
      explanation: "No renewal date is on file, so commercial position cannot be assessed.",
      evidence: ["No renewal record or account renewal date."],
    };
  }

  const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  evidence.push(`Renewal date ${renewalDate.toISOString().slice(0, 10)} (${daysUntilRenewal} days away).`);

  let score = 70;
  let confidence = 0.4;
  const reasons: string[] = [`renewal is ${daysUntilRenewal} days away`];

  if (renewal) {
    confidence += 0.2;
    evidence.push(`Renewal status ${renewal.status}, forecast ${renewal.forecastCategory}.`);

    switch (renewal.forecastCategory) {
      case "COMMITTED":
        score += 20;
        reasons.push("the renewal is forecast as committed");
        break;
      case "LIKELY":
        score += 10;
        reasons.push("the renewal is forecast as likely");
        break;
      case "AT_RISK":
        score -= 20;
        reasons.push("the renewal is forecast at risk");
        break;
      case "EXPECTED_CHURN":
        score -= 35;
        reasons.push("churn is expected");
        break;
      case "UNCERTAIN":
        score -= 5;
        reasons.push("the forecast is uncertain");
        break;
      default:
        break;
    }

    const milestones = renewal.plan?.milestones ?? [];
    const completed = milestones.filter((m) => m.completed).length;
    if (milestones.length > 0) {
      confidence += 0.2;
      const completion = completed / milestones.length;
      score += completion * 15;
      reasons.push(`${completed} of ${milestones.length} renewal milestones are complete`);
      evidence.push(`Renewal plan ${completed}/${milestones.length} milestones complete.`);
    } else if (daysUntilRenewal <= 90 && daysUntilRenewal >= 0) {
      score -= 15;
      reasons.push("no renewal plan exists inside the 90 day window");
      evidence.push("No renewal plan on file.");
    }
  } else if (daysUntilRenewal <= 90 && daysUntilRenewal >= 0) {
    score -= 15;
    reasons.push("no renewal record exists inside the 90 day window");
  }

  if (daysUntilRenewal < 0) {
    score -= 20;
    reasons.push("the renewal date has already passed without being closed");
  }

  return {
    type: "COMMERCIAL_POSITION",
    score: clamp(score),
    weight: 0,
    confidence: Math.min(1, confidence),
    explanation: `Commercial position assessed because ${reasons.join(", ")}.`,
    evidence,
  };
}

/**
 * Business Outcomes has no supporting data source in this phase — goals,
 * success plans, and outcome scores belong to a Success Plan module that
 * does not exist. Rather than invent evidence, this component always
 * reports the neutral baseline at zero confidence, which removes it from
 * the weighted average entirely (see normalizeWeights).
 */
function scoreBusinessOutcomes(): ComponentResult {
  return {
    type: "BUSINESS_OUTCOMES",
    score: NO_DATA_BASELINE,
    weight: 0,
    confidence: 0,
    explanation:
      "Business outcomes cannot be assessed yet. Goal tracking and success plans are not part of this release, so no evidence exists for this component.",
    evidence: [],
  };
}

/**
 * Re-weights so that components with no data do not drag the score toward
 * a fabricated middle. A component at zero confidence is excluded and its
 * weight is redistributed proportionally across components that do have
 * evidence. If nothing has evidence, the score is the neutral baseline at
 * zero overall confidence.
 */
function applyWeights(
  components: ComponentResult[],
  weights: Record<HealthComponentType, number>
): { overallScore: number; dataConfidence: number; weighted: ComponentResult[] } {
  const contributing = components.filter((c) => c.confidence > 0);

  if (contributing.length === 0) {
    return {
      overallScore: NO_DATA_BASELINE,
      dataConfidence: 0,
      weighted: components.map((c) => ({ ...c, weight: 0 })),
    };
  }

  const contributingWeight = contributing.reduce((sum, c) => sum + weights[c.type], 0);
  const weighted = components.map((c) => ({
    ...c,
    weight: c.confidence > 0 ? weights[c.type] / contributingWeight : 0,
  }));

  const overallScore = weighted.reduce((sum, c) => sum + c.score * c.weight, 0);

  // Overall confidence blends how confident each contributing component is
  // with how much of the model's intended weight is actually covered.
  const weightedConfidence = contributing.reduce((sum, c) => sum + c.confidence * weights[c.type], 0) / contributingWeight;
  const coverage = contributingWeight; // weights sum to 1, so this is literally the fraction covered
  const dataConfidence = weightedConfidence * coverage;

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    dataConfidence: Math.round(dataConfidence * 100) / 100,
    weighted,
  };
}

export function categorize(score: number, thresholds = DEFAULT_THRESHOLDS): HealthCategory {
  if (score >= thresholds.STRONG) return "STRONG";
  if (score >= thresholds.STABLE) return "STABLE";
  if (score >= thresholds.WATCH) return "WATCH";
  if (score >= thresholds.AT_RISK) return "AT_RISK";
  return "CRITICAL";
}

export async function calculateAccountHealth(params: {
  customerAccountId: string;
  weights?: Record<HealthComponentType, number>;
  thresholds?: typeof DEFAULT_THRESHOLDS;
  now?: Date;
}): Promise<HealthCalculation> {
  const now = params.now ?? new Date();
  const weights = params.weights ?? DEFAULT_HEALTH_WEIGHTS;

  const validation = validateHealthWeights(weights);
  if (!validation.valid) {
    throw new Error(`Cannot calculate health with invalid weights: ${validation.error}`);
  }

  const metrics = await getAccountMetrics(params.customerAccountId, now);

  const components: ComponentResult[] = [
    scoreProductAdoption(metrics),
    scoreCustomerRelationship(metrics),
    scoreSupportExperience(metrics),
    await scoreCommercialPosition(params.customerAccountId, now),
    scoreBusinessOutcomes(),
  ];

  const { overallScore, dataConfidence, weighted } = applyWeights(components, weights);

  const limitations = weighted
    .filter((c) => c.confidence === 0)
    .map((c) => `${c.type.replace(/_/g, " ").toLowerCase()}: ${c.explanation}`);

  return {
    overallScore,
    category: categorize(overallScore, params.thresholds),
    dataConfidence,
    components: weighted,
    calculationVersion: HEALTH_CALCULATION_VERSION,
    limitations,
  };
}

/**
 * Calculates and persists a health snapshot, recording the previous value
 * and a change reason so history is explainable rather than a bare series
 * of numbers.
 */
export async function recalculateAndStoreHealth(params: {
  organizationId: string;
  customerAccountId: string;
  now?: Date;
}): Promise<HealthCalculation> {
  const now = params.now ?? new Date();
  const profile = await prisma.organizationSetupProfile.findUnique({
    where: { organizationId: params.organizationId },
    select: { healthModelWeights: true },
  });
  const activeVersion = await prisma.healthModelVersion.findFirst({
    where: { organizationId: params.organizationId, isActive: true },
  });

  const weights =
    (activeVersion?.weights as Record<HealthComponentType, number> | null) ??
    (profile?.healthModelWeights as Record<HealthComponentType, number> | null) ??
    undefined;

  const calculation = await calculateAccountHealth({
    customerAccountId: params.customerAccountId,
    weights,
    thresholds: (activeVersion?.thresholds as typeof DEFAULT_THRESHOLDS | null) ?? undefined,
    now: params.now,
  });

  const previous = await prisma.healthScoreSnapshot.findFirst({
    where: { customerAccountId: params.customerAccountId },
    orderBy: { calculatedAt: "desc" },
  });

  const changeReason = previous
    ? describeChange(previous.overallScore, calculation)
    : "First health calculation for this account.";

  await prisma.healthScoreSnapshot.create({
    data: {
      organizationId: params.organizationId,
      customerAccountId: params.customerAccountId,
      overallScore: calculation.overallScore,
      category: calculation.category,
      previousScore: previous?.overallScore,
      previousCategory: previous?.category,
      changeReason,
      dataConfidence: calculation.dataConfidence,
      calculationVersion: calculation.calculationVersion,
      healthModelVersionId: activeVersion?.id,
      components: calculation.components as unknown as object[],
    },
  });

  // Keep the denormalized fields on CustomerAccount aligned so Portfolio
  // and risk rules that read the account directly stay consistent.
  await prisma.customerAccount.update({
    where: { id: params.customerAccountId },
    data: {
      healthCategory: calculation.category,
      dataConfidence: calculation.dataConfidence,
      // Stamping this is what makes the category above a real assessment
      // rather than the storage default.
      healthCalculatedAt: now,
    },
  });

  return calculation;
}

function describeChange(previousScore: number, calculation: HealthCalculation): string {
  const delta = calculation.overallScore - previousScore;
  if (Math.abs(delta) < 1) return "Score is broadly unchanged since the previous calculation.";

  // Name the component that moved the score most, so "why did this change"
  // is answerable without diffing two snapshots by hand.
  const biggest = [...calculation.components]
    .filter((c) => c.confidence > 0)
    .sort((a, b) => b.weight * b.score - a.weight * a.score)[0];

  const direction = delta > 0 ? "rose" : "fell";
  const label = biggest ? biggest.type.replace(/_/g, " ").toLowerCase() : "available evidence";
  return `Score ${direction} ${Math.abs(delta).toFixed(1)} points. Largest weighted contribution: ${label}.`;
}

export async function recalculateOrganizationHealth(organizationId: string, now = new Date()): Promise<number> {
  const accounts = await prisma.customerAccount.findMany({
    where: { organizationId },
    select: { id: true },
  });

  for (const account of accounts) {
    await recalculateAndStoreHealth({ organizationId, customerAccountId: account.id, now });
  }
  return accounts.length;
}
