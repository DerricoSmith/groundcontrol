import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Users, TrendingUp } from "lucide-react";
import { getCurrentMembership } from "@/lib/auth/session";
import { getOnboardingSession } from "@/lib/services/onboarding-service";
import { getFirstInsights } from "@/lib/services/first-insight-service";
import { getLatestBrief } from "@/lib/services/executive-brief-service";
import { prisma } from "@/lib/prisma";
import { LogoMark } from "@/components/brand/logo-mark";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { Button } from "@/components/ui/button";

export default async function FirstValuePage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const session = await getOnboardingSession(membership.organizationId);
  if (!session || session.status !== "COMPLETED") redirect("/onboarding");

  const [accountCount, insights, brief] = await Promise.all([
    prisma.customerAccount.count({ where: { organizationId: membership.organizationId } }),
    getFirstInsights(membership.organizationId),
    getLatestBrief(membership.organizationId),
  ]);

  const revenueInsight = insights.find((i) => i.type === "largest_revenue_exposure");
  const limitationInsight = insights.find((i) => i.type === "renewal_visibility_gap") ?? insights.find((i) => i.type === "incomplete_data");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-4 sm:px-6">
          <LogoMark size={26} />
          <span className="text-[14px] font-semibold text-text-primary">Ground Control</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <div>
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-brand">Portfolio ready</p>
          <h1 className="mt-2 font-serif text-[28px] font-medium tracking-tight text-text-primary sm:text-[32px]">
            {accountCount} customer account{accountCount === 1 ? "" : "s"} loaded.
          </h1>
          <p className="mt-2 max-w-xl text-[14px] text-text-secondary">
            This is what Ground Control can currently see for {membership.organizationName}.
          </p>
        </div>

        {revenueInsight && (
          <SurfaceCard className="p-6">
            <CardTitle icon={TrendingUp} title="An account worth reviewing" subtitle={revenueInsight.customerAccountName} />
            <p className="mt-3 text-[13.5px] text-text-secondary">{revenueInsight.currentState}</p>
            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[12.5px] text-text-muted">
              {revenueInsight.evidence.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
            <p className="mt-3 text-[13px] text-text-primary"><span className="font-medium">Recommended: </span>{revenueInsight.recommendedAction}</p>
            {revenueInsight.customerAccountId && (
              <Link href={`/customers/${revenueInsight.customerAccountId}`} className="mt-3 inline-flex items-center gap-1 text-[13px] text-brand hover:text-brand-hover">
                Open this account <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </SurfaceCard>
        )}

        {limitationInsight && (
          <SurfaceCard className="p-6">
            <CardTitle title="Worth knowing" subtitle={limitationInsight.title} iconTone="amber" />
            <p className="mt-3 text-[13.5px] text-text-secondary">{limitationInsight.currentState}</p>
            <p className="mt-2 text-[13px] text-text-primary"><span className="font-medium">Recommended: </span>{limitationInsight.recommendedAction}</p>
          </SurfaceCard>
        )}

        {brief && (
          <SurfaceCard className="p-6">
            <CardTitle title="Your first Executive Brief" subtitle="Preview, based on imported data only" />
            <div className="mt-3 space-y-3">
              {brief.sections.slice(0, 3).map((section) => (
                <div key={section.id}>
                  <p className="text-[13px] font-medium text-text-primary">{section.title}</p>
                  <p className="text-[13px] text-text-secondary">{section.content}</p>
                </div>
              ))}
            </div>
            <Link href="/executive-briefs" className="mt-4 inline-flex items-center gap-1 text-[13px] text-brand hover:text-brand-hover">
              View full brief <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </SurfaceCard>
        )}

        <SurfaceCard className="p-6 text-center">
          <p className="font-serif text-[20px] font-medium text-text-primary">Your Ground Control workspace is ready.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button render={<Link href="/mission-control" />} nativeButton={false} className="bg-brand text-white hover:bg-brand-hover">
              Go to Mission Control
            </Button>
            <Button render={<Link href="/customers" />} nativeButton={false} variant="outline">
              Review Customer Portfolio
            </Button>
            <Button render={<Link href="/organization/members" />} nativeButton={false} variant="outline">
              <Users className="mr-1.5 h-3.5 w-3.5" /> Invite your team
            </Button>
          </div>
        </SurfaceCard>
      </main>
    </div>
  );
}
