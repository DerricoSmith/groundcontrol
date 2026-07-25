import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ShieldAlert, CalendarClock, ClipboardList, ArrowRight, CheckCircle2, Circle, TrendingDown, TrendingUp } from "lucide-react";
import type { HealthCategory } from "@prisma/client";
import { getCurrentMembership } from "@/lib/auth/session";
import { getOnboardingSession, getSetupChecklist } from "@/lib/services/onboarding-service";
import { getPortfolioSummary } from "@/lib/services/portfolio-summary-service";
import { getDataQualitySummary } from "@/lib/services/data-quality-service";
import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { EmptyState } from "@/components/dashboard/empty-state";

const SETUP_DRIVER_ROLES = ["OWNER", "ADMINISTRATOR", "SIGNAL_STATE_CONSULTANT"];

const HEALTH_LABEL: Record<HealthCategory, string> = {
  STRONG: "Strong",
  STABLE: "Stable",
  WATCH: "Watch",
  AT_RISK: "At Risk",
  CRITICAL: "Critical",
};
const HEALTH_BAR: Record<HealthCategory, string> = {
  STRONG: "bg-health-strong",
  STABLE: "bg-health-stable",
  WATCH: "bg-health-watch",
  AT_RISK: "bg-health-at-risk",
  CRITICAL: "bg-health-critical",
};

