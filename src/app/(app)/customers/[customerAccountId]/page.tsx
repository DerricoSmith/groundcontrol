import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { HealthCategory } from "@prisma/client";
import { getCurrentMembership } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { calculateAccountHealth } from "@/lib/services/health-calculation-service";
import { getAccountMetrics } from "@/lib/services/account-metrics-service";
import { formatRiskExplanation } from "@/lib/services/risk-engine";
import { OPEN_ESCALATION_STATUSES } from "@/lib/services/escalation-constants";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";

const HEALTH_LABEL: Record<HealthCategory, string> = {
  STRONG: "Strong",
  STABLE: "Stable",
  WATCH: "Watch",
  AT_RISK: "At Risk",
  CRITICAL: "Critical",
};
const HEALTH_TONE: Record<HealthCategory, string> = {
  STRONG: "bg-health-strong-soft text-health-strong",
  STABLE: "bg-health-stable-soft text-health-stable",
  WATCH: "bg-health-watch-soft text-health-watch",
  AT_RISK: "bg-health-at-risk-soft text-health-at-risk",
  CRITICAL: "bg-health-critical-soft text-health-critical",
};

const COMPONENT_LABELS: Record<string, string> = {
  PRODUCT_ADOPTION: "Product adoption",
  CUSTOMER_RELATIONSHIP: "Customer relationship",
  SUPPORT_EXPERIENCE: "Support experience",
  COMMERCIAL_POSITION: "Commercial position",
  BUSINESS_OUTCOMES: "Business outcomes",
};

