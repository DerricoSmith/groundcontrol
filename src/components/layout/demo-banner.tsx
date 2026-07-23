import Link from "next/link";
import { Sparkles } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/20 bg-brand-soft px-4 py-3">
      <div className="flex items-center gap-2.5">
        <Sparkles className="h-4 w-4 shrink-0 text-brand" />
        <p className="text-[13px] text-text-primary">
          You&apos;re viewing demo data. Sign up free to get your own workspace, saved for real.
        </p>
      </div>
      <Link
        href="/signup"
        className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-brand-hover"
      >
        Sign up free
      </Link>
    </div>
  );
}
