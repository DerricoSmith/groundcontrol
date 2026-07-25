import "server-only";
import type { HealthComponentType } from "@prisma/client";

/**
 * Default component weights — DESIGN_SYSTEM.md / PRODUCT.md §Health scoring.
 * An organization may override these (Phase 6, not yet built), but any
 * weight set — default or custom — must pass validateHealthWeights before
 * it can be activated. The numeric score itself is always this deterministic
 * weighted sum; AI may explain a score, never silently recompute it.
 */
export const DEFAULT_HEALTH_WEIGHTS: Record<HealthComponentType, number> = {
  PRODUCT_ADOPTION: 0.3,
  CUSTOMER_RELATIONSHIP: 0.2,
  SUPPORT_EXPERIENCE: 0.2,
  COMMERCIAL_POSITION: 0.2,
  BUSINESS_OUTCOMES: 0.1,
};

const WEIGHT_SUM_TOLERANCE = 1e-9;

export interface HealthWeightValidationResult {
  valid: boolean;
  sum: number;
  error?: string;
}

/**
 * A weight set is only valid if every one of the five components is present
 * exactly once and the weights sum to 1 (100%). Floating point sums are
 * compared with a small tolerance rather than strict equality.
 */
export function validateHealthWeights(
  weights: Partial<Record<HealthComponentType, number>>
): HealthWeightValidationResult {
  const requiredTypes: HealthComponentType[] = [
    "PRODUCT_ADOPTION",
    "CUSTOMER_RELATIONSHIP",
    "SUPPORT_EXPERIENCE",
    "COMMERCIAL_POSITION",
    "BUSINESS_OUTCOMES",
  ];

  const missing = requiredTypes.filter((type) => weights[type] === undefined);
  if (missing.length > 0) {
    const sum = requiredTypes.reduce((total, type) => total + (weights[type] ?? 0), 0);
    return { valid: false, sum, error: `Missing weight for: ${missing.join(", ")}` };
  }

  const sum = requiredTypes.reduce((total, type) => total + (weights[type] ?? 0), 0);
  if (Math.abs(sum - 1) > WEIGHT_SUM_TOLERANCE) {
    return { valid: false, sum, error: `Weights must sum to 1 (100%); got ${sum}.` };
  }

  const negative = requiredTypes.filter((type) => (weights[type] ?? 0) < 0);
  if (negative.length > 0) {
    return { valid: false, sum, error: `Weights cannot be negative: ${negative.join(", ")}` };
  }

  return { valid: true, sum };
}

/**
 * Deterministic weighted sum — same inputs always produce the same score.
 * Component scores are expected on a 0–100 scale; the result is 0–100.
 * Throws if the weight set is invalid, so a bad configuration can never
 * silently produce a misleading score.
 */
export function calculateOverallScore(
  componentScores: Record<HealthComponentType, number>,
  weights: Record<HealthComponentType, number> = DEFAULT_HEALTH_WEIGHTS
): number {
  const validation = validateHealthWeights(weights);
  if (!validation.valid) {
    throw new Error(`Cannot calculate health score with invalid weights: ${validation.error}`);
  }

  const total = (Object.keys(weights) as HealthComponentType[]).reduce(
    (sum, type) => sum + componentScores[type] * weights[type],
    0
  );
  return Math.round(total * 100) / 100;
}
