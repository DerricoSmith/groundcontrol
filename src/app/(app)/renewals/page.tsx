import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { getCurrentMembership } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function daysUntil(date: Date, now: Date): number {
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function RenewalCenterPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  const now = new Date();

  const renewals = await prisma.renewal.findMany({
    where: { organizationId: membership.organizationId },
    include: {
      customerAccount: { select: { id: true, name: true, healthCategory: true } },
      plan: { include: { milestones: true } },
    },
    orderBy: { periodEnd: "asc" },
    take: 200,
  });

  const open = renewals.filter((r) => r.status !== "RENEWED" && r.status !== "CHURNED");
  const closed = renewals.filter((r) => r.status === "RENEWED" || r.status === "CHURNED");

  const in30 = open.filter((r) => { const d = daysUntil(r.periodEnd, now); return d >= 0 && d <= 30; });
  const in60 = open.filter((r) => { const d = daysUntil(r.periodEnd, now); return d >= 0 && d <= 60; });
  const in90 = open.filter((r) => { const d = daysUntil(r.periodEnd, now); return d >= 0 && d <= 90; });
  const withoutPlan = open.filter((r) => !r.plan);

  const currency = renewals[0]?.currency ?? "USD";
  const revenueIn90 = in90.reduce((sum, r) => sum + r.arr, 0);

  return (
    <div>
      <PageHeader
        eyebrow={membership.organizationName}
        title="Renewal Center"
        description="Renewal preparation, forecast, and planning gaps. Forecast confidence is a weighted summary of recorded facts, not a prediction."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Renewals in 30 days" value={String(in30.length)} icon={CalendarClock} tone="danger" />
        <MetricCard label="Renewals in 60 days" value={String(in60.length)} icon={CalendarClock} tone="warning" />
        <MetricCard label="Renewals in 90 days" value={String(in90.length)} icon={CalendarClock} tone="info" />
        <MetricCard label="Without a plan" value={String(withoutPlan.length)} icon={CalendarClock} tone="warning" />
      </div>

      {in90.length > 0 && (
        <p className="mt-3 text-[13px] text-text-secondary">
          {currency} {revenueIn90.toLocaleString()} in recurring revenue renews within 90 days.
        </p>
      )}

      <SurfaceCard className="mt-6 p-0">
        <div className="border-b border-border px-6 py-4">
          <CardTitle title="Open renewals" subtitle={`${open.length} on file`} />
        </div>
        {open.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={CalendarClock}
              title="No open renewals"
              description="Import renewals, or add one from an account, to begin renewal planning."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Renewal date</TableHead>
                <TableHead>Days until</TableHead>
                <TableHead>Recurring revenue</TableHead>
                <TableHead>Forecast</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {open.map((renewal) => {
                const days = daysUntil(renewal.periodEnd, now);
                const milestones = renewal.plan?.milestones ?? [];
                const completed = milestones.filter((m) => m.completed).length;
                return (
                  <TableRow key={renewal.id}>
                    <TableCell>
                      <Link href={`/renewals/${renewal.id}`} className="font-medium text-brand hover:text-brand-hover">
                        {renewal.customerAccount.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-text-secondary">{renewal.periodEnd.toLocaleDateString()}</TableCell>
                    <TableCell className={`tabular-nums ${days <= 30 ? "font-medium text-health-at-risk" : "text-text-secondary"}`}>
                      {days < 0 ? `${Math.abs(days)} overdue` : days}
                    </TableCell>
                    <TableCell className="tabular-nums text-text-secondary">{renewal.currency} {renewal.arr.toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{renewal.forecastCategory.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell className="tabular-nums text-text-secondary">{Math.round(renewal.forecastConfidence * 100)}%</TableCell>
                    <TableCell className="text-text-secondary">{renewal.status.replace(/_/g, " ").toLowerCase()}</TableCell>
                    <TableCell className="text-text-secondary">
                      {renewal.plan ? `${completed}/${milestones.length}` : <span className="text-health-watch">None</span>}
                    </TableCell>
                    <TableCell className="text-text-secondary">{renewal.customerAccount.healthCategory.replace(/_/g, " ").toLowerCase()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SurfaceCard>

      {closed.length > 0 && (
        <SurfaceCard className="mt-6 p-0">
          <div className="border-b border-border px-6 py-4">
            <CardTitle title="Closed renewals" subtitle={`${closed.length} renewed or churned`} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Renewal date</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Actual amount</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closed.map((renewal) => (
                <TableRow key={renewal.id}>
                  <TableCell>
                    <Link href={`/renewals/${renewal.id}`} className="font-medium text-brand hover:text-brand-hover">
                      {renewal.customerAccount.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-text-secondary">{renewal.periodEnd.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={renewal.status === "CHURNED" ? "destructive" : "outline"}>{renewal.status}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-text-secondary">
                    {renewal.actualAmount != null ? `${renewal.currency} ${renewal.actualAmount.toLocaleString()}` : <span className="text-text-muted">—</span>}
                  </TableCell>
                  <TableCell className="text-text-secondary">{renewal.closeReason ?? <span className="text-text-muted">—</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SurfaceCard>
      )}
    </div>
  );
}
