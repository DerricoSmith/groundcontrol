import { describe, expect, it } from "vitest";
import {
  DEFAULT_HEALTH_WEIGHTS,
  calculateOverallScore,
  validateHealthWeights,
} from "@/lib/services/health-score-service";

describe("health score weight validation", () => {
  it("the default weight set sums to exactly 100 percent", () => {
    const result = validateHealthWeights(DEFAULT_HEALTH_WEIGHTS);
    expect(result.valid).toBe(true);
    expect(result.sum).toBeCloseTo(1, 9);
  });

  it("matches PRODUCT.md's documented split: 30/20/20/20/10", () => {
    expect(DEFAULT_HEALTH_WEIGHTS.PRODUCT_ADOPTION).toBe(0.3);
    expect(DEFAULT_HEALTH_WEIGHTS.CUSTOMER_RELATIONSHIP).toBe(0.2);
    expect(DEFAULT_HEALTH_WEIGHTS.SUPPORT_EXPERIENCE).toBe(0.2);
    expect(DEFAULT_HEALTH_WEIGHTS.COMMERCIAL_POSITION).toBe(0.2);
    expect(DEFAULT_HEALTH_WEIGHTS.BUSINESS_OUTCOMES).toBe(0.1);
  });

  it("rejects a weight set that does not sum to 100 percent", () => {
    const result = validateHealthWeights({
      PRODUCT_ADOPTION: 0.3,
      CUSTOMER_RELATIONSHIP: 0.2,
      SUPPORT_EXPERIENCE: 0.2,
      COMMERCIAL_POSITION: 0.2,
      BUSINESS_OUTCOMES: 0.2, // sums to 1.1
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/must sum to 1/);
  });

  it("rejects a weight set missing a required component", () => {
    const result = validateHealthWeights({
      PRODUCT_ADOPTION: 0.5,
      CUSTOMER_RELATIONSHIP: 0.5,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Missing weight/);
  });

  it("rejects a negative weight even if the set still sums to 1", () => {
    const result = validateHealthWeights({
      PRODUCT_ADOPTION: 0.5,
      CUSTOMER_RELATIONSHIP: 0.5,
      SUPPORT_EXPERIENCE: 0.3,
      COMMERCIAL_POSITION: 0.0,
      BUSINESS_OUTCOMES: -0.3,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/negative/);
  });

  it("accepts a custom organization-specific weight set that still sums to 100 percent", () => {
    const custom = {
      PRODUCT_ADOPTION: 0.4,
      CUSTOMER_RELATIONSHIP: 0.15,
      SUPPORT_EXPERIENCE: 0.15,
      COMMERCIAL_POSITION: 0.2,
      BUSINESS_OUTCOMES: 0.1,
    };
    expect(validateHealthWeights(custom).valid).toBe(true);
  });
});

describe("health score calculation", () => {
  it("is deterministic — identical inputs always produce identical output", () => {
    const scores = {
      PRODUCT_ADOPTION: 70,
      CUSTOMER_RELATIONSHIP: 60,
      SUPPORT_EXPERIENCE: 80,
      COMMERCIAL_POSITION: 90,
      BUSINESS_OUTCOMES: 50,
    };
    const first = calculateOverallScore(scores);
    const second = calculateOverallScore(scores);
    expect(first).toBe(second);
  });

  it("computes the documented weighted sum correctly", () => {
    const scores = {
      PRODUCT_ADOPTION: 100,
      CUSTOMER_RELATIONSHIP: 100,
      SUPPORT_EXPERIENCE: 100,
      COMMERCIAL_POSITION: 100,
      BUSINESS_OUTCOMES: 100,
    };
    // All components perfect -> overall must be exactly 100, regardless of weighting.
    expect(calculateOverallScore(scores)).toBe(100);
  });

  it("weights PRODUCT_ADOPTION most heavily by default", () => {
    const baseline = {
      PRODUCT_ADOPTION: 0,
      CUSTOMER_RELATIONSHIP: 0,
      SUPPORT_EXPERIENCE: 0,
      COMMERCIAL_POSITION: 0,
      BUSINESS_OUTCOMES: 0,
    };
    const adoptionOnly = calculateOverallScore({ ...baseline, PRODUCT_ADOPTION: 100 });
    const outcomesOnly = calculateOverallScore({ ...baseline, BUSINESS_OUTCOMES: 100 });
    expect(adoptionOnly).toBeGreaterThan(outcomesOnly);
    expect(adoptionOnly).toBe(30);
    expect(outcomesOnly).toBe(10);
  });

  it("refuses to calculate a score with an invalid weight set", () => {
    const scores = {
      PRODUCT_ADOPTION: 50,
      CUSTOMER_RELATIONSHIP: 50,
      SUPPORT_EXPERIENCE: 50,
      COMMERCIAL_POSITION: 50,
      BUSINESS_OUTCOMES: 50,
    };
    expect(() =>
      calculateOverallScore(scores, {
        PRODUCT_ADOPTION: 0.5,
        CUSTOMER_RELATIONSHIP: 0.5,
        SUPPORT_EXPERIENCE: 0.5,
        COMMERCIAL_POSITION: 0.5,
        BUSINESS_OUTCOMES: 0.5,
      })
    ).toThrow(/invalid weights/);
  });
});
