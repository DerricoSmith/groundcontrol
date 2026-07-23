"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
  ListChecks,
  ArrowRight,
  Handshake,
  TriangleAlert,
  CalendarClock,
  RefreshCcw,
  Milestone,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ChipBadge, StatusBadge } from "@/components/dashboard/badges";
import { ActionCard, ProgressStrip, loopToActionCard } from "@/components/dashboard/action-card";
import { MoneyCard } from "@/components/dashboard/money-card";
import { LinkButton } from "@/components/dashboard/link-button";
import {
  customers,
  invoices,
  openLoopsSeed,
  opportunities,
  risks,
  upcomingMoments,
  founder,
  dailyBrief,
  kpis,
} from "@/lib/data";

const today = new Date(2026, 6, 23);
const dateLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

const overdueInvoices = invoices.filter((i) => i.status === "overdue").sort((a, b) => a.dueInDays - b.dueInDays);
const needsAttention = customers.filter((c) => c.needsReply || c.atRisk).slice(0, 4);

const momentIcon = { calendar: CalendarClock, renewal: RefreshCcw, milestone: Milestone, meeting: Video } as const;

export default function MorningBriefPage() {
  const [loops, setLoops] = React.useState<Record<string, "open" | "done" | "snoozed">>(
    Object.fromEntries(openLoopsSeed.slice(0, 5).map((l) => [l.id, l.status]))
  );

  const topMoves = openLoopsSeed.slice(0, 5);

  const setStatus = (id: string, status: "open" | "done" | "snoozed", label: string) => {
    setLoops((prev) => ({ ...prev, [id]: status }));
    if (status === "done") toast.success(`Marked done — ${label}`);
    if (status === "snoozed") toast(`Snoozed — ${label}`);
  };

  return (
    <div>
      <PageHeader
        eyebrow={dateLabel}
        title={`Good morning, ${founder.firstName}.`}
        description="Wake up knowing what changed, who needs you, and where the money is stuck."
        actions={
          <LinkButton href="/command-center" className="bg-brand text-white hover:bg-brand-hover">
            Open Command Center <ArrowRight className="ml-1 h-4 w-4" />
          </LinkButton>
        }
      />

      {/* AI daily brief hero */}
      <SurfaceCard elevated className="brief-gradient mb-6 p-6 lg:p-8">
        <div className="flex gap-3.5 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
            <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">Today&apos;s briefing</p>
            <p className="max-w-3xl font-serif text-[18px] leading-relaxed text-text-primary sm:text-[20px]">
              {dailyBrief.summary}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {dailyBrief.chips.map((chip) => (
            <ChipBadge key={chip.label} label={chip.label} tone={chip.tone} />
          ))}
        </div>
      </SurfaceCard>

      {/* Metrics */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          label="Revenue this month"
          value={`$${(kpis.mtdRevenue / 1000).toFixed(1)}k`}
          changePct={kpis.mtdRevenueChangePct}
          changeLabel="vs last month"
          icon={TrendingUp}
          tone="brand"
        />
        <MetricCard
          label="Cash stuck"
          value={`$${(kpis.cashStuck / 1000).toFixed(1)}k`}
          changeLabel={`${kpis.cashStuckInvoiceCount} overdue invoices`}
          icon={WalletCards}
          tone="danger"
        />
        <MetricCard
          label="Customers needing reply"
          value={kpis.customersNeedingReply.toString()}
          icon={Users}
          tone="warning"
        />
        <MetricCard label="Open loops" value={kpis.openLoopsCount.toString()} icon={ListChecks} tone="info" />
      </div>

      {/* Top moves */}
      <SurfaceCard className="mb-6 p-5 sm:p-6">
        <CardTitle icon={Sparkles} title="Today's top moves" subtitle="The five highest-leverage things to do today" />
        <div className="mt-4 space-y-3">
          {topMoves.map((loop) => (
            <ActionCard
              key={loop.id}
              status={loops[loop.id] ?? "open"}
              data={loopToActionCard(loop)}
              onDone={() => setStatus(loop.id, "done", loop.title)}
              onSnooze={() => setStatus(loop.id, "snoozed", loop.title)}
              onDraft={loop.type === "customer-reply" || loop.type === "proposal-follow-up" ? () => toast.success("Draft copied to clipboard") : undefined}
            />
          ))}
        </div>
      </SurfaceCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Who needs you */}
        <SurfaceCard className="p-5 sm:p-6">
          <CardTitle icon={Users} title="Who needs you" subtitle={`${needsAttention.length} people waiting on a reply`} />
          <div className="mt-4 space-y-3">
            {needsAttention.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand">
                  {c.avatarInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-text-primary">{c.name}</p>
                  <p className="truncate text-[12.5px] text-text-muted">{c.nextAction}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
          <LinkButton href="/customer-radar" variant="ghost" className="mt-4 w-full justify-between text-text-secondary">
            Open Customer Radar <ArrowRight className="h-3.5 w-3.5" />
          </LinkButton>
        </SurfaceCard>

        {/* Money stuck */}
        <SurfaceCard className="p-5 sm:p-6">
          <CardTitle icon={WalletCards} title="Where money is stuck" subtitle={`${overdueInvoices.length} overdue invoices`} iconTone="red" />
          <div className="mt-4 space-y-2.5">
            {overdueInvoices.map((inv) => (
              <MoneyCard key={inv.id} invoice={inv} />
            ))}
          </div>
          <LinkButton href="/money-watch" variant="ghost" className="mt-4 w-full justify-between text-text-secondary">
            Open Money Watch <ArrowRight className="h-3.5 w-3.5" />
          </LinkButton>
        </SurfaceCard>

        {/* Open loops */}
        <SurfaceCard className="p-5 sm:p-6">
          <CardTitle icon={ListChecks} title="Open loops" subtitle="Unfinished business across the business" iconTone="blue" />
          <div className="mt-3">
            <ProgressStrip
              total={openLoopsSeed.length}
              urgent={openLoopsSeed.filter((l) => l.priority === "urgent").length}
              revenueTied={openLoopsSeed.filter((l) => l.revenueTied).length}
            />
          </div>
          <div className="mt-4 space-y-2.5">
            {openLoopsSeed.slice(5, 9).map((loop) => (
              <div key={loop.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
                <p className="min-w-0 truncate text-[13px] text-text-secondary">{loop.title}</p>
                <span className="shrink-0 text-[12px] text-text-muted">{loop.dueLabel}</span>
              </div>
            ))}
          </div>
          <LinkButton href="/open-loops" variant="ghost" className="mt-4 w-full justify-between text-text-secondary">
            Open all loops <ArrowRight className="h-3.5 w-3.5" />
          </LinkButton>
        </SurfaceCard>

        {/* Risks & opportunities */}
        <SurfaceCard className="p-5 sm:p-6">
          <CardTitle icon={Handshake} title="Risks &amp; opportunities" subtitle="What could go wrong, what could go right" iconTone="green" />
          <div className="mt-4 space-y-3">
            {opportunities.slice(0, 2).map((o) => (
              <div key={o.id} className="flex items-start gap-2.5 rounded-xl border border-positive/20 bg-positive-soft p-3">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-text-primary">
                    {o.customerName} — ${o.value.toLocaleString()}
                  </p>
                  <p className="text-[12px] text-text-secondary">{o.note}</p>
                </div>
              </div>
            ))}
            {risks.slice(0, 2).map((r) => (
              <div key={r.id} className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger-soft p-3">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-text-primary">{r.title}</p>
                  <p className="text-[12px] text-text-secondary">{r.note}</p>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      {/* Upcoming moments */}
      <SurfaceCard className="mt-6 p-5 sm:p-6">
        <CardTitle title="Upcoming moments" subtitle="What's on the horizon" />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {upcomingMoments.map((m) => {
            const Icon = momentIcon[m.icon];
            return (
              <div key={m.id} className="rounded-xl border border-border bg-surface-soft p-3.5">
                <Icon className="h-4 w-4 text-brand" strokeWidth={2} />
                <p className="mt-2 text-[13px] font-medium text-text-primary">{m.title}</p>
                <p className="mt-0.5 text-[12px] text-text-muted">{m.detail}</p>
                <p className="mt-1.5 text-[11.5px] font-medium text-brand">{m.when}</p>
              </div>
            );
          })}
        </div>
      </SurfaceCard>

      <div className="h-2" />
      <p className="mt-6 text-center text-[12.5px] text-text-muted">
        Need more detail?{" "}
        <Link href="/command-center" className="font-medium text-brand hover:text-brand-hover">
          Ask Ground Control
        </Link>
      </p>
    </div>
  );
}
