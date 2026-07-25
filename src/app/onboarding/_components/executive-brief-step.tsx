import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Button } from "@/components/ui/button";
import { StepHeader } from "./step-header";
import { saveBriefConfigAction, skipExecutiveBriefSetupAction } from "@/lib/actions/onboarding-actions";

const SECTIONS = [
  { key: "revenue_at_risk", label: "Revenue at risk" },
  { key: "upcoming_renewals", label: "Upcoming renewals" },
  { key: "new_risks", label: "New and worsening risks" },
  { key: "recommended_actions", label: "Recommended actions" },
  { key: "data_quality", label: "Data quality concerns" },
];

export function ExecutiveBriefStep() {
  return (
    <div>
      <StepHeader
        eyebrow="Executive Brief"
        title="Configure the Executive Brief"
        description="Choose what leadership sees each week. No email will be sent while Ground Control is running in local development mode."
        effort="Quick"
      />

      <SurfaceCard className="p-6">
        <form action={saveBriefConfigAction as unknown as (formData: FormData) => void} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">Day of week</label>
            <select name="dayOfWeek" defaultValue="Monday" className="h-9 w-full max-w-xs rounded-lg border border-border bg-surface px-2.5 text-[13.5px] text-text-primary">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-text-primary">Included sections</p>
            <div className="space-y-1.5">
              {SECTIONS.map((s) => (
                <label key={s.key} className="flex items-center gap-2 text-[13px] text-text-secondary">
                  <input type="checkbox" name="sections" value={s.key} defaultChecked className="h-3.5 w-3.5" />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-[13px] text-text-secondary">
            <input type="checkbox" name="approvalRequired" defaultChecked className="h-3.5 w-3.5" />
            Require approval before the brief is marked ready
          </label>

          <div className="flex items-center gap-3">
            <Button type="submit" className="bg-brand text-white hover:bg-brand-hover">
              Save and continue
            </Button>
          </div>
        </form>

        <form action={skipExecutiveBriefSetupAction} className="mt-3">
          <button type="submit" className="text-[13px] text-text-muted hover:text-text-primary">
            Skip for now
          </button>
        </form>
      </SurfaceCard>
    </div>
  );
}
