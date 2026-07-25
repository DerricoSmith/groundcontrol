import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/auth/permissions";
import { getDataFreshness } from "@/lib/services/data-freshness-service";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ImportPanel } from "./import-panel";

const FRESHNESS_TONE: Record<string, string> = {
  CURRENT: "bg-health-strong-soft text-health-strong",
  AGING: "bg-health-watch-soft text-health-watch",
  STALE: "bg-health-at-risk-soft text-health-at-risk",
  MISSING: "bg-health-critical-soft text-health-critical",
  UNKNOWN: "bg-secondary text-text-secondary",
};

export default async function ImportsPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const [freshness, recentJobs] = await Promise.all([
    getDataFreshness(membership.organizationId),
    prisma.importJob.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { createdBy: { select: { name: true } } },
    }),
  ]);

  const canImport = can(membership.role, "edit_account_data");

  return (
    <div>
      <PageHeader
        eyebrow={membership.organizationName}
        title="Data imports"
        description="Bring your customer information together so Ground Control can show what needs attention. Each import unlocks specific health components and risk rules."
      />

      <SurfaceCard className="p-6">
        <CardTitle title="Data freshness" subtitle="A category that was never imported is reported as missing, never as current." />
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Most recent record</TableHead>
              <TableHead>Explanation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {freshness.map((row) => (
              <TableRow key={row.category}>
                <TableCell className="font-medium text-text-primary">{row.label}</TableCell>
                <TableCell className="tabular-nums text-text-secondary">{row.recordCount}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${FRESHNESS_TONE[row.state]}`}>
                    {row.state.charAt(0) + row.state.slice(1).toLowerCase()}
                  </span>
                </TableCell>
                <TableCell className="text-text-secondary">
                  {row.mostRecentSourceRecordAt ? row.mostRecentSourceRecordAt.toISOString().slice(0, 10) : <span className="text-text-muted">—</span>}
                </TableCell>
                <TableCell className="max-w-md text-[12.5px] text-text-muted">{row.explanation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SurfaceCard>

      {canImport ? (
        <div className="mt-6">
          <ImportPanel />
        </div>
      ) : (
        <p className="mt-6 text-[13px] text-text-muted">
          Your role can view import history but cannot run imports. Ask an owner, administrator, or CS leader.
        </p>
      )}

      <SurfaceCard className="mt-6 p-6">
        <CardTitle title="Import history" subtitle={`${recentJobs.length} most recent`} />
        {recentJobs.length === 0 ? (
          <p className="mt-4 text-[13.5px] text-text-muted">No imports have run yet.</p>
        ) : (
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Imported</TableHead>
                <TableHead>Errors</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>By</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium text-text-primary">{job.fileName}</TableCell>
                  <TableCell className="text-text-secondary">{job.entityType.replace(/_/g, " ")}</TableCell>
                  <TableCell className="tabular-nums text-text-secondary">{job.successRows}</TableCell>
                  <TableCell className="tabular-nums text-text-secondary">{job.errorRows}</TableCell>
                  <TableCell>
                    <Badge variant={job.status === "committed" ? "outline" : "destructive"}>{job.status}</Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary">{job.createdBy.name}</TableCell>
                  <TableCell className="text-text-muted">{job.createdAt.toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SurfaceCard>
    </div>
  );
}
