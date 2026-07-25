"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle } from "lucide-react";
import type { ForecastCategory } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  createRenewalPlanAction,
  toggleMilestoneAction,
  changeForecastAction,
  closeRenewalAction,
} from "@/lib/actions/renewal-actions";

const FORECAST_CATEGORIES: ForecastCategory[] = ["COMMITTED", "LIKELY", "AT_RISK", "UNCERTAIN", "EXPECTED_CHURN"];

interface Milestone {
  id: string;
  label: string;
  completed: boolean;
  completedAt: string | null;
}

export function RenewalPlanControls({
  renewalId,
  canManage,
  hasPlan,
  milestones,
  currentForecast,
  isClosed,
}: {
  renewalId: string;
  canManage: boolean;
  hasPlan: boolean;
  milestones: Milestone[];
  currentForecast: ForecastCategory;
  isClosed: boolean;
}) {
  const [pending, setPending] = React.useState(false);

  async function withPending(fn: () => Promise<{ error?: string }>, successMessage: string) {
    setPending(true);
    const result = await fn();
    setPending(false);
    if (result.error) toast(result.error);
    else {
      toast(successMessage);
      window.location.reload();
    }
  }

  if (isClosed) {
    return <p className="mt-3 text-[13.5px] text-text-muted">This renewal is closed. Its plan and forecast are preserved as history.</p>;
  }

  if (!hasPlan) {
    return (
      <div className="mt-4">
        <p className="text-[13.5px] text-text-secondary">
          No renewal plan exists yet. Creating one adds the standard milestone checklist and moves the renewal into planning.
        </p>
        {canManage && (
          <Button
            type="button"
            disabled={pending}
            onClick={() => withPending(() => createRenewalPlanAction(renewalId), "Renewal plan created.")}
            className="mt-3 bg-brand text-white hover:bg-brand-hover"
          >
            {pending ? "Creating..." : "Create renewal plan"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-5">
      <ul className="space-y-1.5">
        {milestones.map((milestone) => (
          <li key={milestone.id}>
            <button
              type="button"
              disabled={!canManage || pending}
              onClick={() =>
                withPending(
                  () => toggleMilestoneAction(renewalId, milestone.id, !milestone.completed),
                  milestone.completed ? "Milestone reopened." : "Milestone completed."
                )
              }
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13.5px] hover:bg-surface-soft disabled:cursor-default disabled:hover:bg-transparent"
            >
              {milestone.completed ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-positive" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-text-muted" />
              )}
              <span className={milestone.completed ? "text-text-muted line-through" : "text-text-primary"}>{milestone.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {canManage && (
        <div className="space-y-3 border-t border-border pt-4">
          <div>
            <label htmlFor="forecast" className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">
              Change forecast
            </label>
            <select
              id="forecast"
              defaultValue={currentForecast}
              disabled={pending}
              onChange={(e) =>
                withPending(
                  () => changeForecastAction(renewalId, e.target.value as ForecastCategory),
                  "Forecast updated and recorded in history."
                )
              }
              className="h-9 rounded-lg border border-border bg-surface px-2.5 text-[13.5px] text-text-primary"
            >
              {FORECAST_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                const amount = window.prompt("Actual renewal amount (optional):");
                withPending(
                  () => closeRenewalAction(renewalId, "RENEWED", amount ? Number(amount) : undefined),
                  "Renewal marked renewed."
                );
              }}
            >
              Mark renewed
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                const reason = window.prompt("Closing as churned requires a reason:");
                if (!reason?.trim()) return;
                withPending(() => closeRenewalAction(renewalId, "CHURNED", undefined, reason.trim()), "Renewal marked churned.");
              }}
            >
              Mark churned
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
