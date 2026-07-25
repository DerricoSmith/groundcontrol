"use client";

import * as React from "react";
import { toast } from "sonner";
import type { EscalationStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  createEscalationAction,
  updateEscalationStatusAction,
  assignEscalationAction,
  setCommunicationStateAction,
} from "@/lib/actions/escalation-actions";
import {
  ESCALATION_CATEGORIES,
  ESCALATION_SEVERITIES,
  CUSTOMER_COMMUNICATION_STATES,
} from "@/lib/services/escalation-constants";

const STATUS_CHOICES: EscalationStatus[] = ["NEW", "INVESTIGATING", "ACTION_PLAN_ACTIVE", "MONITORING", "RESOLVED", "CLOSED"];

const fieldClass =
  "h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[13.5px] text-text-primary placeholder:text-text-muted";
const labelClass = "mb-1 block text-[12.5px] font-medium text-text-secondary";

export function NewEscalationForm({ accounts }: { accounts: { id: string; name: string }[] }) {
  const [state, formAction, pending] = React.useActionState(createEscalationAction, undefined);

  React.useEffect(() => {
    if (state?.ok) {
      toast("Escalation recorded.");
      window.location.assign("/escalations");
    }
  }, [state]);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <div>
        <label className={labelClass} htmlFor="customerAccountId">Account</label>
        <select id="customerAccountId" name="customerAccountId" required className={fieldClass}>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>{account.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="title">Title</label>
        <input id="title" name="title" required maxLength={160} className={fieldClass} placeholder="Short summary of the problem" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="category">Category</label>
          <select id="category" name="category" className={fieldClass} defaultValue="PRODUCT">
            {ESCALATION_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="severity">Severity</label>
          <select id="severity" name="severity" className={fieldClass} defaultValue="MODERATE">
            {ESCALATION_SEVERITIES.map((severity) => (
              <option key={severity} value={severity}>{severity}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="description">What happened</label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-[13.5px] text-text-primary placeholder:text-text-muted"
          placeholder="Enough detail that someone reading this in three months understands the situation."
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="customerImpact">Customer impact (optional)</label>
        <textarea
          id="customerImpact"
          name="customerImpact"
          rows={2}
          className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-[13.5px] text-text-primary"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="targetResolutionDate">Target resolution date (optional)</label>
        <input id="targetResolutionDate" name="targetResolutionDate" type="date" className={fieldClass} />
      </div>

      {state?.error && <p className="text-[13px] text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full bg-brand text-white hover:bg-brand-hover">
        {pending ? "Recording..." : "Record escalation"}
      </Button>
    </form>
  );
}

export function EscalationRowControls({
  escalationId,
  currentStatus,
  currentOwnerId,
  communicationState,
  members,
}: {
  escalationId: string;
  currentStatus: EscalationStatus;
  currentOwnerId: string | null;
  communicationState: string;
  members: { id: string; name: string }[];
}) {
  const [pending, setPending] = React.useState(false);

  async function run(fn: () => Promise<{ error?: string }>, successMessage: string) {
    setPending(true);
    const result = await fn();
    setPending(false);
    if (result.error) {
      toast(result.error);
      return;
    }
    toast(successMessage);
    window.location.reload();
  }

  return (
    <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
      <div>
        <label className={labelClass} htmlFor={`status-${escalationId}`}>Status</label>
        <select
          id={`status-${escalationId}`}
          value={currentStatus}
          disabled={pending}
          onChange={(event) => {
            const next = event.target.value as EscalationStatus;
            let summary: string | undefined;
            if (next === "RESOLVED" || next === "CLOSED") {
              const entered = window.prompt("Closing an escalation requires a resolution summary:");
              if (!entered?.trim()) return;
              summary = entered.trim();
            }
            run(() => updateEscalationStatusAction(escalationId, next, summary), "Escalation updated.");
          }}
          className="h-8 rounded-lg border border-border bg-surface px-2 text-[12.5px] text-text-primary"
        >
          {STATUS_CHOICES.map((status) => (
            <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor={`owner-${escalationId}`}>Owner</label>
        <select
          id={`owner-${escalationId}`}
          value={currentOwnerId ?? ""}
          disabled={pending}
          onChange={(event) => {
            const value = event.target.value;
            run(
              () => assignEscalationAction(escalationId, value === "" ? null : value),
              value === "" ? "Owner cleared." : "Owner assigned."
            );
          }}
          className="h-8 rounded-lg border border-border bg-surface px-2 text-[12.5px] text-text-primary"
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor={`comms-${escalationId}`}>Customer communication</label>
        <select
          id={`comms-${escalationId}`}
          value={communicationState}
          disabled={pending}
          onChange={(event) => run(() => setCommunicationStateAction(escalationId, event.target.value), "Communication state recorded.")}
          className="h-8 rounded-lg border border-border bg-surface px-2 text-[12.5px] text-text-primary"
        >
          {CUSTOMER_COMMUNICATION_STATES.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
