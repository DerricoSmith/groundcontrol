"use client";

import * as React from "react";
import { toast } from "sonner";
import type { ActionStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  generateSuggestedActionsAction,
  changeActionStatusAction,
  assignActionAction,
} from "@/lib/actions/action-center-actions";

const STATUS_CHOICES: ActionStatus[] = ["OPEN", "IN_PROGRESS", "BLOCKED", "COMPLETED", "DISMISSED"];

export function GenerateSuggestionsButton() {
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      type="button"
      disabled={pending}
      className="bg-brand text-white hover:bg-brand-hover"
      onClick={async () => {
        setPending(true);
        const result = await generateSuggestedActionsAction();
        setPending(false);
        if (result.error) {
          toast(result.error);
          return;
        }
        toast(
          result.created === 0
            ? "No new suggestions. Every open risk already has an action."
            : `${result.created} suggested action${result.created === 1 ? "" : "s"} created.`
        );
        window.location.reload();
      }}
    >
      {pending ? "Generating..." : "Generate suggestions"}
    </Button>
  );
}

export function ActionRowControls({
  actionId,
  currentStatus,
  currentOwnerId,
  members,
}: {
  actionId: string;
  currentStatus: ActionStatus;
  currentOwnerId: string | null;
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
    <div className="flex items-center justify-end gap-2">
      <label className="sr-only" htmlFor={`owner-${actionId}`}>
        Assign owner
      </label>
      <select
        id={`owner-${actionId}`}
        value={currentOwnerId ?? ""}
        disabled={pending}
        onChange={(event) => {
          const value = event.target.value;
          run(() => assignActionAction(actionId, value === "" ? null : value), value === "" ? "Owner cleared." : "Owner assigned.");
        }}
        className="h-8 rounded-lg border border-border bg-surface px-2 text-[12.5px] text-text-primary"
      >
        <option value="">Unassigned</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor={`status-${actionId}`}>
        Change status
      </label>
      <select
        id={`status-${actionId}`}
        value={currentStatus}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as ActionStatus;
          let note: string | undefined;
          if (next === "BLOCKED") {
            const reason = window.prompt("Blocking an action requires a reason:");
            if (!reason?.trim()) return;
            note = reason.trim();
          }
          if (next === "COMPLETED") {
            const outcome = window.prompt("What was the outcome? (optional)");
            note = outcome?.trim() || undefined;
          }
          run(() => changeActionStatusAction(actionId, next, note), "Action updated.");
        }}
        className="h-8 rounded-lg border border-border bg-surface px-2 text-[12.5px] text-text-primary"
      >
        <option value={currentStatus}>{currentStatus}</option>
        {STATUS_CHOICES.filter((s) => s !== currentStatus).map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </div>
  );
}
