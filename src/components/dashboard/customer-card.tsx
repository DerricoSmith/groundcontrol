import { MapPin } from "lucide-react";
import { SurfaceCard } from "./surface-card";
import { StatusBadge } from "./badges";
import { channelIcon, channelLabel, sentimentIcon } from "@/lib/icon-map";
import { formatCurrency, formatRelativeDays } from "@/lib/format";
import type { Customer } from "@/lib/types";

export function CustomerCard({ customer, onOpen }: { customer: Customer; onOpen: () => void }) {
  const ChannelIcon = channelIcon[customer.channel];
  const SentimentIcon = sentimentIcon[customer.sentiment];

  return (
    <SurfaceCard interactive onClick={onOpen} as="button" className="flex w-full flex-col p-4 text-left sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand">
            {customer.avatarInitials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-semibold text-text-primary">{customer.name}</p>
            <p className="flex items-center gap-1 truncate text-[12.5px] text-text-muted">
              <ChannelIcon className="h-3.5 w-3.5 shrink-0" />
              {customer.company ?? channelLabel[customer.channel]}
            </p>
          </div>
        </div>
        <SentimentIcon
          className={
            customer.sentiment === "positive"
              ? "h-[18px] w-[18px] shrink-0 text-positive"
              : customer.sentiment === "negative"
                ? "h-[18px] w-[18px] shrink-0 text-danger"
                : "h-[18px] w-[18px] shrink-0 text-text-muted"
          }
          strokeWidth={2}
        />
      </div>

      <div className="mt-3">
        <StatusBadge status={customer.status} />
      </div>

      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-text-secondary">{customer.nextAction}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-[12px]">
        <div>
          <p className="text-text-muted">LTV</p>
          <p className="mt-0.5 font-semibold text-text-primary tabular-nums">{formatCurrency(customer.ltv, { compact: true })}</p>
        </div>
        <div>
          <p className="text-text-muted">Last touch</p>
          <p className="mt-0.5 font-semibold text-text-primary tabular-nums">{formatRelativeDays(customer.lastTouchDaysAgo)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-text-muted">Location</p>
          <p className="mt-0.5 flex items-center gap-1 truncate font-medium text-text-primary">
            <MapPin className="h-3 w-3 shrink-0" /> {customer.location}
          </p>
        </div>
      </div>
    </SurfaceCard>
  );
}
