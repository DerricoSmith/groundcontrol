import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { DataQualitySeverity } from "@prisma/client";
import { getCurrentMembership } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/auth/permissions";
import { getDataQualitySummary } from "@/lib/services/data-quality-service";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataQualityControls, IssueRowActions } from "./data-quality-controls";

const STATE_TONE: Record<string, string> = {
  Ready: "bg-health-strong-soft text-health-strong",
  Usable: "bg-health-stable-soft text-health-stable",
  Limited: "bg-health-watch-soft text-health-watch",
  "Needs Attention": "bg-health-critical-soft text-health-critical",
};

const SEVERITY_TONE: Record<DataQualitySeverity, string> = {
  INFORMATION: "bg-secondary text-text-secondary",
  LOW: "bg-secondary text-text-secondary",
  MODERATE: "bg-health-watch-soft text-health-watch",
  HIGH: "bg-health-at-risk-soft text-health-at-risk",
  CRITICAL: "bg-health-critical-soft text-health-critical",
};

export default async function DataQualityPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string }>;
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const { severity } = await searchParams;

  const [summary, issues] = await Promise.all([
    getDataQualitySummary(membership.organizationId),
    prisma.dataQualityIssue.findMany({
      where: {
        organizationId: membership.organizationId,
        status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] },
        ...(severity ? { severity: severity as DataQualitySeverity } : {}),
      },
      include: { customerAccount: { select: { id: true, name: true } } },
      orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
      take: 200,
    }),
  ]);

  const canManage = can(membership.role, "edit_account_data");

  return (
    <div>
      <PageHeader
        eyebrow={membership.organizationName}
        title="Data quality"
        description="Issues are detected deterministically, persisted, and re-checked on every recalculation. Each one explains itself."
        actions={canManage ? <DataQualityControls /> : undefined}
      />

      <SurfaceCard className="p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${STATE_TONE[summary.state]}`}>{summary.state}</span>
          <p className="text-[13.5px] text-text-secondary">{summary.explanation}</p>
        </div>

        {summary.reasons.length > 0 && (
          <ul className="mt-3 list-disc space-y-0.5 pl-5 text-[12.5px] text-text-muted">
            {summary.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
          </ul>
        )}

        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div>
            <dt className="text-[11.5px] text-text-muted">Open issues</dt>
            <dd className="text-[18px] font-semibold text-text-primary">{summary.openIssues}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-text-muted">Critical</dt>
            <dd className="text-[18px] font-semibold text-text-primary">{summary.criticalIssues}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-text-muted">High</dt>
            <dd className="text-[18px] font-semibold text-text-primary">{summary.highIssues}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-text-muted">Accounts affected</dt>
            <dd className="text-[18px] font-semibold text-text-primary">{summary.accountsAffected}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-text-muted">Total accounts</dt>
            <dd className="text-[18px] font-semibold text-text-primary">{summary.totalAccounts}</dd>
          </div>
        </dl>
      </SurfaceCard>

      <SurfaceCard className="mt-6 p-0">
        <div className="border-b border-border px-6 py-4">
          <CardTitle title="Open issues" subtitle={`${issues.length} shown`} />
        </div>
        {issues.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={CheckCircle2}
              title="No open data quality issues"
              description={summary.totalAccounts === 0 ? "Import customer accounts to begin." : "Everything Ground Control checks currently looks correct."}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Explanation</TableHead>
                <TableHead>Suggested resolution</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    {issue.customerAccount ? (
                      <Link href={`/customers/${issue.customerAccount.id}`} className="font-medium text-brand hover:text-brand-hover">
                        {issue.customerAccount.name}
                      </Link>
                    ) : (
                      <span className="text-text-muted">Organization-wide</span>
                    )}
                  </TableCell>
                  <TableCell className="text-text-secondary">{issue.category.replace(/_/g, " ")}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${SEVERITY_TONE[issue.severity]}`}>
                      {issue.severity.charAt(0) + issue.severity.slice(1).toLowerCase()}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-sm whitespace-normal text-[12.5px] text-text-secondary">{issue.explanation}</TableCell>
                  <TableCell className="max-w-xs whitespace-normal text-[12.5px] text-text-muted">{issue.suggestedResolution}</TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <IssueRowActions issueId={issue.id} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SurfaceCard>
    </div>
  );
}
