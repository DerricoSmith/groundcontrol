"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Button } from "@/components/ui/button";
import { StepHeader } from "./step-header";
import { activateRiskRuleAction, completeRiskPreferencesStepAction } from "@/lib/actions/onboarding-actions";
import type { RiskRuleStatus } from "@/lib/services/risk-rule-service";

export function RiskPreferencesStep({ rules }: { rules: RiskRuleStatus[] }) {
  const [activating, setActivating] = React.useState<string | null>(null);
  const [activated, setActivated] = React.useState<Set<string>>(new Set(rules.filter((r) => r.activated).map((r) => r.key)));

  async function handleActivate(key: string) {
    setActivating(key);
    const result = await activateRiskRuleAction(key);
    setActivating(null);
    if (result.error) {
      toast(result.error);
      return;
    }
    setActivated((prev) => new Set(prev).add(key));
    toast(`Activated. ${result.signalsCreated ?? 0} risk signal${result.signalsCreated === 1 ? "" : "s"} created.`);
  }

  async function handleContinue() {
    // completeRiskPreferencesStepAction redirects internally on success.
    await completeRiskPreferencesStepAction();
  }

  return (
    <div>
      <StepHeader
        eyebrow="Risk rules"
        title="Activate risk rules"
        description="Ground Control only activates a rule when it has the information to run it. Rules that need data you haven't imported yet are shown, not hidden."
        effort="Quick"
      />

      <SurfaceCard className="p-6">
        <div className="space-y-2">
          {rules.map((rule) => {
            const isActivated = activated.has(rule.key);
            return (
              <div key={rule.key} className={`rounded-lg border px-4 py-3 ${rule.available ? "border-border" : "border-border/60 opacity-60"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[13.5px] font-medium text-text-primary">{rule.label}</p>
                    <p className="mt-0.5 text-[12.5px] text-text-secondary">{rule.monitors}</p>
                    <p className="mt-0.5 text-[12px] text-text-muted">Requires: {rule.requiredData}</p>
                    {!rule.available && rule.unavailableReason && (
                      <p className="mt-1 text-[12px] text-warning">{rule.unavailableReason}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {isActivated ? (
                      <span className="flex items-center gap-1 text-[12.5px] font-medium text-positive">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : rule.available ? (
                      <Button type="button" size="sm" disabled={activating === rule.key} onClick={() => handleActivate(rule.key)} variant="outline">
                        {activating === rule.key ? "Activating..." : "Activate"}
                      </Button>
                    ) : (
                      <span className="text-[12px] text-text-muted">Not usable yet</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <Button type="button" onClick={handleContinue} className="bg-brand text-white hover:bg-brand-hover">
            Continue
          </Button>
        </div>
      </SurfaceCard>
    </div>
  );
}
