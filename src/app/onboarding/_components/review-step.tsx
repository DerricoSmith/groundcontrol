"use client";

import { useActionState } from "react";
import { CircleAlert } from "lucide-react";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { Button } from "@/components/ui/button";
import { StepHeader } from "./step-header";
import { activateOnboardingAction, type ActionResult } from "@/lib/actions/onboarding-actions";

export interface ReviewSummary {
  organizationName: string;
  goals: string[];
  accountCount: number;
  accountsWithOwner: number;
  accountsWithRevenue: number;
  accountsWithRenewalDate: number;
  healthModelActivated: boolean;
  activatedRiskRuleCount: number;
  briefConfigured: boolean;
  memberCount: number;
  pendingInvitationCount: number;
  missingRequiredSteps: string[];
}

const initialState: ActionResult = {};

export function ReviewStep({ summary }: { summary: ReviewSummary }) {
  const [state, formAction, pending] = useActionState(async (): Promise<ActionResult> => activateOnboardingAction(), initialState);
  const canActivate = summary.missingRequiredSteps.length === 0;

  return (
    <div>
      <StepHeader
        eyebrow="Review and activate"
        title="Review your setup"
        description="This is what Ground Control has so far. Activating locks in your starting configuration, not your data. Everything can still change."
        effort="Quick"
      />

      <SurfaceCard className="p-6">
        <CardTitle title="Portfolio" subtitle={`${summary.accountCount} customer account${summary.accountCount === 1 ? "" : "s"}`} />
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <dt className="text-[11.5px] text-text-muted">With an owner</dt>
            <dd className="text-[15px] font-semibold text-text-primary">{summary.accountsWithOwner}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-text-muted">With revenue</dt>
            <dd className="text-[15px] font-semibold text-text-primary">{summary.accountsWithRevenue}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-text-muted">With renewal date</dt>
            <dd className="text-[15px] font-semibold text-text-primary">{summary.accountsWithRenewalDate}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-text-muted">Team members</dt>
            <dd className="text-[15px] font-semibold text-text-primary">{summary.memberCount}</dd>
          </div>
        </dl>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border px-3 py-2.5 text-[13px]">
            <span className="font-medium text-text-primary">Health model: </span>
            <span className="text-text-secondary">{summary.healthModelActivated ? "Activated (recommended weights)" : "Not activated"}</span>
          </div>
          <div className="rounded-lg border border-border px-3 py-2.5 text-[13px]">
            <span className="font-medium text-text-primary">Risk rules: </span>
            <span className="text-text-secondary">{summary.activatedRiskRuleCount} active</span>
          </div>
          <div className="rounded-lg border border-border px-3 py-2.5 text-[13px]">
            <span className="font-medium text-text-primary">Executive Brief: </span>
            <span className="text-text-secondary">{summary.briefConfigured ? "Configured" : "Deferred"}</span>
          </div>
          <div className="rounded-lg border border-border px-3 py-2.5 text-[13px]">
            <span className="font-medium text-text-primary">Pending invitations: </span>
            <span className="text-text-secondary">{summary.pendingInvitationCount}</span>
          </div>
        </div>

        {!canActivate && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft p-3 text-[13px] text-text-primary">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            Complete these required steps before activating: {summary.missingRequiredSteps.join(", ")}.
          </div>
        )}
        {state.error && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft p-3 text-[13px] text-text-primary">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            {state.error}
          </div>
        )}

        <form action={formAction} className="mt-6">
          <Button type="submit" disabled={!canActivate || pending} className="bg-brand text-white hover:bg-brand-hover">
            {pending ? "Activating..." : "Activate workspace"}
          </Button>
        </form>
      </SurfaceCard>
    </div>
  );
}
