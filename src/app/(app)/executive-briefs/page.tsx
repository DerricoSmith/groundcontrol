import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { getCurrentMembership } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { GenerateBriefButton } from "./generate-brief-button";

export default async function ExecutiveBriefsPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const brief = await prisma.executiveBrief.findFirst({
    where: { organizationId: membership.organizationId },
    orderBy: { generatedAt: "desc" },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  return (
    <div>
      <PageHeader
        eyebrow={membership.organizationName}
        title="Executive Brief"
        description="A deterministic summary assembled from the customer data currently on file. No AI involved yet, and no email is sent while running locally."
        actions={can(membership.role, "manage_executive_brief") ? <GenerateBriefButton /> : undefined}
      />

      {!brief ? (
        <SurfaceCard className="p-6">
          <EmptyState icon={FileText} title="No Executive Brief yet" description="Generate a preview once you've imported customer accounts." />
        </SurfaceCard>
      ) : (
        <SurfaceCard className="p-6">
          <CardTitle
            title={brief.periodLabel}
            subtitle={`Generated ${new Date(brief.generatedAt).toLocaleString()}`}
            action={<Badge variant={brief.status === "APPROVED" ? "default" : "outline"}>{brief.status}</Badge>}
          />
          <div className="mt-5 space-y-5">
            {brief.sections.map((section) => (
              <div key={section.id}>
                <p className="text-[13.5px] font-medium text-text-primary">{section.title}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-text-secondary">{section.content}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
