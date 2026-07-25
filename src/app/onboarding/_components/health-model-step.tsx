import { CheckCircle2 } from "lucide-react";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Button } from "@/components/ui/button";
import { StepHeader } from "./step-header";
import { activateRecommendedHealthModelAction } from "@/lib/actions/onboarding-actions";
import { DEFAULT_HEALTH_WEIGHTS } from "@/lib/services/health-score-service";

const COMPONENTS: { key: keyof typeof DEFAULT_HEALTH_WEIGHTS; label: string; description: string }[] = [
  { key: "PRODUCT_ADOPTION", label: "Product adoption", description: "How consistently and broadly the customer uses the product." },
  { key: "CUSTOMER_RELATIONSHIP", label: "Customer relationship", description: "The strength and recency of engagement with important stakeholders." },
  { key: "SUPPORT_EXPERIENCE", label: "Support and experience", description: "The customer's service experience and unresolved issues." },
  { key: "COMMERCIAL_POSITION", label: "Commercial position", description: "Renewal timing, payment state, contract status, and commercial progress." },
  { key: "BUSINESS_OUTCOMES", label: "Business outcomes", description: "Evidence that the customer is achieving the results they expected." },
];

export function HealthModelStep({ alreadyActivated }: { alreadyActivated: boolean }) {
  return (
    <div>
      <StepHeader
        eyebrow="Health model"
        title="Activate a health model"
        description="The Signal & State recommended model weighs five components. Weights must total 100 percent, and the score itself is always calculated the same deterministic way. No AI ever changes the number."
        effort="Quick"
      />

      <SurfaceCard className="p-6">
        <div className="space-y-3">
          {COMPONENTS.map((c) => (
            <div key={c.key} className="flex items-start justify-between gap-4 rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-[13.5px] font-medium text-text-primary">{c.label}</p>
                <p className="text-[12.5px] text-text-secondary">{c.description}</p>
              </div>
              <span className="shrink-0 text-[14px] font-semibold tabular-nums text-text-primary">{Math.round(DEFAULT_HEALTH_WEIGHTS[c.key] * 100)}%</span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[12px] text-text-muted">
          Custom weight configuration isn&apos;t available in this local build yet. Activating uses the recommended weights above.
        </p>

        {alreadyActivated ? (
          <div className="mt-6 flex items-center gap-2 text-[13.5px] text-positive">
            <CheckCircle2 className="h-4 w-4" /> Health model is active.
          </div>
        ) : (
          <form action={activateRecommendedHealthModelAction as unknown as (formData: FormData) => void} className="mt-6">
            <Button type="submit" className="bg-brand text-white hover:bg-brand-hover">
              Activate recommended model
            </Button>
          </form>
        )}
      </SurfaceCard>
    </div>
  );
}
