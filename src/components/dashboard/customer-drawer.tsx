"use client";

import { Copy, PenLine, CircleDollarSign, MapPin, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./badges";
import { channelIcon, channelLabel, sentimentIcon } from "@/lib/icon-map";
import { formatCurrency, formatRelativeDays } from "@/lib/format";
import type { Customer } from "@/lib/types";

export function CustomerDrawer({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!customer) return null;
  const ChannelIcon = channelIcon[customer.channel];
  const SentimentIcon = sentimentIcon[customer.sentiment];

  const copyReply = () => {
    navigator.clipboard?.writeText(customer.suggestedReply);
    toast.success("Reply copied to clipboard");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto border-border bg-surface p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-6 pb-5 pt-6">
          <SheetTitle className="sr-only">{customer.name}</SheetTitle>
          <SheetDescription className="sr-only">Customer relationship detail</SheetDescription>
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[14px] font-semibold text-brand">
              {customer.avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-semibold text-text-primary">{customer.name}</p>
              <p className="flex items-center gap-1.5 text-[13px] text-text-muted">
                <ChannelIcon className="h-3.5 w-3.5" /> {customer.company ?? channelLabel[customer.channel]}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <StatusBadge status={customer.status} />
                <SentimentIcon
                  className={
                    customer.sentiment === "positive"
                      ? "h-4 w-4 text-positive"
                      : customer.sentiment === "negative"
                        ? "h-4 w-4 text-danger"
                        : "h-4 w-4 text-text-muted"
                  }
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-6 px-6 py-6">
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-surface-soft p-3.5 text-[12.5px]">
            <div>
              <p className="text-text-muted">Lifetime value</p>
              <p className="mt-0.5 font-semibold text-text-primary tabular-nums">{formatCurrency(customer.ltv)}</p>
            </div>
            <div>
              <p className="text-text-muted">Last touch</p>
              <p className="mt-0.5 font-semibold text-text-primary">{formatRelativeDays(customer.lastTouchDaysAgo)}</p>
            </div>
            <div>
              <p className="text-text-muted">Location</p>
              <p className="mt-0.5 flex items-center gap-1 font-medium text-text-primary">
                <MapPin className="h-3 w-3" /> {customer.location.split(",")[0]}
              </p>
            </div>
          </div>

          <section>
            <h4 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-text-muted">Relationship</h4>
            <p className="text-[13.5px] leading-relaxed text-text-secondary">{customer.relationshipSummary}</p>
          </section>

          <section>
            <h4 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-text-muted">Last message</h4>
            <p className="rounded-xl border border-border bg-surface-soft p-3.5 text-[13.5px] italic leading-relaxed text-text-secondary">
              {customer.lastMessage}
            </p>
          </section>

          {customer.openIssue && (
            <section>
              <h4 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-text-muted">Open issue</h4>
              <p className="rounded-xl border border-danger/20 bg-danger-soft p-3.5 text-[13.5px] leading-relaxed text-text-primary">
                {customer.openIssue}
              </p>
            </section>
          )}

          <section>
            <h4 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-text-muted">Next best action</h4>
            <p className="text-[13.5px] leading-relaxed text-text-secondary">{customer.nextAction}</p>
          </section>

          <section>
            <h4 className="mb-1.5 flex items-center justify-between text-[12px] font-semibold uppercase tracking-wide text-text-muted">
              Suggested reply
              <button onClick={copyReply} className="flex items-center gap-1 text-brand hover:text-brand-hover">
                <Copy className="h-3 w-3" /> Copy
              </button>
            </h4>
            <p className="rounded-xl border border-brand/20 bg-brand-soft p-3.5 text-[13.5px] leading-relaxed text-text-primary">
              {customer.suggestedReply}
            </p>
          </section>

          {customer.revenueOpportunity !== null && (
            <section className="flex items-center gap-2 rounded-xl border border-positive/20 bg-positive-soft p-3.5">
              <CircleDollarSign className="h-4 w-4 shrink-0 text-positive" />
              <p className="text-[13px] text-text-primary">
                <span className="font-semibold">{formatCurrency(customer.revenueOpportunity)}</span> revenue opportunity tied
                to this relationship.
              </p>
            </section>
          )}

          <section>
            <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-text-muted">Timeline</h4>
            <div className="space-y-3">
              {customer.timeline.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {i < customer.timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                  </div>
                  <div className="min-w-0 pb-1">
                    <p className="text-[12.5px] font-medium text-text-primary">
                      {t.label} <span className="font-normal text-text-muted">· {t.date}</span>
                    </p>
                    <p className="text-[12.5px] text-text-secondary">{t.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {customer.notes && (
            <section>
              <h4 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-text-muted">Notes</h4>
              <p className="text-[13px] leading-relaxed text-text-muted">{customer.notes}</p>
            </section>
          )}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-border bg-surface p-4 safe-bottom">
          <Button
            className="h-10 flex-1 gap-1.5 bg-brand text-white hover:bg-brand-hover"
            onClick={() => {
              copyReply();
              toast.success("Draft ready — pasted to your clipboard");
            }}
          >
            <PenLine className="h-4 w-4" /> Draft reply
          </Button>
          <Button variant="secondary" className="h-10 gap-1.5" onClick={() => window.open(`mailto:${customer.email}`)}>
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
