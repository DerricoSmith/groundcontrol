import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Button } from "@/components/ui/button";
import { StepHeader } from "./step-header";
import { ONBOARDING_GOALS, type OnboardingGoal } from "@/lib/services/onboarding-service";
import { saveGoalsAndPathAction } from "@/lib/actions/onboarding-actions";

const GOAL_LABELS: Record<OnboardingGoal, string> = {
  identify_renewal_risk_earlier: "Identify renewal risk earlier",
  improve_customer_health_visibility: "Improve customer health visibility",
  increase_product_adoption: "Increase product adoption",
  strengthen_renewal_forecasting: "Strengthen renewal forecasting",
  understand_customer_feedback: "Understand customer feedback",
  create_better_executive_reporting: "Improve executive reporting",
  improve_team_accountability: "Improve team accountability",
  build_customer_success_operations: "Build Customer Success operations",
};

const PATHS = [
  { value: "QUICK_START", label: "Quick Start", available: true, description: "The fastest way to see value. Import your accounts and see a real portfolio today." },
  { value: "GUIDED_SETUP", label: "Guided Setup", available: false, description: "Define your customer operating model before activating. Not available in this local build yet." },
  { value: "ASSISTED_SETUP", label: "Signal & State Assisted Setup", available: false, description: "A consultant sets this up with you. Not available in this local build yet." },
  { value: "EXPLORE_DEMO", label: "Explore Demo", available: false, description: "See Ground Control with fictional data first. Not available in this local build yet." },
];

export function WelcomeStep() {
  return (
    <div>
      <StepHeader
        eyebrow="Welcome"
        title="Let's set up the customer information your team needs."
        description="This takes a few minutes. Progress is saved automatically, and everything here can be changed later."
        effort="Quick"
      />

      <SurfaceCard className="p-6">
        <ul className="mb-6 space-y-2 text-[13.5px] text-text-secondary">
          <li>Ground Control brings your customer, revenue, and renewal information together so you can see what needs attention.</li>
          <li>Progress is saved after every step. You can leave and come back.</li>
          <li>Nothing here is permanent. You can change any setting later in Organization Settings.</li>
          <li>Ground Control will not send any customer communication automatically.</li>
        </ul>

        <form action={saveGoalsAndPathAction as unknown as (formData: FormData) => void} className="space-y-6">
          <div>
            <p className="mb-1 text-[14px] font-medium text-text-primary">What do you want Ground Control to help improve first?</p>
            <p className="mb-3 text-[12.5px] text-text-muted">Choose as many as apply. This personalizes recommendations later, not calculations.</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ONBOARDING_GOALS.map((goal) => (
                <label key={goal} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-[13px] text-text-secondary hover:bg-surface-soft">
                  <input type="checkbox" name="goals" value={goal} className="h-3.5 w-3.5" />
                  {GOAL_LABELS[goal]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[14px] font-medium text-text-primary">How do you want to begin?</p>
            <p className="mb-3 text-[12.5px] text-text-muted">Recommended: Quick Start.</p>
            <div className="space-y-2">
              {PATHS.map((path) => (
                <label
                  key={path.value}
                  className={`flex items-start gap-3 rounded-lg border px-3 py-3 text-[13px] ${path.available ? "border-border hover:bg-surface-soft" : "cursor-not-allowed border-border/60 opacity-50"}`}
                >
                  <input
                    type="radio"
                    name="path"
                    value={path.value}
                    defaultChecked={path.value === "QUICK_START"}
                    disabled={!path.available}
                    className="mt-0.5 h-3.5 w-3.5"
                  />
                  <span>
                    <span className="block font-medium text-text-primary">{path.label}</span>
                    <span className="text-text-muted">{path.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" className="bg-brand text-white hover:bg-brand-hover">
            Continue
          </Button>
        </form>
      </SurfaceCard>
    </div>
  );
}
