import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentMembership } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/auth/permissions";
import { calculateForecastConfidence } from "@/lib/services/renewal-service";
import { daysUntil } from "@/lib/dates";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import { RenewalPlanControls } from "./renewal-plan-controls";

export default async function RenewalDetailPage({ params }: { params: Promise<{ renewalId: string }> }) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const { renewalId } = await params;
  const renewal = await prisma.renewal.findFirst({
    where: { id: renewalId, organizationId: membership.organizationId },
    include: {
      customerAccount: { select: { id: true, name: true, healthCategory: true, dataConfidence: true } },
      plan: { include: { milestones: { orderBy: { order: "asc" } } } },
      forecastHistory: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!renewal) notFound();

  const confidence = await calculateForecastConfidence(renewal.id);
  const canManage = can(membership.role, "manage_actions");
  const daysToRenewal = daysUntil(renewal.periodEnd);

  return (
    <div>
      <Link href="/renewals" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Renewal Center
      </Link>

      <div className="mb-6">
        <h1 className="font-serif text-[26px] font-medium tracking-tight text-text-primary sm:text-[30px]">
          {renewal.customerAccount.name}
        </h1>
        <p className="mt-1 text-[13.5px] text-text-secondary">
          Renews {renewal.periodEnd.toLocaleDateString()} (
          {daysToRenewal < 0 ? `${Math.abs(daysToRenewal)} days overdue` : `${daysToRenewal} days away`})
          {" · "}
          {renewal.currency} {renewal.arr.toLocaleString()}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{renewal.status.replace(/_/g, " ")}</Badge>
          <Badge variant="outline">Forecast: {renewal.forecastCategory.replace(/_/g, " ")}</Badge>
          <Badge variant="outline">Confidence {Math.round(confidence.score * 100)}%</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SurfaceCard className="p-6">
            <CardTitle title="Renewal plan" subtitle={renewal.plan ? `${renewal.plan.milestones.filter((m) => m.completed).length} of ${renewal.plan.milestones.length} complete` : "No plan yet"} />
            <RenewalPlanControls
              renewalId={renewal.id}
              canManage={canManage}
              hasPlan={Boolean(renewal.plan)}
              currentForecast={renewal.forecastCategory}
              isClosed={renewal.status === "RENEWED" || renewal.status === "CHURNED"}
              milestones={(renewal.plan?.milestones ?? []).map((m) => ({
                id: m.id,
                label: m.label,
                completed: m.completed,
                completedAt: m.completedAt?.toISOString() ?? null,
              }))}
            />
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <CardTitle title="Forecast history" subtitle="Append-only record of every change" />
            {renewal.forecastHistory.length === 0 ? (
              <p className="mt-3 text-[13.5px] text-text-muted">No forecast changes recorded yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-[13px]">
                {renewal.forecastHistory.map((change) => (
                  <li key={change.id} className="rounded-lg border border-border px-3 py-2">
                    <span className="text-text-primary">
                      {change.fromCategory?.replace(/_/g, " ") ?? "Initial"} → {change.toCategory.replace(/_/g, " ")}
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
          <SurfaceCard className="p-6">
            <CardTitle title="Forecast confidence" subtitle="How this number was produced" />
            <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">{confidence.explanation}</p>
            <ul className="mt-4 space-y-2 text-[12.5px]">
              {confidence.factors.map((factor) => (
                <li key={factor.label} className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-text-primary">{factor.label}</p>
                    <p className="text-text-muted">{factor.detail}</p>
                  </div>
                  <span className={`shrink-0 tabular-nums font-medium ${factor.contribution < 0 ? "text-danger" : "text-text-secondary"}`}>
                    {factor.contribution >= 0 ? "+" : ""}
                    {Math.round(factor.contribution * 100)}
                  </span>
                </li>
              ))}
            </ul>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <CardTitle title="Account" />
            <p className="mt-3 text-[13px] text-text-secondary">
              <Link href={`/customers/${renewal.customerAccount.id}`} className="text-brand hover:text-brand-hover">
                {renewal.customerAccount.name}
              </Link>
            </p>
            <p className="mt-1 text-[13px] text-text-secondary">
              Health: {renewal.customerAccount.healthCategory.replace(/_/g, " ").toLowerCase()} · data confidence{" "}
              {Math.round(renewal.customerAccount.dataConfidence * 100)}%
            </p>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
