"use client";

import { motion } from "framer-motion";
import { Copy, ListPlus, PenLine, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/dashboard/link-button";
import type { AIResponse } from "@/lib/ai-response";

export function AIResponseCard({ response }: { response: AIResponse }) {
  const copy = () => {
    navigator.clipboard?.writeText(response.answer);
    toast.success("Copied to clipboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <p className="mb-3 text-[13px] font-medium text-text-muted">You asked</p>
      <p className="mb-5 text-[14.5px] font-medium text-text-primary">&ldquo;{response.question}&rdquo;</p>

      <div className="flex items-start gap-3 rounded-xl border border-brand/15 bg-brand-soft p-4">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-text-primary">{response.answer}</p>
      </div>

      {response.signals.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-text-muted">Supporting signals</p>
          <div className="space-y-1.5">
            {response.signals.map((s, i) => (
              <p key={i} className="flex items-start gap-2 text-[13px] text-text-secondary">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-muted" />
                {s}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        <Button size="sm" onClick={copy} variant="secondary" className="h-9 gap-1.5">
          <Copy className="h-3.5 w-3.5" /> Copy
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-9 gap-1.5"
          onClick={() => toast.success("Added to Open Loops")}
        >
          <ListPlus className="h-3.5 w-3.5" /> Create task
        </Button>
        {response.draftTarget && (
          <Button
            size="sm"
            variant="secondary"
            className="h-9 gap-1.5"
            onClick={() => {
              navigator.clipboard?.writeText(response.draftTarget!);
              toast.success("Draft copied — ready to paste");
            }}
          >
            <PenLine className="h-3.5 w-3.5" /> Draft reply
          </Button>
        )}
        <LinkButton href={response.actionHref} className="ml-auto h-9 gap-1.5 bg-brand text-white hover:bg-brand-hover">
          {response.actionLabel} <ArrowRight className="h-3.5 w-3.5" />
        </LinkButton>
      </div>
    </motion.div>
  );
}
