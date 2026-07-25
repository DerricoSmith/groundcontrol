import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import type { Prisma, RiskSeverity, RiskStatus } from "@prisma/client";
import { getCurrentMembership } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RunEvaluationButton } from "./run-evaluation-button";

export const SEVERITY_TONE: Record<RiskSeverity, string> = {
  LOW: "bg-secondary text-text-secondary",
  MODERATE: "bg-health-watch-soft text-health-watch",
  HIGH: "bg-health-at-risk-soft text-health-at-risk",
  CRITICAL: "bg-health-critical-soft text-health-critical",
};

const DIRECTION_LABEL: Record<string, string> = {
  WORSENING: "Worsening",
  STABLE: "Stable",
  IMPROVING: "Improving",
  UNKNOWN: "Not yet known",
};

const PAGE_SIZE = 25;

export default async function RiskRadarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; severity?: string; status?: string; page?: string }>;
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const { q, severity, status, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const where: Prisma.RiskSignalWhereInput = {
    organizationId: membership.organizationId,
    ...(severity ? { severity: severity as RiskSeverity } : {}),
    ...(status ? { status: status as RiskStatus } : { status: { notIn: ["RESOLVED", "DISMISSED"] } }),
    ...(q ? { customerAccount: { name: { contains: q } } } : {}),
  };

  // Server-side pagination: the browser never receives the whole risk list.
  const [risks, totalCount] = await Promise.all([
    prisma.riskSignal.findMany({
      where,
      include: { customerAccount: { select: { id: true, name: true, renewalDate: true, currency: true } } },
      orderBy: [{ severity: "desc" }, { revenueExposure: "desc" }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.riskSignal.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  // Exposure is counted once per account. Summing it per risk would report an
  // account with six open risks as six times its own revenue, which is a
  // number that does not exist anywhere in the business.
  const exposureByAccount = new Map<string, number>();
  for (const risk of risks) {
    exposureByAccount.set(risk.customerAccountId, risk.revenueExposure);
  }
  const totalExposure = [...exposureByAccount.values()].reduce((sum, arr) => sum + arr, 0);
  const accountsAtRisk = exposureByAccount.size;

  return (
    <div>
      <PageHeader
        eyebrow={membership.organizationName}
        title="Risk Radar"
        description="Every risk here was produced by a deterministic rule from imported evidence. Nothing is inferred."
        actions={can(membership.role, "edit_health_model") ? <RunEvaluationButton /> : undefined}
      />

      <form className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="q" className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">Account</label>
          <Input id="q" name="q" defaultValue={q ?? ""} placeholder="Search by account" className="w-56 border-border bg-surface" />
        </div>
        <div>
          <label htmlFor="severity" className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">Severity</label>
          <select id="severity" name="severity" defaultValue={severity ?? ""} className="h-9 rounded-lg border border-border bg-surface px-2.5 text-[13.5px] text-text-primary">
            <option value="">Any</option>
            {["CRITICAL", "HIGH", "MODERATE", "LOW"].map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">Status</label>
          <select id="status" name="status" defaultValue={status ?? ""} className="h-9 rounded-lg border border-border bg-surface px-2.5 text-[13.5px] text-text-primary">
            <option value="">Open risks</option>
            {["NEW", "OPEN", "MONITORING", "IMPROVING", "RESOLVED", "DISMISSED", "ACCEPTED"].map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="h-9 rounded-lg bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-hover">
          Apply
        </button>
      </form>

      <SurfaceCard className="p-0">
        {risks.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ShieldAlert}
              title={totalCount === 0 ? "No risks detected" : "No risks match these filters"}
              description={
                totalCount === 0
                  ? "Run an evaluation after importing customer data. Rules only fire when the data they need exists."
                  : "Try a different severity or status."
              }
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border px-4 py-3 text-[13px] text-text-secondary">
              <span>
                {totalCount} risk{totalCount === 1 ? "" : "s"} matching, showing {risks.length}
              </span>
              <span className="tabular-nums">
                Revenue in {accountsAtRisk} account{accountsAtRisk === 1 ? "" : "s"} on this page:{" "}
                {risks[0]?.customerAccount.currency ?? "USD"} {totalExposure.toLocaleString()}
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Revenue exposure</TableHead>
                  <TableHead>Renewal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.map((risk) => (
                  <TableRow key={risk.id}>
                    <TableCell>
                      <Link href={`/customers/${risk.customerAccount.id}`} className="font-medium text-brand hover:text-brand-hover">
                        {risk.customerAccount.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/risks/${risk.id}`} className="text-text-primary hover:text-brand">
                        {risk.title.replace(`${risk.customerAccount.name}: `, "")}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${SEVERITY_TONE[risk.severity]}`}>
                        {risk.severity.charAt(0) + risk.severity.slice(1).toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-text-secondary">{DIRECTION_LABEL[risk.direction]}</TableCell>
                    <TableCell className="tabular-nums text-text-secondary">{Math.round(risk.confidence * 100)}%</TableCell>
                    <TableCell className="tabular-nums text-text-secondary">
                      {risk.customerAccount.currency} {risk.revenueExposure.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {risk.customerAccount.renewalDate ? risk.customerAccount.renewalDate.toLocaleDateString() : <span className="text-text-muted">Not set</span>}
                    </TableCell>
                    <TableCell><Badge variant="outline">{risk.status}</Badge></TableCell>
                    <TableCell className="text-text-muted">{risk.detectedAt.toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </SurfaceCard>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-3 text-[13px]">
          {currentPage > 1 && (
            <Link href={`/risks?page=${currentPage - 1}${q ? `&q=${q}` : ""}${severity ? `&severity=${severity}` : ""}${status ? `&status=${status}` : ""}`} className="text-brand hover:text-brand-hover">
              Previous
            </Link>
          )}
          <span className="text-text-muted">Page {currentPage} of {totalPages}</span>
          {currentPage < totalPages && (
            <Link href={`/risks?page=${currentPage + 1}${q ? `&q=${q}` : ""}${severity ? `&severity=${severity}` : ""}${status ? `&status=${status}` : ""}`} className="text-brand hover:text-brand-hover">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
