import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StepHeader } from "./step-header";
import { completeDataReadinessStepAction } from "@/lib/actions/onboarding-actions";
import type { DataReadiness } from "@/lib/services/first-insight-service";

const LABEL_TONE: Record<string, string> = {
  Ready: "bg-health-strong-soft text-health-strong",
  Usable: "bg-health-stable-soft text-health-stable",
  Limited: "bg-health-watch-soft text-health-watch",
  "Needs Attention": "bg-health-critical-soft text-health-critical",
};

export function DataReadinessStep({ readiness }: { readiness: DataReadiness }) {
  return (
    <div>
      <StepHeader
        eyebrow="Data readiness"
        title="Review your data readiness"
        description="Here's what Ground Control can currently see, and where the gaps are."
        effort="Quick"
      />

      <SurfaceCard className="p-6">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[12.5px] font-medium ${LABEL_TONE[readiness.label]}`}>{readiness.label}</span>
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-text-secondary">{readiness.explanation}</p>

        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-[11.5px] text-text-muted">Accounts loaded</dt>
            <dd className="text-[18px] font-semibold text-text-primary">{readiness.accountsLoaded}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-text-muted">With an owner</dt>
            <dd className="text-[18px] font-semibold text-text-primary">{readiness.withOwner}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-text-muted">With revenue</dt>
            <dd className="text-[18px] font-semibold text-text-primary">{readiness.withRevenue}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-text-muted">With renewal date</dt>
            <dd className="text-[18px] font-semibold text-text-primary">{readiness.withRenewalDate}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <Badge variant="outline">Data confidence: {Math.round(readiness.averageConfidence * 100)}%</Badge>
        </div>

        <form action={completeDataReadinessStepAction} className="mt-6">
          <Button type="submit" className="bg-brand text-white hover:bg-brand-hover">
            Continue
          </Button>
        </form>
      </SurfaceCard>
    </div>
  );
}
