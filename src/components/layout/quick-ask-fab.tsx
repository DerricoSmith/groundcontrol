"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CommandInput } from "@/components/dashboard/command-input";
import { AIResponseCard } from "@/components/dashboard/ai-response-card";
import { getAIResponse, suggestedPrompts, type AIResponse } from "@/lib/ai-response";
import { cn } from "@/lib/utils";

export function QuickAskFab() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [response, setResponse] = React.useState<AIResponse | null>(null);

  if (pathname === "/command-center") return null;

  const ask = (q: string) => {
    setValue(q);
    setResponse(getAIResponse(q));
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ask Ground Control"
        className={cn(
          "safe-bottom fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 transition-transform active:scale-95 lg:hidden"
        )}
      >
        <Sparkles className="h-6 w-6" strokeWidth={2} />
      </button>

      <Sheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setValue("");
            setResponse(null);
          }
        }}
      >
        <SheetContent side="bottom" className="max-h-[85vh] gap-0 overflow-y-auto rounded-t-3xl border-border bg-surface p-0">
          <SheetHeader className="px-5 pb-3 pt-5">
            <SheetTitle className="text-left text-[17px]">Ask your business</SheetTitle>
            <SheetDescription className="text-left">What needs attention right now?</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-5 pb-8">
            <CommandInput
              value={value}
              onChange={setValue}
              onSubmit={() => ask(value)}
              size="md"
              placeholder="Ask anything…"
            />

            {!response && (
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.slice(0, 5).map((p) => (
                  <button
                    key={p}
                    onClick={() => ask(p)}
                    className="rounded-full border border-border bg-surface-soft px-3 py-1.5 text-[12.5px] text-text-secondary"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {response && <AIResponseCard response={response} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
