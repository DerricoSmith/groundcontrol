import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { SurfaceCard } from "./surface-card";
import { cn } from "@/lib/utils";

const toneClasses: Record<string, string> = {
  brand: "bg-brand-soft text-brand",
  positive: "bg-positive-soft text-positive",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-accent-blue",
};

export function MetricCard({
  label,
  value,
  changePct,
  changeLabel,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  changePct?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  tone?: "brand" | "positive" | "warning" | "danger" | "info";
}) {
  const positive = (changePct ?? 0) >= 0;

  return (
    <SurfaceCard className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-text-secondary">{label}</p>
        {Icon && (
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneClasses[tone])}>
            <Icon className="h-[15px] w-[15px]" strokeWidth={2.2} />
          </div>
        )}
      </div>
      <p className="mt-3 text-[28px] font-semibold tracking-tight text-text-primary tabular-nums">{value}</p>
      {(changePct !== undefined || changeLabel) && (
        <div className="mt-2 flex items-center gap-1.5">
          {changePct !== undefined && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-[13px] font-medium tabular-nums",
                positive ? "text-positive" : "text-danger"
              )}
            >
              {positive ? <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} /> : <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2.5} />}
              {Math.abs(changePct)}%
            </span>
          )}
          {changeLabel && <span className="text-[13px] text-text-muted">{changeLabel}</span>}
        </div>
      )}
    </SurfaceCard>
  );
}
