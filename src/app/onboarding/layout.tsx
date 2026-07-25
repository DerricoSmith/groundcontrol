import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentMembership } from "@/lib/auth/session";
import { getOnboardingSession, calculateProgress, startOrResumeOnboarding } from "@/lib/services/onboarding-service";
import { LogoMark } from "@/components/brand/logo-mark";
import { Progress } from "@/components/ui/progress";
import { logoutAction } from "@/lib/actions/auth-actions";

/**
 * Only owners, administrators, and consultants drive Quick Start setup —
 * see the step registry's allowedRoles. An invited CS Manager/Executive/
 * Analyst/Viewer is never routed into this wizard at all; role-specific
 * lightweight orientation content (founder's Phase 26) isn't built yet, so
 * for now those roles land straight in Mission Control instead of being
 * shown an admin setup flow they can't complete — see
 * ONBOARDING_KNOWN_LIMITATIONS.md.
 */
const SETUP_DRIVER_ROLES = ["OWNER", "ADMINISTRATOR", "SIGNAL_STATE_CONSULTANT"];

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!SETUP_DRIVER_ROLES.includes(membership.role)) redirect("/mission-control");

  let session = await getOnboardingSession(membership.organizationId);
  if (!session) {
    session = await startOrResumeOnboarding({ organizationId: membership.organizationId, actingUserId: membership.userId });
  }
  if (session.status === "COMPLETED") redirect("/mission-control");

  const progress = calculateProgress(session);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <LogoMark size={26} />
            <div className="leading-tight">
              <p className="text-[13.5px] font-semibold text-text-primary">Ground Control</p>
              <p className="text-[11.5px] text-text-muted">{membership.organizationName} · Signal &amp; State</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/mission-control" className="text-[12.5px] text-text-muted hover:text-text-primary">
              Save and continue later
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="text-[12.5px] text-text-muted hover:text-text-primary">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-4 sm:px-6">
          <div className="flex items-center justify-between text-[11.5px] text-text-muted">
            <span>
              {progress.completedRequired} of {progress.totalRequired} required steps complete
            </span>
            <span>{progress.percentRequired}%</span>
          </div>
          <Progress value={progress.percentRequired} className="mt-1.5 flex-col gap-0" aria-label="Onboarding progress" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>

      <footer className="mx-auto max-w-4xl px-4 pb-10 sm:px-6">
        <p className="text-[12px] text-text-muted">
          Need help? <span className="text-text-secondary">Get help from Signal &amp; State</span> isn&apos;t wired up in this local build yet — see
          ONBOARDING_KNOWN_LIMITATIONS.md.
        </p>
      </footer>
    </div>
  );
}