/** Capitalizes the first letter without touching the rest of the sentence. */
function sentenceCase(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

const TREND_LABEL: Record<string, string> = {
  INCREASING: "Increasing",
  STABLE: "Stable",
  DECLINING: "Declining",
  INACTIVE: "Inactive",
  IMPROVING: "Improving",
  DETERIORATING: "Deteriorating",
  CRITICAL: "Critical",
  INSUFFICIENT_DATA: "Not enough data",
  ACTIVE: "Active",
  COOLING: "Cooling",
  DISENGAGED: "Disengaged",
  NONE_RECORDED: "None recorded",
};

function label(value: string): string {
  return TREND_LABEL[value] ?? value.replace(/_/g, " ");
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ customerAccountId: string }>;
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const { customerAccountId } = await params;
  const account = await prisma.customerAccount.findFirst({
    where: { id: customerAccountId, organizationId: membership.organizationId },
    include: {
      owner: true,
      dataSource: true,
      riskSignals: { where: { status: { notIn: ["RESOLVED", "DISMISSED"] } }, orderBy: { detectedAt: "desc" } },
      recommendedActions: { where: { status: { notIn: ["COMPLETED", "CANCELLED", "DISMISSED"] } }, orderBy: { createdAt: "desc" } },
      contacts: { where: { isActive: true }, orderBy: { name: "asc" } },
      renewals: { orderBy: { periodEnd: "asc" } },
      escalations: { orderBy: { openedAt: "desc" } },
      usageSummaries: { orderBy: { periodEnd: "desc" }, take: 6 },
      supportTickets: { orderBy: { createdDate: "desc" }, take: 8 },
      interactions: { orderBy: { interactionDate: "desc" }, take: 8 },
      dataQualityIssues: { where: { status: { not: "RESOLVED" } }, orderBy: { detectedAt: "desc" } },
    },
  });

  if (!account) notFound();

  const [health, metrics, healthSnapshots] = await Promise.all([
    calculateAccountHealth({ customerAccountId: account.id }),
    getAccountMetrics(account.id),
    prisma.healthScoreSnapshot.findMany({
      where: { organizationId: membership.organizationId, customerAccountId: account.id },
      orderBy: { calculatedAt: "desc" },
      take: 6,
    }),
  ]);

  const openEscalations = account.escalations.filter((e) => OPEN_ESCALATION_STATUSES.includes(e.status));
  const nextRenewal = account.renewals.find((r) => r.status !== "RENEWED" && r.status !== "CHURNED");
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: account.currency || "USD", maximumFractionDigits: 0 });

  return (
    <div>
      <Link href="/customers" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Customer Portfolio
      </Link>

      <div className="mb-6">
        <h1 className="font-serif text-[28px] font-medium tracking-tight text-text-primary sm:text-[32px]">{account.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[12.5px] font-medium ${HEALTH_TONE[health.category]}`}>
            {HEALTH_LABEL[health.category]} · {Math.round(health.overallScore)}
          </span>
          {account.segment && <Badge variant="outline">{account.segment}</Badge>}
          {account.tier && <Badge variant="outline">{account.tier}</Badge>}
          {account.lifecycleStage && <Badge variant="outline">{sentenceCase(label(account.lifecycleStage))}</Badge>}
          <Badge variant="outline">{Math.round(health.dataConfidence * 100)}% data confidence</Badge>
        </div>
        {account.healthCalculatedAt === null && (
          <p className="mt-2 text-[13px] text-text-muted">
            This score was calculated for this page view and has not been stored yet. Run a health recalculation to
            record it and start tracking movement over time.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SurfaceCard className="p-6">
            <CardTitle title="Account summary" />
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-[11.5px] text-text-muted">Owner</dt>
                <dd className="text-[14px] text-text-primary">{account.owner?.name ?? "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-[11.5px] text-text-muted">Annual recurring revenue</dt>
                <dd className="text-[14px] text-text-primary">{account.arr > 0 ? money.format(account.arr) : "Not on file"}</dd>
              </div>
              <div>
                <dt className="text-[11.5px] text-text-muted">Renewal date</dt>
                <dd className="text-[14px] text-text-primary">
                  {account.renewalDate ? new Date(account.renewalDate).toLocaleDateString() : "Not on file"}
                </dd>
              </div>
              <div>
                <dt className="text-[11.5px] text-text-muted">Source</dt>
                <dd className="text-[14px] text-text-primary">{account.dataSource?.label ?? "Manual"}</dd>
              </div>
              <div>
                <dt className="text-[11.5px] text-text-muted">Open risks</dt>
                <dd className="text-[14px] text-text-primary">{account.riskSignals.length}</dd>
              </div>
              <div>
                <dt className="text-[11.5px] text-text-muted">Open escalations</dt>
                <dd className="text-[14px] text-text-primary">{openEscalations.length}</dd>
              </div>
            </dl>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <CardTitle
              title="How this health score was produced"
              subtitle={`Model ${health.calculationVersion}. Components with no supporting data are excluded and their weight is redistributed.`}
            />
            <div className="mt-4 space-y-4">
              {health.components.map((component) => (
                <div key={component.type} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[13.5px] font-medium text-text-primary">
                      {COMPONENT_LABELS[component.type] ?? component.type}
                    </p>
                    <p className="text-[12.5px] tabular-nums text-text-secondary">
                      Score {Math.round(component.score)} · weight {Math.round(component.weight * 100)}% · confidence{" "}
                      {Math.round(component.confidence * 100)}%
                    </p>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">{sentenceCase(component.explanation)}</p>
                  {component.evidence.length > 0 && (
                    <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[12px] text-text-muted">
                      {component.evidence.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {health.limitations.length > 0 && (
              <div className="mt-4 rounded-lg border border-warning/25 bg-warning-soft p-3">
                <p className="text-[13px] font-medium text-text-primary">What this score cannot account for</p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[13px] text-text-secondary">
                  {health.limitations.map((limitation, index) => (
                    <li key={index}>{sentenceCase(limitation)}</li>
                  ))}
                </ul>
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <CardTitle title="Open risks" subtitle={`${account.riskSignals.length} open`} />
            {account.riskSignals.length === 0 ? (
              <p className="mt-3 text-[13.5px] text-text-muted">
                No open risk signals. That is not the same as no risk: it means no rule the current data can evaluate is
                triggering.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {account.riskSignals.map((risk) => {
                  const explanation = formatRiskExplanation(risk);
                  return (
                    <div key={risk.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link href={`/risks/${risk.id}`} className="text-[13.5px] font-medium text-brand hover:text-brand-hover">
                          {risk.title}
                        </Link>
                        <div className="flex gap-1.5">
                          <Badge variant="outline">{risk.severity}</Badge>
                          <Badge variant="outline">{risk.status}</Badge>
                        </div>
                      </div>
                      <dl className="mt-2 space-y-1.5 text-[13px]">
                        {explanation.map((part) => (
                          <div key={part.label}>
                            <span className="font-medium text-text-primary">{part.label}: </span>
                            <span className="text-text-secondary">{part.value}</span>
                          </div>
                        ))}
                      </dl>
                    </div>
                  );
                })}
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <CardTitle title="Product usage" subtitle={label(metrics.usage.trend)} />
            <p className="mt-2 text-[13.5px] leading-relaxed text-text-secondary">{metrics.usage.explanation}</p>
            {account.usageSummaries.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="border-b border-border text-left text-text-muted">
                      <th className="py-1.5 pr-3 font-medium">Period</th>
                      <th className="py-1.5 pr-3 font-medium">Active users</th>
                      <th className="py-1.5 pr-3 font-medium">Licensed seats</th>
                      <th className="py-1.5 font-medium">Last activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.usageSummaries.map((period) => (
                      <tr key={period.id} className="border-b border-border last:border-0">
                        <td className="py-1.5 pr-3 text-text-primary">
                          {period.periodStart.toLocaleDateString()} to {period.periodEnd.toLocaleDateString()}
                        </td>
                        <td className="py-1.5 pr-3 tabular-nums text-text-secondary">{period.activeUsers ?? "Not provided"}</td>
                        <td className="py-1.5 pr-3 tabular-nums text-text-secondary">{period.licensedUsers ?? "Not provided"}</td>
                        <td className="py-1.5 text-text-secondary">
                          {period.lastActiveAt ? period.lastActiveAt.toLocaleDateString() : "Not provided"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <CardTitle title="Support experience" subtitle={label(metrics.support.trend)} />
            <p className="mt-2 text-[13.5px] leading-relaxed text-text-secondary">{metrics.support.explanation}</p>
            {account.supportTickets.length > 0 && (
              <ul className="mt-4 space-y-2 text-[13px]">
                {account.supportTickets.map((ticket) => (
                  <li key={ticket.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2 last:border-0">
                    <span className="text-text-primary">{ticket.subject ?? "Untitled ticket"}</span>
                    <span className="text-[12px] text-text-muted">
                      {ticket.priority} · {label(ticket.status)} · opened {ticket.createdDate.toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <CardTitle
              title="Relationship"
              subtitle={`Executive engagement: ${label(metrics.relationship.executiveEngagement)}`}
            />
            <ul className="mt-3 list-disc space-y-1 pl-4 text-[13px] text-text-secondary">
              {metrics.relationship.evidence.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <p className="mt-5 text-[13px] font-medium text-text-primary">Contacts on file</p>
            {account.contacts.length === 0 ? (
              <p className="mt-1 text-[13px] text-text-muted">
                No contacts imported. Without contacts, champion and executive sponsor coverage cannot be assessed.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-[13px]">
                {account.contacts.map((contact) => (
                  <li key={contact.id} className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-text-primary">
                      {contact.name}
                      {contact.title ? `, ${contact.title}` : ""}
                    </span>
                    <span className="text-[12px] text-text-muted">
                      {((contact.roles as string[] | null) ?? []).map(label).join(", ") || "No role recorded"}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-5 text-[13px] font-medium text-text-primary">Recent interactions</p>
            {account.interactions.length === 0 ? (
              <p className="mt-1 text-[13px] text-text-muted">No interactions imported for this account.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-[13px]">
                {account.interactions.map((interaction) => (
                  <li key={interaction.id} className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-text-primary">{interaction.summary ?? label(interaction.type)}</span>
                    <span className="text-[12px] text-text-muted">
                      {label(interaction.type)} · {interaction.interactionDate.toLocaleDateString()}
                      {interaction.sentiment ? ` · ${label(interaction.sentiment)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SurfaceCard>
        </div>

        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <CardTitle title="Renewal" />
            {!nextRenewal ? (
              <p className="mt-3 text-[13px] text-text-muted">
                No open renewal record. Import renewal data or create one from the Renewal Center.
              </p>
            ) : (
              <div className="mt-3 space-y-1.5 text-[13px]">
                <p className="text-text-primary">{nextRenewal.periodEnd.toLocaleDateString()}</p>
                <p className="text-text-secondary">
                  {money.format(nextRenewal.arr)} · {label(nextRenewal.forecastCategory)}
                </p>
                <Link href={`/renewals/${nextRenewal.id}`} className="inline-block text-brand hover:text-brand-hover">
                  Open renewal plan
                </Link>
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <CardTitle title="Open actions" subtitle={`${account.recommendedActions.length} open`} />
            {account.recommendedActions.length === 0 ? (
              <p className="mt-3 text-[13px] text-text-muted">No open actions for this account.</p>
            ) : (
              <ul className="mt-3 space-y-2.5 text-[13px]">
                {account.recommendedActions.map((action) => (
                  <li key={action.id}>
                    <p className="text-text-primary">{action.title}</p>
                    <p className="text-[12px] text-text-muted">
                      {action.status} · {action.priority}
                      {action.dueDate ? ` · due ${action.dueDate.toLocaleDateString()}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/actions" className="mt-3 inline-block text-[13px] text-brand hover:text-brand-hover">
              Go to Actions
            </Link>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <CardTitle title="Escalations" subtitle={`${openEscalations.length} open`} />
            {account.escalations.length === 0 ? (
              <p className="mt-3 text-[13px] text-text-muted">No escalations recorded for this account.</p>
            ) : (
              <ul className="mt-3 space-y-2.5 text-[13px]">
                {account.escalations.map((escalation) => (
                  <li key={escalation.id}>
                    <p className="text-text-primary">{escalation.title}</p>
                    <p className="text-[12px] text-text-muted">
                      {escalation.severity} · {label(escalation.status)} · opened {escalation.openedAt.toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <CardTitle title="Data quality" subtitle={`${account.dataQualityIssues.length} open issue${account.dataQualityIssues.length === 1 ? "" : "s"}`} />
            {account.dataQualityIssues.length === 0 ? (
              <p className="mt-3 text-[13px] text-text-muted">No open data quality issues on this account.</p>
            ) : (
              <ul className="mt-3 space-y-2.5 text-[13px]">
                {account.dataQualityIssues.map((issue) => (
                  <li key={issue.id}>
                    <p className="text-text-primary">{issue.explanation}</p>
                    <p className="text-[12px] text-text-muted">
                      {issue.severity} · {issue.suggestedResolution}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/data-quality" className="mt-3 inline-block text-[13px] text-brand hover:text-brand-hover">
              Go to Data Quality
            </Link>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <CardTitle title="Health history" subtitle="Stored snapshots" />
            {healthSnapshots.length === 0 ? (
              <p className="mt-3 text-[13px] text-text-muted">
                No stored snapshots yet. A snapshot is written each time health is recalculated.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-[13px]">
                {healthSnapshots.map((snapshot) => (
                  <li key={snapshot.id} className="flex items-baseline justify-between gap-3">
                    <span className="tabular-nums text-text-primary">{snapshot.overallScore}</span>
                    <span className="text-[12px] text-text-muted">{snapshot.calculatedAt.toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
