"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, PenLine, CircleDollarSign, Plus, type LucideIcon } from "lucide-react";
import { PriorityBadge } from "./badges";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Priority, OpenLoop } from "@/lib/types";

export interface ActionCardData {
  id: string;
  title: string;
  detail: string;
  source: string;
  priority: Priority;
  dollarImpact: number | null;
  dueLabel: string;
}

export function loopToActionCard(loop: OpenLoop): ActionCardData {
  return {
    id: loop.id,
    title: loop.title,
    detail: loop.recommendedAction,
    source: loop.source,
    priority: loop.priority,
    dollarImpact: loop.dollarImpact,
    dueLabel: loop.dueLabel,
  };
}

export function ActionCard({
  data,
  status,
  icon: Icon,
  onDone,
  onSnooze,
  onDraft,
  onAddToday,
}: {
  data: ActionCardData;
  status: "open" | "done" | "snoozed";
  icon?: LucideIcon;
  onDone?: () => void;
  onSnooze?: () => void;
  onDraft?: () => void;
  onAddToday?: () => void;
}) {
  return (
    <AnimatePresence>
      {status === "open" && (
        <motion.div
          layout
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.97 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                {Icon && (
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-soft">
                    <Icon className="h-[15px] w-[15px] text-text-secondary" strokeWidth={2} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[14.5px] font-semibold leading-snug text-text-primary">{data.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{data.detail}</p>
                </div>
              </div>
              <PriorityBadge priority={data.priority} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-text-muted">
              <span>{data.source}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {data.dueLabel}
              </span>
              {data.dollarImpact !== null && (
                <span className="flex items-center gap-1 font-medium text-positive">
                  <CircleDollarSign className="h-3.5 w-3.5" /> {formatCurrency(data.dollarImpact)}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={onDone}
                className="h-9 min-w-[84px] gap-1.5 bg-positive text-white hover:bg-positive/90 sm:h-8"
              >
                <Check className="h-3.5 w-3.5" /> Done
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={onSnooze}
                className="h-9 min-w-[84px] gap-1.5 sm:h-8"
              >
                <Clock className="h-3.5 w-3.5" /> Snooze
              </Button>
              {onDraft && (
                <Button size="sm" variant="ghost" onClick={onDraft} className="h-9 gap-1.5 text-text-secondary sm:h-8">
                  <PenLine className="h-3.5 w-3.5" /> Draft
                </Button>
              )}
              {onAddToday && (
                <Button size="sm" variant="ghost" onClick={onAddToday} className="h-9 gap-1.5 text-text-secondary sm:h-8">
                  <Plus className="h-3.5 w-3.5" /> Add to today
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ProgressStrip({ total, urgent, revenueTied }: { total: number; urgent: number; revenueTied: number }) {
  return (
    <p className={cn("text-[13.5px] text-text-secondary")}>
      <span className="font-semibold text-text-primary">{total} open loops</span>, {urgent} urgent, {revenueTied} tied to
      revenue.
    </p>
  );
}
