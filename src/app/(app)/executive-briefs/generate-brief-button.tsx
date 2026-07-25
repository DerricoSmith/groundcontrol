"use client";

import * as React from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateBriefPreviewAction } from "@/lib/actions/executive-brief-actions";

export function GenerateBriefButton() {
  const [pending, setPending] = React.useState(false);

  async function handleClick() {
    setPending(true);
    const result = await generateBriefPreviewAction();
    setPending(false);
    if (result.error) toast(result.error);
  }

  return (
    <Button type="button" disabled={pending} onClick={handleClick} className="bg-brand text-white hover:bg-brand-hover">
      <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> {pending ? "Generating..." : "Generate preview"}
    </Button>
  );
}