export default async function MissionControlPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  if (SETUP_DRIVER_ROLES.includes(membership.role)) {
    const onboarding = await getOnboardingSession(membership.organizationId);
    if (!onboarding || onboarding.status === "IN_PROGRESS" || onboarding.status === "REOPENED") {
      redirect("/onboarding");
    }
  }

  const [summary, checklist, readiness] = await Promise.all([
    getPortfolioSummary(membership.organizationId),
    getSetupChecklist(membership.organizationId),
    getDataQualitySummary(membership.organizationId),
  ]);

  const incompleteChecklistItems = checklist.filter((i) => i.status !== "COMPLETED");
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const maxCategoryCount = Math.max(1, ...summary.healthDistribution.map((entry) => entry.accounts));

  return (
    <div>
      <PageHeader
        eyebrow={membership.organizationName}
        title="Mission Control"
        description="What changed, what needs attention, and what the data can support."
      />

      {summary.accountCount === 0 ? (
        <SurfaceCard className="p-6">
          <EmptyState
            icon={Users}
            title="No customer accounts yet"
            description="Import customer accounts to start seeing health, risk, and renewal signals. Ground Control does not estimate anything it has not been given."
          />
          <div className="mt-4 text-center">
            <Link href="/imports" className="text-[13.5px] font-medium text-brand hover:text-brand-hover">
              Go to Data Imports
            </Link>
          </div>
        </SurfaceCard>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard
              label="Customer accounts"
              value={String(summary.accountCount)}
              changeLabel={summary.accountsMissingArr > 0 ? `${summary.accountsMissingArr} without ARR on file` : undefined}
              icon={Users}
              tone="brand"
            />
            <MetricCard
              label="ARR in at-risk accounts"
              value={money.format(summary.arrInAtRiskAccounts)}
              changeLabel={
                summary.accountsNotAssessed > 0
                  ? `of ${money.format(summary.totalArr)} total. ${summary.accountsNotAssessed} accounts not yet assessed`
                  : `of ${money.format(summary.totalArr)} total`
              }
              icon={ShieldAlert}
              tone="danger"
            />
            <MetricCard
              label="Renewing in 90 days"
              value={money.format(summary.arrRenewingNext90Days)}
              changeLabel={`${summary.renewalsNext90Days} renewal${summary.renewalsNext90Days === 1 ? "" : "s"}`}
              icon={CalendarClock}
              tone="warning"
            />
            <MetricCard
              label="Open actions"
              value={String(summary.openActions)}
              changeLabel={
                summary.unassignedActions > 0 ? `${summary.unassignedActions} with no owner` : "All have an owner"
              }
              icon={ClipboardList}
              tone="info"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <SurfaceCard className="p-6">
                <CardTitle
                  title="What changed"
                  subtitle="Accounts whose health score moved at the last recalculation"
                />
                {summary.recentChanges.length === 0 ? (
                  <p className="mt-3 text-[13.5px] text-text-muted">
                    No score movement recorded yet. A change appears here once health has been recalculated at least
                    twice for an account.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {summary.recentChanges.map((change) => (
                      <li key={change.accountId} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                        <div>
                          <Link href={`/customers/${change.accountId}`} className="text-[13.5px] font-medium text-brand hover:text-brand-hover">
                            {change.accountName}
                          </Link>
                          <p className="text-[12.5px] text-text-secondary">
                            {change.changeReason ?? `Score moved from ${change.previousScore} to ${change.currentScore}.`}
                          </p>
                        </div>
                        <span
                          className={`flex shrink-0 items-center gap-1 text-[13px] font-medium tabular-nums ${
                            change.delta < 0 ? "text-danger" : "text-positive"
                          }`}
                        >
                          {change.delta < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                          {change.delta > 0 ? "+" : ""}
                          {change.delta}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </SurfaceCard>

              <SurfaceCard className="p-6">
                <CardTitle
                  title="What needs attention"
                  subtitle="Accounts with an open escalation or risk, most exposed revenue first"
                />
                {summary.needsAttention.length === 0 ? (
                  <p className="mt-3 text-[13.5px] text-text-muted">
                    No account currently has an open risk or escalation. That reflects the rules the imported data can
                    evaluate, not a guarantee that nothing is wrong.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {summary.needsAttention.map((item) => (
                      <li key={item.accountId} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                        <div>
                          <Link href={`/customers/${item.accountId}`} className="text-[13.5px] font-medium text-brand hover:text-brand-hover">
                            {item.accountName}
                          </Link>
                          <p className="text-[13px] text-text-primary">{item.headline}</p>
                          <p className="text-[12.5px] text-text-muted">{item.detail}</p>
                        </div>
                        <span className="shrink-0 text-[13px] tabular-nums text-text-secondary">
                          {item.arr > 0 ? money.format(item.arr) : "No ARR"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <Link href="/risks" className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:text-brand-hover">
                  Open Risk Radar <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </SurfaceCard>

              <SurfaceCard className="p-6">
                <CardTitle
                  title="Health distribution"
                  subtitle={
                    summary.accountsNotAssessed > 0
                      ? `${summary.accountCount - summary.accountsNotAssessed} of ${summary.accountCount} accounts scored. ${summary.accountsNotAssessed} have never been assessed and are not shown below.`
                      : `${summary.accountCount} accounts, ${money.format(summary.totalArr)} ARR`
                  }
                />
                {summary.accountsNotAssessed > 0 && (
                  <p className="mt-3 rounded-lg border border-warning/25 bg-warning-soft p-3 text-[13px] text-text-primary">
                    {summary.accountsNotAssessed} account{summary.accountsNotAssessed === 1 ? "" : "s"} carrying{" "}
                    {money.format(summary.arrNotAssessed)} have never had a health score calculated. They are not
                    healthy or unhealthy, they are unmeasured.
                  </p>
                )}
                <ul className="mt-4 space-y-2.5">
                  {summary.healthDistribution.map((entry) => (
                    <li key={entry.category} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-[12.5px] text-text-secondary">{HEALTH_LABEL[entry.category]}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-soft">
                        <span
                          className={`block h-full rounded-full ${HEALTH_BAR[entry.category]}`}
                          style={{ width: `${(entry.accounts / maxCategoryCount) * 100}%` }}
                        />
                      </span>
                      <span className="w-32 shrink-0 text-right text-[12.5px] tabular-nums text-text-secondary">
                        {entry.accounts} · {money.format(entry.arr)}
                      </span>
                    </li>
                  ))}
                </ul>
              </SurfaceCard>
            </div>

            <div className="space-y-6">
              <SurfaceCard className="p-6">
                <CardTitle title="What the data can support" subtitle={readiness.state} />
                <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">{readiness.explanation}</p>
                {readiness.reasons.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-4 text-[12.5px] text-text-muted">
                    {readiness.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                )}
                <Link href="/data-quality" className="mt-4 inline-block text-[13px] font-medium text-brand hover:text-brand-hover">
                  Open Data Quality
                </Link>
              </SurfaceCard>

              <SurfaceCard className="p-6">
                <CardTitle title="Ownership and follow-through" />
                <dl className="mt-3 space-y-2.5 text-[13px]">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-text-secondary">Accounts without an owner</dt>
                    <dd className="tabular-nums text-text-primary">{summary.accountsWithoutOwner}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-text-secondary">Actions without an owner</dt>
                    <dd className="tabular-nums text-text-primary">{summary.unassignedActions}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-text-secondary">Actions past their due date</dt>
                    <dd className="tabular-nums text-text-primary">{summary.overdueActions}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-text-secondary">Accounts without a renewal date</dt>
                    <dd className="tabular-nums text-text-primary">{summary.renewalsMissingDate}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-text-secondary">Open escalations</dt>
                    <dd className="tabular-nums text-text-primary">{summary.openEscalations}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-text-secondary">Open data quality issues</dt>
                    <dd className="tabular-nums text-text-primary">{summary.openDataQualityIssues}</dd>
                  </div>
                </dl>
              </SurfaceCard>

              <SurfaceCard className="p-6">
                <CardTitle title="Next steps" />
                <ul className="mt-3 space-y-2 text-[13px]">
                  <li>
                    <Link href="/actions?view=unassigned" className="text-brand hover:text-brand-hover">
                      Assign owners to open actions
                    </Link>
                  </li>
                  <li>
                    <Link href="/renewals" className="text-brand hover:text-brand-hover">
                      Review renewals in the next 90 days
                    </Link>
                  </li>
                  <li>
                    <Link href="/imports" className="text-brand hover:text-brand-hover">
                      Import more data to widen what can be assessed
                    </Link>
                  </li>
                </ul>
              </SurfaceCard>
            </div>
          </div>
        </>
      )}

      {incompleteChecklistItems.length > 0 && (
        <SurfaceCard className="mt-6 p-6">
          <CardTitle
            title="Setup checklist"
            subtitle={`${checklist.length - incompleteChecklistItems.length} of ${checklist.length} complete`}
          />
          <div className="mt-4 space-y-2">
            {incompleteChecklistItems.map((item) => (
              <div key={item.id} className="flex items-start gap-2.5">
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                <div>
                  <p className="text-[13.5px] text-text-primary">
                    {item.label} {item.required && <span className="text-[11px] font-medium text-brand">Required</span>}
                  </p>
                  <p className="text-[12.5px] text-text-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      {checklist.length > 0 && incompleteChecklistItems.length === 0 && (
        <p className="mt-4 flex items-center gap-1.5 text-[12.5px] text-positive">
          <CheckCircle2 className="h-3.5 w-3.5" /> Setup checklist complete.
        </p>
      )}
    </div>
  );
}
