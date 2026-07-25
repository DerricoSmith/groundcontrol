import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { getCurrentMembership } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/auth/permissions";
import { ACTION_TYPE_LABELS } from "@/lib/services/action-service";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ActionRowControls, GenerateSuggestionsButton } from "./action-controls";

type ViewKey = "all" | "mine" | "overdue" | "unassigned" | "suggested" | "blocked" | "completed";

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "all", label: "All open" },
  { key: "mine", label: "My actions" },
  { key: "overdue", label: "Overdue" },
  { key: "unassigned", label: "Unassigned" },
  { key: "suggested", label: "Suggested" },
  { key: "blocked", label: "Blocked" },
  { key: "completed", label: "Completed" },
];

const OPEN_STATUSES = ["SUGGESTED", "AWAITING_APPROVAL", "OPEN", "IN_PROGRESS", "BLOCKED"] as const;

export default async function ActionsCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const { view } = await searchParams;
  const currentView = (VIEWS.find((v) => v.key === view)?.key ?? "all") as ViewKey;
  const now = new Date();

  const whereByView: Record<ViewKey, Prisma.RecommendedActionWhereInput> = {
    all: { status: { in: [...OPEN_STATUSES] } },
    mine: { ownerId: membership.userId, status: { in: [...OPEN_STATUSES] } },
    overdue: { dueDate: { lt: now }, status: { in: [...OPEN_STATUSES] } },
    unassigned: { ownerId: null, status: { in: [...OPEN_STATUSES] } },
    suggested: { status: "SUGGESTED" },
    blocked: { status: "BLOCKED" },
    completed: { status: "COMPLETED" },
  };

  const [actions, members] = await Promise.all([
    prisma.recommendedAction.findMany({
      where: { organizationId: membership.organizationId, ...whereByView[currentView] },
      include: {
        customerAccount: { select: { id: true, name: true } },
        riskSignal: { select: { id: true, severity: true } },
      },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.membership.findMany({
      where: { organizationId: membership.organizationId },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  const canManage = can(membership.role, "manage_actions");
  const memberOptions = members.map((m) => ({ id: m.user.id, name: m.user.name }));

  return (
    <div>
      <PageHeader
        eyebrow={membership.organizationName}
        title="Actions"
        description="What should happen next, and who owns it. Suggested actions come from open risks and carry that risk's evidence."
        actions={canManage ? <GenerateSuggestionsButton /> : undefined}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={`/actions?view=${v.key}`}
            className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
              currentView === v.key ? "border-brand bg-brand-soft font-medium text-brand" : "border-border text-text-secondary hover:bg-surface-soft"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>

      <SurfaceCard className="p-0">
        <div className="border-b border-border px-6 py-4">
          <CardTitle title={VIEWS.find((v) => v.key === currentView)!.label} subtitle={`${actions.length} action${actions.length === 1 ? "" : "s"}`} />
        </div>
        {actions.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ClipboardList}
              title="No actions in this view"
              description="Suggested actions are generated from open risks. Run a risk evaluation, then generate suggestions."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Manage</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell>
                    <Link href={`/customers/${action.customerAccount.id}`} className="font-medium text-brand hover:text-brand-hover">
                      {action.customerAccount.name}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-sm whitespace-normal text-text-primary">
                    {action.title}{" "}
                    {action.riskSignal && (
                      <Link href={`/risks/${action.riskSignal.id}`} className="text-[12px] text-brand hover:text-brand-hover">
                        View the risk
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="text-text-secondary">{ACTION_TYPE_LABELS[action.actionType] ?? action.actionType}</TableCell>
                  <TableCell className="text-text-secondary capitalize">{action.priority}</TableCell>
                  <TableCell className="text-text-secondary">
                    {memberOptions.find((m) => m.id === action.ownerId)?.name ?? <span className="text-text-muted">Unassigned</span>}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {action.dueDate ? action.dueDate.toLocaleDateString() : <span className="text-text-muted">Not set</span>}
                  </TableCell>
                  <TableCell><Badge variant="outline">{action.status}</Badge></TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <ActionRowControls actionId={action.id} currentStatus={action.status} currentOwnerId={action.ownerId} members={memberOptions} />
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
