"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CommandInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask your business what needs attention…",
  className,
  size = "lg",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
  size?: "lg" | "md";
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit();
      }}
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-border bg-surface pl-4 pr-2 shadow-sm transition-colors focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/10",
        size === "lg" ? "py-2.5" : "py-1.5",
        className
      )}
    >
      <Sparkles className="h-[18px] w-[18px] shrink-0 text-brand" strokeWidth={2} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "flex-1 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none",
          size === "lg" ? "text-[16px]" : "text-[14px]"
        )}
      />
      <Button
        type="submit"
        size="icon"
        disabled={!value.trim()}
        className="h-9 w-9 shrink-0 rounded-xl bg-brand text-white hover:bg-brand-hover disabled:opacity-40"
        aria-label="Ask"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </form>
  );
}
