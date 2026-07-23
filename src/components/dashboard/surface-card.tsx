import { cn } from "@/lib/utils";

export function SurfaceCard({
  children,
  className,
  elevated = false,
  interactive = false,
  as: Comp = "div",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  interactive?: boolean;
  as?: React.ElementType;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Comp
      className={cn(
        "rounded-2xl text-left",
        elevated ? "card-elevated" : "card-surface",
        interactive && "hover-lift cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function CardTitle({
  icon: Icon,
  title,
  subtitle,
  action,
  className,
  iconTone = "brand",
}: {
  icon?: React.ElementType;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  iconTone?: "brand" | "blue" | "green" | "amber" | "red";
}) {
  const toneClasses: Record<string, string> = {
    brand: "bg-brand-soft text-brand",
    blue: "bg-info-soft text-accent-blue",
    green: "bg-positive-soft text-positive",
    amber: "bg-warning-soft text-warning",
    red: "bg-danger-soft text-danger",
  };
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", toneClasses[iconTone])}>
            <Icon className="h-[16px] w-[16px]" strokeWidth={2} />
          </div>
        )}
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-text-primary">{title}</h3>
          {subtitle && <p className="text-[13px] text-text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
