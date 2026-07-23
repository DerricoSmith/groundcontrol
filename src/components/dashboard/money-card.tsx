import { InvoiceStatusBadge } from "./badges";
import { formatCurrency, formatDueLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

export function MoneyCard({ invoice }: { invoice: Invoice }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5">
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-medium text-text-primary">{invoice.client}</p>
        <p className={cn("text-[12px]", invoice.dueInDays < 0 ? "text-danger" : "text-text-muted")}>
          {formatDueLabel(invoice.dueInDays)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <p className="text-[14px] font-semibold text-text-primary tabular-nums">{formatCurrency(invoice.amount)}</p>
        <InvoiceStatusBadge status={invoice.status} />
      </div>
    </div>
  );
}
