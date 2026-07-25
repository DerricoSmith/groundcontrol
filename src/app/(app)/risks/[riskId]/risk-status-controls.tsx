"use client";

import * as React from "react";
import { toast } from "sonner";
import type { RiskStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { changeRiskStatusAction } from "@/lib/actions/risk-actions";

const TRANSITIONS: { status: RiskStatus; label: string; needsNote: boolean; hint?: string }[] = [
  { status: "OPEN", label: "Mark open", needsNote: false },
  { status: "MONITORING", label: "Monitor", needsNote: false },
  { status: "RESOLVED", label: "Resolve", needsNote: true, hint: "Resolving requires a resolution note." },
  { status: "DISMISSED", label: "Dismiss", needsNote: true, hint: "Dismissing requires a reason." },
  { status: "ACCEPTED", label: "Accept risk", needsNote: false },
];

export function RiskStatusControls({ riskId, currentStatus }: { riskId: string; currentStatus: RiskStatus }) {
  const [selected, setSelected] = React.useState<RiskStatus | null>(null);
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const transition = TRANSITIONS.find((t) => t.status === selected);

  async function handleSubmit() {
    if (!selected) return;
    setPending(true);
    const result = await changeRiskStatusAction({ riskId, toStatus: selected, note: note.trim() || undefined });
    setPending(false);

    if (result.error) {
      toast(result.error);
      return;
    }
    toast(`Risk marked ${selected.toLowerCase()}.`);
    window.location.reload();
  }

  return (
    <div className="mt-3 space-y-3">
      <p className="text-[12.5px] text-text-muted">Current status: {currentStatus}</p>

      <div className="flex flex-wrap gap-2">
        {TRANSITIONS.filter((t) => t.status !== currentStatus).map((t) => (
          <button
            key={t.status}
            type="button"
            onClick={() => setSelected(t.status)}
            className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
              selected === t.status ? "border-brand bg-brand-soft font-medium text-brand" : "border-border text-text-secondary hover:bg-surface-soft"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {transition && (
        <div className="space-y-2">
          <label htmlFor="risk-note" className="block text-[12.5px] font-medium text-text-secondary">
            {transition.needsNote ? "Reason (required)" : "Note (optional)"}
          </label>
          <Textarea
            id="risk-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={transition.hint ?? "Add context for the record."}
            className="border-border bg-surface"
          />
          <Button
            type="button"
            disabled={pending || (transition.needsNote && !note.trim())}
            onClick={handleSubmit}
            className="bg-brand text-white hover:bg-brand-hover"
          >
            {pending ? "Saving..." : `Confirm: ${transition.label}`}
          </Button>
        </div>
      )}
    </div>
  );
}
