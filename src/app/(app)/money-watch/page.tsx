"use client";

import * as React from "react";
import {
  TrendingUp,
  WalletCards,
  CircleDollarSign,
  Repeat,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MoneyCard } from "@/components/dashboard/money-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RevenueStreamChart } from "@/components/charts/revenue-stream-chart";
import { StreamBreakdownDonut } from "@/components/charts/stream-breakdown-donut";
import { Button } from "@/components/ui/button";
import { invoices, revenueStreamSeries, streamMeta, opportunities, customers, kpis } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

const overdueInvoices = invoices.filter((i) => i.status === "overdue").sort((a, b) => a.dueInDays - b.dueInDays);
const otherInvoices = invoices.filter((i) => i.status !== "overdue");
const overdueTotal = overdueInvoices.reduce((s, i) => s + i.amount, 0);
const repeatBuyers = customers
  .filter((c) => (c.channel === "shopify" || c.channel === "wholesale") && c.ltv > 900)
  .sort((a, b) => b.ltv - a.ltv);
const refundWatch = customers.filter((c) => c.tags.some((t) => t.toLowerCase().includes("refund")));
const keys = Object.keys(streamMeta) as (keyof typeof streamMeta)[];

export default function MoneyWatchPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Money Watch"
        title="Where the money is moving, and where it's stuck."
        description="Revenue across every stream, plus every dollar that's waiting on someone — usually you."
        actions={
          <Button className="bg-brand text-white hover:bg-brand-hover" onClick={() => toast.success("Reminders queued for 3 invoices")}>
            <Send className="h-4 w-4" /> Send reminders
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          label="Revenue this month"
          value={formatCurrency(kpis.mtdRevenue, { compact: true })}
          changePct={kpis.mtdRevenueChangePct}
          changeLabel="vs last month"
          icon={TrendingUp}
          tone="brand"
        />
        <MetricCard
          label="Cash stuck"
          value={formatCurrency(overdueTotal, { compact: true })}
          changeLabel={`${overdueInvoices.length} overdue invoices`}
          icon={WalletCards}
          tone="danger"
        />
        <MetricCard
          label="Warm opportunities"
          value={formatCurrency(
            opportunities.reduce((s, o) => s + o.value, 0),
            { compact: true }
          )}
          changeLabel={`${opportunities.length} open`}
          icon={Sparkles}
          tone="positive"
        />
        <MetricCard label="Avg. time to pay" value="16 days" changeLabel="target is 14 days" icon={CircleDollarSign} tone="info" />
      </div>

      {/* AI insight */}
      <SurfaceCard elevated className="brief-gradient mb-6 p-5 sm:p-6">
        <div className="flex gap-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
            <Sparkles className="h-[16px] w-[16px]" />
          </div>
          <div>
            <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">Fastest revenue move</p>
            <p className="text-[15px] leading-relaxed text-text-primary">
              Your fastest revenue move today is sending Bellweather &amp; Finch their wholesale line sheet and following
              up with Mira Studio&apos;s proposal before noon. Combined upside: <strong>{formatCurrency(9200)}</strong>.
            </p>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SurfaceCard className="p-5 sm:p-6 xl:col-span-2">
          <CardTitle icon={TrendingUp} title="Revenue by stream" subtitle="Last 8 weeks" />
          <div className="mt-4">
            <RevenueStreamChart data={revenueStreamSeries} />
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5 sm:p-6">
          <CardTitle title="Where it comes from" subtitle="Share of revenue by stream" />
          <StreamBreakdownDonut data={revenueStreamSeries} />
          <div className="mt-2 space-y-2">
            {keys.map((k) => {
              const total = revenueStreamSeries.reduce((s, d) => s + d[k], 0);
              return (
                <div key={k} className="flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-2 text-text-secondary">
                    <span className="h-2 w-2 rounded-full" style={{ background: streamMeta[k].color }} />
                    {streamMeta[k].label}
                  </span>
                  <span className="font-medium text-text-primary tabular-nums">{formatCurrency(total, { compact: true })}</span>
                </div>
              );
            })}
          </div>
        </SurfaceCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SurfaceCard className="p-5 sm:p-6 xl:col-span-2">
          <CardTitle icon={WalletCards} title="Unpaid invoices" subtitle={`${invoices.length} total`} iconTone="red" />
          <div className="mt-4 space-y-2.5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-text-muted">Overdue</p>
            {overdueInvoices.map((inv) => (
              <MoneyCard key={inv.id} invoice={inv} />
            ))}
            <p className="pt-2 text-[12px] font-semibold uppercase tracking-wide text-text-muted">Sent &amp; draft</p>
            {otherInvoices.map((inv) => (
              <MoneyCard key={inv.id} invoice={inv} />
            ))}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard className="p-5 sm:p-6">
            <CardTitle icon={Sparkles} title="Warm opportunities" subtitle="Money that wants to come in" iconTone="green" />
            <div className="mt-4 space-y-3">
              {opportunities.map((o) => (
                <div key={o.id} className="rounded-xl border border-border bg-surface p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-text-primary">{o.customerName}</p>
                    <p className="text-[13px] font-semibold text-positive tabular-nums">{formatCurrency(o.value, { compact: true })}</p>
                  </div>
                  <p className="mt-1 text-[12px] text-text-secondary">{o.nextAction}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6">
            <CardTitle icon={Repeat} title="Repeat buyers" subtitle="Steady, dependable revenue" />
            <div className="mt-4 space-y-3">
              {repeatBuyers.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-[13px] text-text-primary">{c.name}</p>
                  <p className="shrink-0 text-[13px] font-semibold text-text-primary tabular-nums">{formatCurrency(c.ltv, { compact: true })}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6">
            <CardTitle icon={RotateCcw} title="Refund watch" subtitle="Keep an eye on these" iconTone="amber" />
            <div className="mt-4">
              {refundWatch.length > 0 ? (
                <div className="space-y-3">
                  {refundWatch.map((c) => (
                    <div key={c.id}>
                      <p className="text-[13px] font-medium text-text-primary">{c.name}</p>
                      <p className="text-[12px] text-text-secondary">{c.openIssue}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-text-muted">Nothing to watch right now.</p>
              )}
            </div>
          </SurfaceCard>
        </div>
      </div>

      {invoices.length === 0 && <EmptyState icon={WalletCards} title="No invoices yet" />}

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-text-muted">
        Want the full picture? <a href="/command-center" className="flex items-center gap-1 font-medium text-brand hover:text-brand-hover">Ask Ground Control <ArrowRight className="h-3 w-3" /></a>
      </p>
    </div>
  );
}
