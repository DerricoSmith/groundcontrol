import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentMembership } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/auth/permissions";
import { formatRiskExplanation } from "@/lib/services/risk-engine";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import { SEVERITY_TONE } from "../page";
import { RiskStatusControls } from "./risk-status-controls";

export default async function RiskDetailPage({ params }: { params: Promise<{ riskId: string }> }) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const { riskId } = await params;
  const risk = await prisma.riskSignal.findFirst({
    where: { id: riskId, organizationId: membership.organizationId },
    include: {
      customerAccount: { select: { id: true, name: true, arr: true, currency: true, renewalDate: true, healthCategory: true } },
      statusHistory: { orderBy: { createdAt: "desc" } },
      recommendedActions: true,
    },
  });
  if (!risk) notFound();

  const explanation = formatRiskExplanation(risk);
  const evidence = Array.isArray(risk.evidence) ? (risk.evidence as string[]) : [];

  const [relatedTickets, relatedUsage, relatedInteractions] = await Promise.all([
    prisma.supportTicket.findMany({
      where: { customerAccountId: risk.customerAccountId, status: { in: ["NEW", "OPEN", "PENDING", "ON_HOLD"] } },
      take: 5,
      orderBy: { createdDate: "desc" },
    }),
    prisma.productUsageSummary.findMany({
      where: { customerAccountId: risk.customerAccountId },
      take: 2,
      orderBy: { periodEnd: "desc" },
    }),
    prisma.customerInteraction.findMany({
      where: { customerAccountId: risk.customerAccountId },
      take: 5,
      orderBy: { interactionDate: "desc" },
    }),
  ]);

  return (
    <div>
      <Link href="/risks" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Risk Radar
      </Link>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[12.5px] font-medium ${SEVERITY_TONE[risk.severity]}`}>
            {risk.severity.charAt(0) + risk.severity.slice(1).toLowerCase()}
          </span>
          <Badge variant="outline">{risk.status}</Badge>
          <Badge variant="outline">{risk.direction.charAt(0) + risk.direction.slice(1).toLowerCase()}</Badge>
          <Badge variant="outline">Rule {risk.ruleVersion}</Badge>
        </div>
        <h1 className="mt-2 font-serif text-[26px] font-medium tracking-tight text-text-primary sm:text-[30px]">{risk.title}</h1>
        <p className="mt-1 text-[13.5px] text-text-secondary">
          <Link href={`/customers/${risk.customerAccount.id}`} className="text-brand hover:text-brand-hover">
            {risk.customerAccount.name}
          </Link>
          {" · "}
          {risk.customerAccount.currency} {risk.customerAccount.arr.toLocaleString()} recurring revenue
          {risk.customerAccount.renewalDate && ` · renews ${risk.customerAccount.renewalDate.toLocaleDateString()}`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SurfaceCard className="p-6">
            <CardTitle title="Explanation" subtitle="Every statement below comes from stored evidence." />
            <dl className="mt-4 space-y-3">
              {explanation.map((part) => (
                <div key={part.label}>
                  <dt className="text-[12px] font-semibold uppercase tracking-wide text-text-muted">{part.label}</dt>
                  <dd className="mt-0.5 text-[13.5px] leading-relaxed text-text-primary">{part.value}</dd>
                </div>
              ))}
            </dl>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <CardTitle title="Evidence" subtitle={`${evidence.length} item${evidence.length === 1 ? "" : "s"}`} />
            {evidence.length === 0 ? (
              <p className="mt-3 text-[13.5px] text-text-muted">No evidence was recorded for this risk.</p>
            ) : (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] text-text-secondary">
                {evidence.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            )}
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <CardTitle title="Status history" subtitle={`${risk.statusHistory.length} change${risk.statusHistory.length === 1 ? "" : "s"}`} />
            {risk.statusHistory.length === 0 ? (
              <p className="mt-3 text-[13.5px] text-text-muted">No manual status changes yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-[13px]">
                {risk.statusHistory.map((change) => (
                  <li key={change.id} className="rounded-lg border border-border px-3 py-2">
                    <span className="text-text-primary">
                      {change.fromStatus ?? "New"} → {change.toStatus}
                    </span>
                    <span className="ml-2 text-text-muted">{change.createdAt.toLocaleString()}</span>
                    {change.reason && <p className="mt-1 text-text-secondary">{change.reason}</p>}
                  </li>
                ))}
              </ul>
            )}
          </SurfaceCard>
        </div>

        <div className="space-y-6">
          {can(membership.role, "manage_actions") && (
            <SurfaceCard className="p-6">
              <CardTitle title="Update this risk" />
              <RiskStatusControls riskId={risk.id} currentStatus={risk.status} />
            </SurfaceCard>
          )}

          <SurfaceCard className="p-6">
            <CardTitle title="Related records" subtitle="Context behind the evidence" />
            <div className="mt-3 space-y-3 text-[13px]">
              <div>
                <p className="font-medium text-text-primary">Open support tickets</p>
                {relatedTickets.length === 0 ? (
                  <p className="text-text-muted">None on file.</p>
                ) : (
                  <ul className="mt-1 space-y-0.5 text-text-secondary">
                    {relatedTickets.map((t) => (
                      <li key={t.id}>{t.externalTicketId} · {t.priority} · {t.status}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="font-medium text-text-primary">Recent usage periods</p>
                {relatedUsage.length === 0 ? (
                  <p className="text-text-muted">None on file.</p>
                ) : (
                  <ul className="mt-1 space-y-0.5 text-text-secondary">
                    {relatedUsage.map((u) => (
                      <li key={u.id}>
                        {u.periodStart.toISOString().slice(0, 10)} to {u.periodEnd.toISOString().slice(0, 10)}
                        {u.activeUsers != null && ` · ${u.activeUsers} active users`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="font-medium text-text-primary">Recent interactions</p>
                {relatedInteractions.length === 0 ? (
                  <p className="text-text-muted">None on file.</p>
                ) : (
                  <ul className="mt-1 space-y-0.5 text-text-secondary">
                    {relatedInteractions.map((i) => (
                      <li key={i.id}>{i.interactionDate.toISOString().slice(0, 10)} · {i.type.replace(/_/g, " ").toLowerCase()}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
