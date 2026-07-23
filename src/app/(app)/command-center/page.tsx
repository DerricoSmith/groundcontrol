"use client";

import * as React from "react";
import { Command as CommandIcon, Sparkles } from "lucide-react";
import { CommandInput } from "@/components/dashboard/command-input";
import { AIResponseCard } from "@/components/dashboard/ai-response-card";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { getAIResponse, suggestedPrompts, type AIResponse } from "@/lib/ai-response";
import { founder } from "@/lib/data";

export default function CommandCenterPage() {
  const [value, setValue] = React.useState("");
  const [history, setHistory] = React.useState<AIResponse[]>([]);

  const ask = (q: string) => {
    const response = getAIResponse(q);
    setHistory((prev) => [response, ...prev]);
    setValue("");
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center sm:mb-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft">
          <CommandIcon className="h-6 w-6 text-brand" strokeWidth={2} />
        </div>
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">Command Center</p>
        <h1 className="font-serif text-[28px] font-medium tracking-tight text-text-primary sm:text-[36px]">
          Ask your business what needs attention.
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-[15px] text-text-secondary">
          Hey {founder.firstName} — think of this as texting your business. Ask anything, get a specific, useful answer.
        </p>
      </div>

      <CommandInput value={value} onChange={setValue} onSubmit={() => ask(value)} className="mb-4" />

      {history.length === 0 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {suggestedPrompts.map((p) => (
            <button
              key={p}
              onClick={() => ask(p)}
              className="rounded-full border border-border bg-surface px-3.5 py-2 text-[13px] text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {history.length === 0 ? (
        <SurfaceCard className="flex flex-col items-center gap-2 p-10 text-center">
          <Sparkles className="h-5 w-5 text-text-muted" />
          <p className="text-[13.5px] text-text-muted">Ask a question above, or tap a suggestion to see how this works.</p>
        </SurfaceCard>
      ) : (
        <div className="space-y-4">
          {history.map((r, i) => (
            <AIResponseCard key={i} response={r} />
          ))}
        </div>
      )}
    </div>
  );
}
