"use client";

import * as React from "react";
import { ListChecks, Sparkles, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ActionCard, loopToActionCard } from "@/components/dashboard/action-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { loopTypeIcon } from "@/lib/icon-map";
import { openLoopsSeed } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { OpenLoop } from "@/lib/types";

const columns: { label: string; value: OpenLoop["due"]; hint: string }[] = [
  { label: "Today", value: "today", hint: "Handle before you close the laptop" },
  { label: "Tomorrow", value: "tomorrow", hint: "On deck" },
  { label: "This week", value: "this-week", hint: "No fixed day yet" },
  { label: "Waiting on others", value: "waiting", hint: "Blocked, not forgotten" },
  { label: "Someday", value: "someday", hint: "Low urgency, worth revisiting" },
];

export default function OpenLoopsPage() {
  const [statuses, setStatuses] = React.useState<Record<string, "open" | "done" | "snoozed">>(
    Object.fromEntries(openLoopsSeed.map((l) => [l.id, l.status]))
  );

  const open = openLoopsSeed.filter((l) => (statuses[l.id] ?? "open") === "open");
  const urgentCount = open.filter((l) => l.priority === "urgent").length;
  const revenueTiedCount = open.filter((l) => l.revenueTied).length;
  const doneToday = openLoopsSeed.filter((l) => statuses[l.id] === "done").length;

  const setStatus = (id: string, status: "open" | "done" | "snoozed", title: string) => {
    setStatuses((prev) => ({ ...prev, [id]: status }));
    if (status === "done") toast.success(`Closed the loop — ${title}`);
    if (status === "snoozed") toast(`Snoozed — ${title}`);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Open Loops"
        title="Unfinished business, in one place."
        description="Every follow-up, invoice, and deliverable that hasn't been closed yet — organized so nothing quietly drifts."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard label="Open loops" value={open.length.toString()} icon={ListChecks} tone="brand" />
        <MetricCard label="Urgent" value={urgentCount.toString()} icon={Sparkles} tone="danger" changeLabel="need you today" />
        <MetricCard label="Tied to revenue" value={revenueTiedCount.toString()} tone="positive" changeLabel="worth prioritizing" />
        <MetricCard label="Closed today" value={doneToday.toString()} icon={PartyPopper} tone="info" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {columns.map((col) => {
          const colLoops = openLoopsSeed.filter((l) => l.due === col.value);
          const colOpenCount = colLoops.filter((l) => (statuses[l.id] ?? "open") === "open").length;
          return (
            <div key={col.value} className="flex flex-col">
              <div className="mb-1 flex items-baseline justify-between px-0.5">
                <h3 className="text-[13.5px] font-semibold text-text-primary">{col.label}</h3>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                    colOpenCount > 0 ? "bg-surface-soft text-text-muted" : "bg-positive-soft text-positive"
                  )}
                >
                  {colOpenCount}
                </span>
              </div>
              <p className="mb-3 px-0.5 text-[11.5px] text-text-muted">{col.hint}</p>
              <div className="flex flex-1 flex-col gap-3">
                {colLoops.map((loop) => (
                  <ActionCard
                    key={loop.id}
                    data={loopToActionCard(loop)}
                    status={statuses[loop.id] ?? "open"}
                    icon={loopTypeIcon[loop.type]}
                    onDone={() => setStatus(loop.id, "done", loop.title)}
                    onSnooze={() => setStatus(loop.id, "snoozed", loop.title)}
                    onDraft={loop.type === "customer-reply" || loop.type === "proposal-follow-up" ? () => toast.success("Draft copied") : undefined}
                    onAddToday={col.value !== "today" ? () => toast.success("Added to today") : undefined}
                  />
                ))}
                {colOpenCount === 0 && (
                  <div className="rounded-2xl border border-dashed border-border-strong p-5 text-center text-[12.5px] text-text-muted">
                    All clear here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {openLoopsSeed.length === 0 && <EmptyState icon={ListChecks} title="No open loops" description="You're fully caught up." />}
    </div>
  );
}
