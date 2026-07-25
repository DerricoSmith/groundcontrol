"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StepHeader } from "./step-header";
import { inviteMemberAction, type InviteFormState } from "@/lib/actions/invitation-actions";
import { skipTeamInvitationsStepAction, completeTeamInvitationsStepAction } from "@/lib/actions/onboarding-actions";

const ROLE_OPTIONS = [
  { value: "EXECUTIVE", label: "Executive", description: "Sees Mission Control and Executive Briefs." },
  { value: "CS_LEADER", label: "CS Leader", description: "Configures health, risk, and the team's operating model." },
  { value: "CS_MANAGER", label: "CS Manager", description: "Manages accounts day to day." },
  { value: "ANALYST", label: "Analyst", description: "Focused on data quality and imports." },
  { value: "VIEWER", label: "Viewer", description: "Read-only access." },
];

const initialState: InviteFormState = {};

export function TeamInvitationsStep({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(inviteMemberAction, initialState);

  async function handleSkip() {
    await skipTeamInvitationsStepAction();
    router.push("/onboarding");
  }
  async function handleContinue() {
    await completeTeamInvitationsStepAction();
    router.push("/onboarding");
  }

  return (
    <div>
      <StepHeader
        eyebrow="Team"
        title="Invite your team"
        description="Bring in the people who'll use Ground Control day to day. You can skip this and invite people later from Organization Settings."
        effort="Quick"
      />

      <SurfaceCard className="p-6">
        <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">Email</label>
            <Input name="email" type="email" placeholder="teammate@company.com" required className="border-border bg-surface" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">Role</label>
            <select name="role" defaultValue="CS_MANAGER" className="h-9 rounded-lg border border-border bg-surface px-2.5 text-[13.5px] text-text-primary">
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={pending} className="bg-brand text-white hover:bg-brand-hover">
            <Mail className="mr-1.5 h-4 w-4" /> Send invitation
          </Button>
        </form>

        {state.error && <p className="mt-3 text-[13px] text-danger">{state.error}</p>}
        {state.inviteLink && (
          <div className="mt-4 rounded-lg border border-warning/25 bg-warning-soft p-3">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-warning">Development mode — no email is sent</p>
            <code className="mt-1 block truncate text-[12px] text-text-primary">{state.inviteLink}</code>
          </div>
        )}

        {pendingCount > 0 && <p className="mt-4 text-[13px] text-text-secondary">{pendingCount} invitation{pendingCount === 1 ? "" : "s"} pending.</p>}

        <div className="mt-6 flex items-center gap-4">
          <Button type="button" onClick={handleContinue} className="bg-brand text-white hover:bg-brand-hover">
            Continue
          </Button>
          <button type="button" onClick={handleSkip} className="text-[13px] text-text-muted hover:text-text-primary">
            Skip for now
          </button>
        </div>
      </SurfaceCard>
    </div>
  );
}
