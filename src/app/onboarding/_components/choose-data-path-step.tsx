import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Button } from "@/components/ui/button";
import { StepHeader } from "./step-header";
import { completeDataPathStepAction } from "@/lib/actions/onboarding-actions";

const OPTIONS = [
  { title: "Upload customer data", description: "Use your own customer accounts to create a real portfolio view.", recommended: true },
  { title: "Explore fictional demo data", description: "See how Ground Control works before using your own information. Not available in this local build yet.", available: false },
  { title: "Configure the workspace first", description: "Set up your operating model before importing data. You can still import right after.", recommended: false },
];

export function ChooseDataPathStep() {
  return (
    <div>
      <StepHeader
        eyebrow="Data path"
        title="How do you want to start?"
        description="Recommended: upload customer data now. You can always add more later, and this choice doesn't lock anything in."
        effort="Quick"
      />

      <SurfaceCard className="p-6">
        <div className="space-y-3">
          {OPTIONS.map((opt) => (
            <div key={opt.title} className={`rounded-lg border px-4 py-3 ${opt.available === false ? "border-border/60 opacity-50" : "border-border"}`}>
              <div className="flex items-center gap-2">
                <p className="text-[13.5px] font-medium text-text-primary">{opt.title}</p>
                {opt.recommended && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">Recommended</span>}
              </div>
              <p className="mt-1 text-[13px] text-text-secondary">{opt.description}</p>
            </div>
          ))}
        </div>

        <form action={completeDataPathStepAction} className="mt-6">
          <Button type="submit" className="bg-brand text-white hover:bg-brand-hover">
            Continue to import
          </Button>
        </form>
      </SurfaceCard>
    </div>
  );
}
