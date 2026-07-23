import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface-soft px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft">
        <Icon className="h-5 w-5 text-brand" strokeWidth={1.8} />
      </div>
      <p className="text-[14.5px] font-medium text-text-primary">{title}</p>
      {description && <p className="mt-1 max-w-xs text-[13px] text-text-muted">{description}</p>}
    </div>
  );
}
