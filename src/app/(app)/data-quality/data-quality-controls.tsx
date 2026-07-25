"use client";

import * as React from "react";
import { toast } from "sonner";
import { RefreshCw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recalculateDataQualityAction, resolveIssueAction } from "@/lib/actions/data-quality-actions";

export function DataQualityControls() {
  const [pending, setPending] = React.useState(false);

  async function handleRecalculate() {
    setPending(true);
    const result = await recalculateDataQualityAction();
    setPending(false);

    if (result.error) {
      toast(result.error);
      return;
    }
    toast(`Recalculated. ${result.detected} issue${result.detected === 1 ? "" : "s"} detected, ${result.resolved} auto-resolved.`);
    window.location.reload();
  }

  return (
    <Button type="button" disabled={pending} onClick={handleRecalculate} className="bg-brand text-white hover:bg-brand-hover">
      <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> {pending ? "Recalculating..." : "Recalculate"}
    </Button>
  );
}

export function IssueRowActions({ issueId }: { issueId: string }) {
  const [pending, setPending] = React.useState(false);

  async function handleResolve() {
    setPending(true);
    const result = await resolveIssueAction(issueId, false);
    setPending(false);
    if (result.error) toast(result.error);
    else {
      toast("Issue marked resolved.");
      window.location.reload();
    }
  }

  async function handleDismiss() {
    const reason = window.prompt("Dismissing this issue requires a reason:");
    if (!reason?.trim()) return;

    setPending(true);
    const result = await resolveIssueAction(issueId, true, reason.trim());
    setPending(false);
    if (result.error) toast(result.error);
    else {
      toast("Issue dismissed.");
      window.location.reload();
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={handleResolve} aria-label="Mark resolved">
        <Check className="h-3.5 w-3.5 text-positive" />
      </Button>
      <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={handleDismiss} aria-label="Dismiss issue">
        <X className="h-3.5 w-3.5 text-danger" />
      </Button>
    </div>
  );
}
