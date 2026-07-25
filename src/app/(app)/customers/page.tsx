import { redirect } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import type { HealthCategory, Prisma } from "@prisma/client";
import { getCurrentMembership } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { OPEN_RISK_STATUSES } from "@/lib/services/portfolio-summary-service";
import { daysFromNow } from "@/lib/dates";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

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

const PAGE_SIZE = 50;

/**
 * Saved views are deliberately a fixed, named set rather than user-defined
 * filters. Each one answers a question an executive actually asks, and each
 * is expressible as a query over data that exists.
 */
const VIEWS = [
  { key: "all", label: "All accounts" },
  { key: "at_risk", label: "At risk" },
  { key: "renewing_90", label: "Renewing in 90 days" },
  { key: "unowned", label: "No owner" },
  { key: "incomplete", label: "Incomplete data" },
] as const;
type ViewKey = (typeof VIEWS)[number]["key"];

const SORTS = [
  { key: "name", label: "Name" },
  { key: "arr", label: "ARR, highest first" },
  { key: "renewal", label: "Renewal date, soonest first" },
  { key: "confidence", label: "Data confidence, lowest first" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

const ORDER_BY: Record<SortKey, Prisma.CustomerAccountOrderByWithRelationInput[]> = {
  name: [{ name: "asc" }],
  arr: [{ arr: "desc" }, { name: "asc" }],
  // Nulls last so accounts without a renewal date do not crowd out the ones
  // that actually have a deadline.
  renewal: [{ renewalDate: { sort: "asc", nulls: "last" } }, { name: "asc" }],
  confidence: [{ dataConfidence: "asc" }, { name: "asc" }],
};

export default async function CustomerPortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string; sort?: string; page?: string }>;
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const view = (VIEWS.find((v) => v.key === params.view)?.key ?? "all") as ViewKey;
  const sort = (SORTS.find((s) => s.key === params.sort)?.key ?? "name") as SortKey;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const ninetyDaysOut = daysFromNow(90);

  const viewFilter: Record<ViewKey, Prisma.CustomerAccountWhereInput> = {
    all: {},
    at_risk: { healthCategory: { in: ["AT_RISK", "CRITICAL"] } },
    renewing_90: { renewalDate: { not: null, lte: ninetyDaysOut } },
    unowned: { ownerId: null },
    incomplete: { OR: [{ arr: 0 }, { renewalDate: null }, { segment: null }] },
  };

  const where: Prisma.CustomerAccountWhereInput = {
    organizationId: membership.organizationId,
    ...viewFilter[view],
    ...(q ? { name: { contains: q } } : {}),
  };

  const [accounts, totalCount] = await Promise.all([
    prisma.customerAccount.findMany({
      where,
      include: {
        owner: { select: { name: true } },
        riskSignals: { where: { status: { in: [...OPEN_RISK_STATUSES] } }, select: { id: true, severity: true } },
      },
      orderBy: ORDER_BY[sort],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.customerAccount.count({ where }),
  ]);

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const linkTo = (next: Partial<{ q: string; view: string; sort: string; page: string }>) => {
    const search = new URLSearchParams();
    const merged = { q, view, sort, page: String(page), ...next };
    if (merged.q) search.set("q", merged.q);
    if (merged.view !== "all") search.set("view", merged.view);
    if (merged.sort !== "name") search.set("sort", merged.sort);
    if (merged.page !== "1") search.set("page", merged.page);
    const query = search.toString();
    return query ? `/customers?${query}` : "/customers";
  };

  return (
    <div>
      <PageHeader
        eyebrow={membership.organizationName}
        title="Customer Portfolio"
        description="Every customer account in your organization, with what is known and what is missing."
      />

      <form className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by account name"
          aria-label="Search by account name"
          className="max-w-sm border-border bg-surface"
        />
        {view !== "all" && <input type="hidden" name="view" value={view} />}
        {sort !== "name" && <input type="hidden" name="sort" value={sort} />}
      </form>

      <div className="mb-3 flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={linkTo({ view: v.key, page: "1" })}
            className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
              view === v.key
                ? "border-brand bg-brand-soft font-medium text-brand"
                : "border-border text-text-secondary hover:bg-surface-soft"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-text-secondary">
        <span>Sort by</span>
        {SORTS.map((s) => (
          <Link
            key={s.key}
            href={linkTo({ sort: s.key, page: "1" })}
            aria-current={sort === s.key ? "true" : undefined}
            // text-text-muted is a decorative grey that fails contrast against
            // the page background for interactive text. Sort options are
            // controls, not captions, so they use the secondary text colour.
            className={sort === s.key ? "font-medium text-brand" : "text-text-secondary hover:text-text-primary"}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <SurfaceCard className="p-0">
        {accounts.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title={q || view !== "all" ? "No accounts match this view" : "No customer accounts yet"}
              description={
                q || view !== "all"
                  ? "Try a different search term or view."
                  : "Import customer accounts to populate this view. Ground Control shows only what has been given to it."
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>ARR</TableHead>
                <TableHead>Renewal</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Open risks</TableHead>
                <TableHead>Data confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => {
                const severeRisks = account.riskSignals.filter(
                  (risk) => risk.severity === "CRITICAL" || risk.severity === "HIGH"
                ).length;
                return (
                  <TableRow key={account.id}>
                    <TableCell>
                      <Link href={`/customers/${account.id}`} className="font-medium text-brand hover:text-brand-hover">
                        {account.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {account.owner?.name ?? <span className="text-text-muted">Unassigned</span>}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {account.segment ?? <span className="text-text-muted">Not set</span>}
                    </TableCell>
                    <TableCell className="tabular-nums text-text-secondary">
                      {account.arr > 0 ? (
                        `${account.currency} ${account.arr.toLocaleString()}`
                      ) : (
                        <span className="text-text-muted">Not on file</span>
                      )}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {account.renewalDate ? (
                        new Date(account.renewalDate).toLocaleDateString()
                      ) : (
                        <span className="text-text-muted">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {account.healthCalculatedAt === null ? (
                        <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[12px] font-medium text-text-muted">
                          Not assessed
                        </span>
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${HEALTH_TONE[account.healthCategory]}`}>
                          {HEALTH_LABEL[account.healthCategory]}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {account.riskSignals.length === 0 ? (
                        <span className="text-text-muted">0</span>
                      ) : severeRisks > 0 ? (
                        <Badge variant="destructive">{account.riskSignals.length}</Badge>
                      ) : (
                        <Badge variant="outline">{account.riskSignals.length}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-text-secondary">{Math.round(account.dataConfidence * 100)}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SurfaceCard>

      <div className="mt-4 flex items-center justify-between text-[13px] text-text-secondary">
        <span>
          {totalCount === 0
            ? "No accounts"
            : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount}`}
        </span>
        {pageCount > 1 && (
          <span className="flex items-center gap-3">
            {page > 1 && (
              <Link href={linkTo({ page: String(page - 1) })} className="text-brand hover:text-brand-hover">
                Previous
              </Link>
            )}
            <span className="text-text-muted">
              Page {page} of {pageCount}
            </span>
            {page < pageCount && (
              <Link href={linkTo({ page: String(page + 1) })} className="text-brand hover:text-brand-hover">
                Next
              </Link>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
