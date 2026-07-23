"use client";

import * as React from "react";
import { UsersRound, MessageCircleMore, Crown, TriangleAlert, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CustomerCard } from "@/components/dashboard/customer-card";
import { CustomerDrawer } from "@/components/dashboard/customer-drawer";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/types";

type FilterKey =
  | "all"
  | "needs-reply"
  | "vip"
  | "at-risk"
  | "opportunity"
  | "waiting-on-me"
  | "waiting-on-them"
  | "no-touch-30";

const filters: { label: string; value: FilterKey }[] = [
  { label: "All", value: "all" },
  { label: "Needs reply", value: "needs-reply" },
  { label: "VIP", value: "vip" },
  { label: "At risk", value: "at-risk" },
  { label: "Opportunity", value: "opportunity" },
  { label: "Waiting on me", value: "waiting-on-me" },
  { label: "Waiting on them", value: "waiting-on-them" },
  { label: "No touch 30+ days", value: "no-touch-30" },
];

function matchesFilter(c: Customer, filter: FilterKey) {
  switch (filter) {
    case "needs-reply":
      return c.needsReply;
    case "vip":
      return c.isVIP;
    case "at-risk":
      return c.atRisk;
    case "opportunity":
      return c.isOpportunity;
    case "waiting-on-me":
      return c.waitingOn === "you";
    case "waiting-on-them":
      return c.waitingOn === "them";
    case "no-touch-30":
      return c.lastTouchDaysAgo >= 30;
    default:
      return true;
  }
}

export function CustomerRadarClient({ customers, isLive }: { customers: Customer[]; isLive: boolean }) {
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [query, setQuery] = React.useState("");
  const [activeCustomer, setActiveCustomer] = React.useState<Customer | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const needsReplyCount = customers.filter((c) => c.needsReply).length;
  const vipCount = customers.filter((c) => c.isVIP).length;
  const atRiskCount = customers.filter((c) => c.atRisk).length;

  const filtered = customers
    .filter((c) => matchesFilter(c, filter))
    .filter((c) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q);
    });

  const openDrawer = (c: Customer) => {
    setActiveCustomer(c);
    setDrawerOpen(true);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Customer Radar"
        title="People who need attention before they become problems."
        description={
          isLive
            ? "Every relationship, saved to your account — not a CRM, just what you'd want to know before you say hello."
            : "Every relationship, remembered — not a CRM, just what you'd want to know before you say hello."
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard label="Total relationships" value={customers.length.toString()} icon={UsersRound} tone="brand" />
        <MetricCard label="Need a reply" value={needsReplyCount.toString()} icon={MessageCircleMore} tone="warning" />
        <MetricCard label="VIP" value={vipCount.toString()} icon={Crown} tone="brand" />
        <MetricCard label="At risk" value={atRiskCount.toString()} icon={TriangleAlert} tone="danger" />
      </div>

      <SurfaceCard className="mb-6 p-3.5 sm:p-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="scrollbar-thin flex min-w-0 gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:pb-0">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                  filter === f.value ? "bg-brand text-white" : "bg-surface-soft text-text-secondary hover:bg-border"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Search people…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 border-border bg-surface pl-8 text-[13px]"
            />
          </div>
        </div>
      </SurfaceCard>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <CustomerCard key={c.id} customer={c} onOpen={() => openDrawer(c)} />
          ))}
        </div>
      ) : (
        <EmptyState icon={UsersRound} title="No one matches this filter" description="Try a different filter or clear your search." />
      )}

      <CustomerDrawer customer={activeCustomer} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
