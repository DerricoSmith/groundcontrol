import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-9", className)}>
      <div>
        {eyebrow && (
          <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">{eyebrow}</p>
        )}
        <h1 className="font-serif text-[28px] font-medium tracking-tight text-text-primary sm:text-[34px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-text-secondary">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
