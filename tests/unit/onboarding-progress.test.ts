import { describe, expect, it } from "vitest";
import {
  ONBOARDING_STEPS,
  calculateProgress,
  canNavigateToStep,
  recommendNextStep,
  validateReadyToComplete,
} from "@/lib/services/onboarding-service";

describe("onboarding progress calculation (pure)", () => {
  it("reports zero progress for a brand-new session", () => {
    const progress = calculateProgress({ completedSteps: [] });
    expect(progress.completedRequired).toBe(0);
    expect(progress.totalRequired).toBe(ONBOARDING_STEPS.filter((s) => s.required).length);
    expect(progress.percentRequired).toBe(0);
  });

  it("reports full progress once every required step is completed", () => {
    const requiredKeys = ONBOARDING_STEPS.filter((s) => s.required).map((s) => s.key);
    const progress = calculateProgress({ completedSteps: requiredKeys });
    expect(progress.completedRequired).toBe(progress.totalRequired);
    expect(progress.percentRequired).toBe(100);
  });

  it("counts optional and required steps separately", () => {
    const progress = calculateProgress({ completedSteps: ["welcome", "renewal_data"] });
    expect(progress.completedRequired).toBe(1); // welcome
    expect(progress.completedOptional).toBe(1); // renewal_data
  });
});

describe("recommendNextStep (pure)", () => {
  it("recommends the first step for a brand-new session", () => {
    expect(recommendNextStep({ completedSteps: [], skippedSteps: [] })).toBe(ONBOARDING_STEPS[0].key);
  });

  it("skips over completed steps", () => {
    expect(recommendNextStep({ completedSteps: ["welcome"], skippedSteps: [] })).toBe(ONBOARDING_STEPS[1].key);
  });

  it("treats a skipped optional step as handled", () => {
    const next = recommendNextStep({ completedSteps: ["welcome", "organization_profile", "choose_data_path", "import_customer_accounts"], skippedSteps: ["renewal_data"] });
    expect(next).toBe("data_readiness");
  });

  it("returns null once every step is completed or skipped", () => {
    const completed = ONBOARDING_STEPS.filter((s) => s.required).map((s) => s.key);
    const skipped = ONBOARDING_STEPS.filter((s) => !s.required).map((s) => s.key);
    expect(recommendNextStep({ completedSteps: completed, skippedSteps: skipped })).toBeNull();
  });
});

describe("canNavigateToStep (pure) — regression test for a real bug found during browser verification", () => {
  // Bug: viewing an already-completed step's URL was silently rewinding
  // currentStep back to it (via a mutating navigation guard), undoing
  // forward progress. Fixed by making step-view checks read-only.
  it("allows viewing a step that has already been completed", () => {
    const session = { currentStep: "health_model", completedSteps: ["welcome", "organization_profile"], skippedSteps: [] };
    expect(canNavigateToStep(session, "welcome")).toBe(true);
  });

  it("allows viewing a step that has already been skipped", () => {
    const session = { currentStep: "data_readiness", completedSteps: ["welcome"], skippedSteps: ["renewal_data"] };
    expect(canNavigateToStep(session, "renewal_data")).toBe(true);
  });

  it("allows viewing the current step", () => {
    const session = { currentStep: "health_model", completedSteps: [], skippedSteps: [] };
    expect(canNavigateToStep(session, "health_model")).toBe(true);
  });

  it("blocks jumping ahead to a step that hasn't been reached yet", () => {
    const session = { currentStep: "welcome", completedSteps: [], skippedSteps: [] };
    expect(canNavigateToStep(session, "review_and_activate")).toBe(false);
  });

  it("rejects an unknown step key", () => {
    const session = { currentStep: "welcome", completedSteps: [], skippedSteps: [] };
    expect(canNavigateToStep(session, "not_a_real_step")).toBe(false);
  });
});

describe("validateReadyToComplete (pure)", () => {
  it("is not valid until every required step is complete", () => {
    const result = validateReadyToComplete({ completedSteps: ["welcome"] });
    expect(result.valid).toBe(false);
    expect(result.missingSteps).toContain("organization_profile");
  });

  it("does not require optional steps to be complete", () => {
    const requiredOnly = ONBOARDING_STEPS.filter((s) => s.required).map((s) => s.key);
    const result = validateReadyToComplete({ completedSteps: requiredOnly });
    expect(result.valid).toBe(true);
    expect(result.missingSteps).toHaveLength(0);
  });
});
