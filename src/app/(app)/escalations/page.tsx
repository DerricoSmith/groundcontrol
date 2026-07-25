import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertOctagon } from "lucide-react";
import { getCurrentMembership } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/auth/permissions";
import { getEscalationSummary, OPEN_ESCALATION_STATUSES } from "@/lib/services/escalation-service";
import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { EscalationRowControls, NewEscalationForm } from "./escalation-controls";

export default async function EscalationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const { view } = await searchParams;
  const showClosed = view === "closed";

  const [rawEscalations, summary, accounts, members] = await Promise.all([
    prisma.escalation.findMany({
      where: {
        organizationId: membership.organizationId,
        status: showClosed ? { in: ["RESOLVED", "CLOSED"] } : { in: OPEN_ESCALATION_STATUSES },
      },
      include: { customerAccount: { select: { id: true, name: true } } },
      // Severity is sorted in memory: on SQLite an enum column sorts
      // alphabetically, which would put HIGH above MODERATE but LOW above them
      // both. Ranking here keeps the order meaningful on every database.
      orderBy: { openedAt: "asc" },
      take: 200,
    }),
    getEscalationSummary(membership.organizationId),
    prisma.customerAccount.findMany({
      where: { organizationId: membership.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.membership.findMany({
      where: { organizationId: membership.organizationId },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  const severityRank: Record<string, number> = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };
  const escalations = [...rawEscalations].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  const canManage = can(membership.role, "manage_actions");
  const memberOptions = members.map((m) => ({ id: m.user.id, name: m.user.name }));
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div>
      <PageHeader
        eyebrow={membership.organizationName}
        title="Escalations"
        description="Escalations are entered by people who know the situation. Ground Control tracks ownership, exposure, and resolution, and never opens one on its own."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Open escalations" value={String(summary.openCount)} icon={AlertOctagon} tone="warning" />
        <MetricCard label="Critical" value={String(summary.criticalCount)} tone="danger" />
        <MetricCard label="Past target date" value={String(summary.overdueCount)} tone="danger" />
        <MetricCard
          label="ARR in escalation"
          value={currency.format(summary.revenueExposure)}
          changeLabel="Account ARR involved, not predicted loss"
          tone="info"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/escalations"
          className={`rounded-lg border px-3 py-1.5 text-[13px] ${!showClosed ? "border-brand bg-brand-soft font-medium text-brand" : "border-border text-text-secondary hover:bg-surface-soft"}`}
        >
          Open
        </Link>
        <Link
          href="/escalations?view=closed"
          className={`rounded-lg border px-3 py-1.5 text-[13px] ${showClosed ? "border-brand bg-brand-soft font-medium text-brand" : "border-border text-text-secondary hover:bg-surface-soft"}`}
        >
          Resolved and closed
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {escalations.length === 0 ? (
            <SurfaceCard className="p-6">
              <EmptyState
                icon={AlertOctagon}
                title={showClosed ? "Nothing closed yet" : "No open escalations"}
                description={
                  showClosed
                    ? "Resolved and closed escalations appear here with their resolution summary."
                    : "When something is seriously wrong for a customer, record it here so ownership and exposure are visible."
                }
              />
            </SurfaceCard>
          ) : (
            escalations.map((escalation) => {
              const overdue =
                escalation.targetResolutionDate !== null &&
                escalation.targetResolutionDate < new Date() &&
                OPEN_ESCALATION_STATUSES.includes(escalation.status);

              return (
                <SurfaceCard key={escalation.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/customers/${escalation.customerAccount.id}`}
                        className="text-[12.5px] font-medium text-brand hover:text-brand-hover"
                      >
                        {escalation.customerAccount.name}
                      </Link>
                      <h3 className="mt-0.5 text-[15px] font-medium text-text-primary">{escalation.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline">{escalation.severity}</Badge>
                      <Badge variant="outline">{escalation.category}</Badge>
                      <Badge variant="outline">{escalation.status.replace(/_/g, " ")}</Badge>
                      {overdue && <Badge variant="outline">Past target date</Badge>}
                    </div>
                  </div>

                  <p className="mt-3 text-[13.5px] leading-relaxed text-text-secondary">{escalation.description}</p>
                  {escalation.customerImpact && (
                    <p className="mt-2 text-[13px] text-text-secondary">
                      <span className="font-medium text-text-primary">Customer impact: </span>
                      {escalation.customerImpact}
                    </p>
                  )}
                  {escalation.resolutionSummary && (
                    <p className="mt-2 text-[13px] text-text-secondary">
                      <span className="font-medium text-text-primary">Resolution: </span>
                      {escalation.resolutionSummary}
                    </p>
                  )}

                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-4">
                    <div>
                      <dt className="text-text-muted">Opened</dt>
                      <dd className="text-text-primary">{escalation.openedAt.toLocaleDateString()}</dd>
                    </div>
                    <div>
                      <dt className="text-text-muted">Target resolution</dt>
                      <dd className="text-text-primary">
                        {escalation.targetResolutionDate ? escalation.targetResolutionDate.toLocaleDateString() : "Not set"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-text-muted">Owner</dt>
                      <dd className="text-text-primary">
                        {memberOptions.find((m) => m.id === escalation.ownerId)?.name ?? "Unassigned"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-text-muted">ARR involved</dt>
                      <dd className="tabular-nums text-text-primary">{currency.format(escalation.revenueExposure)}</dd>
                    </div>
                  </dl>

                  {canManage && (
                    <EscalationRowControls
                      escalationId={escalation.id}
                      currentStatus={escalation.status}
                      currentOwnerId={escalation.ownerId}
                      communicationState={escalation.customerCommunicationState ?? "none"}
                      members={memberOptions}
                    />
                  )}
                </SurfaceCard>
              );
            })
          )}
        </div>

        <div>
          <SurfaceCard className="p-6">
            <CardTitle title="Record an escalation" subtitle="Only a person can open one" />
            {canManage ? (
              accounts.length === 0 ? (
                <p className="mt-3 text-[13.5px] text-text-muted">
                  Import customer accounts before recording an escalation.
                </p>
              ) : (
                <NewEscalationForm accounts={accounts} />
              )
            ) : (
              <p className="mt-3 text-[13.5px] text-text-muted">Your role can view escalations but not record or change them.</p>
            )}
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
