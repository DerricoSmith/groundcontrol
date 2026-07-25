"use client";

import * as React from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runRiskEvaluationAction } from "@/lib/actions/risk-actions";

export function RunEvaluationButton() {
  const [pending, setPending] = React.useState(false);

  async function handleClick() {
    setPending(true);
    const result = await runRiskEvaluationAction();
    setPending(false);

    if (result.error) {
      toast(result.error);
      return;
    }
    toast(
      `Evaluation complete. ${result.created} created, ${result.updated} updated, ${result.resolved} resolved.`
    );
    window.location.reload();
  }

  return (
    <Button type="button" disabled={pending} onClick={handleClick} className="bg-brand text-white hover:bg-brand-hover">
      <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> {pending ? "Evaluating..." : "Run evaluation"}
    </Button>
  );
}
