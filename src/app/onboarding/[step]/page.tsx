import { redirect, notFound } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  ONBOARDING_STEPS,
  getOnboardingSession,
  canNavigateToStep,
  validateReadyToComplete,
} from "@/lib/services/onboarding-service";
import { getSetupProfile } from "@/lib/services/organization-setup-service";
import { calculateDataReadiness } from "@/lib/services/first-insight-service";
import { listRiskRuleStatus } from "@/lib/services/risk-rule-service";

import { WelcomeStep } from "../_components/welcome-step";
import { OrganizationProfileStep } from "../_components/organization-profile-step";
import { ChooseDataPathStep } from "../_components/choose-data-path-step";
import { ImportAccountsStep } from "../_components/import-accounts-step";
import { RenewalDataStep } from "../_components/renewal-data-step";
import { DataReadinessStep } from "../_components/data-readiness-step";
import { HealthModelStep } from "../_components/health-model-step";
import { RiskPreferencesStep } from "../_components/risk-preferences-step";
import { ExecutiveBriefStep } from "../_components/executive-brief-step";
import { TeamInvitationsStep } from "../_components/team-invitations-step";
import { ReviewStep } from "../_components/review-step";

export default async function OnboardingStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  const stepDef = ONBOARDING_STEPS.find((s) => s.key === step);
  if (!stepDef) notFound();

  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const session = await getOnboardingSession(membership.organizationId);
  if (!session) redirect("/onboarding");

  // Read-only check — rendering a step (including a revisit to one that's
  // already complete) must never itself move currentStep. Only an explicit
  // step-completing action does that.
  if (!canNavigateToStep(session, step)) {
    redirect("/onboarding");
  }

  const organizationId = membership.organizationId;

  switch (step) {
    case "welcome":
      return <WelcomeStep />;

    case "organization_profile": {
      const profile = await getSetupProfile(organizationId);
      return <OrganizationProfileStep existing={profile} />;
    }

    case "choose_data_path":
      return <ChooseDataPathStep />;

    case "import_customer_accounts": {
      const existingAccountCount = await prisma.customerAccount.count({ where: { organizationId } });
      return <ImportAccountsStep existingAccountCount={existingAccountCount} />;
    }

    case "renewal_data": {
      const [total, withDate] = await Promise.all([
        prisma.customerAccount.count({ where: { organizationId } }),
        prisma.customerAccount.count({ where: { organizationId, renewalDate: { not: null } } }),
      ]);
      return <RenewalDataStep accountsWithRenewalDate={withDate} totalAccounts={total} />;
    }

    case "data_readiness": {
      const readiness = await calculateDataReadiness(organizationId);
      return <DataReadinessStep readiness={readiness} />;
    }

    case "health_model": {
      const profile = await getSetupProfile(organizationId);
      return <HealthModelStep alreadyActivated={profile?.healthModelActivated ?? false} />;
    }

    case "risk_preferences": {
      const rules = await listRiskRuleStatus(organizationId);
      return <RiskPreferencesStep rules={rules} />;
    }

    case "executive_brief_setup":
      return <ExecutiveBriefStep />;

    case "team_invitations": {
      const pendingCount = await prisma.organizationInvitation.count({ where: { organizationId, status: "PENDING" } });
      return <TeamInvitationsStep pendingCount={pendingCount} />;
    }

    case "review_and_activate": {
      const [profile, accounts, memberCount, pendingInvitationCount] = await Promise.all([
        getSetupProfile(organizationId),
        prisma.customerAccount.findMany({ where: { organizationId } }),
        prisma.membership.count({ where: { organizationId } }),
        prisma.organizationInvitation.count({ where: { organizationId, status: "PENDING" } }),
      ]);
      const readiness = validateReadyToComplete(session);
      // "review_and_activate" itself is always reported missing until the
      // Activate action runs — completing it IS what that action does, so
      // it's not a real blocker to surface here.
      const missingSteps = readiness.missingSteps.filter((key) => key !== "review_and_activate");
      const activatedRiskRuleKeys = (profile?.activatedRiskRuleKeys as string[] | undefined) ?? [];

      return (
        <ReviewStep
          summary={{
            organizationName: membership.organizationName,
            goals: (session.goals as string[] | undefined) ?? [],
            accountCount: accounts.length,
            accountsWithOwner: accounts.filter((a) => a.ownerId).length,
            accountsWithRevenue: accounts.filter((a) => a.arr > 0).length,
            accountsWithRenewalDate: accounts.filter((a) => a.renewalDate).length,
            healthModelActivated: profile?.healthModelActivated ?? false,
            activatedRiskRuleCount: activatedRiskRuleKeys.length,
            briefConfigured: Boolean(profile?.executiveBriefConfig),
            memberCount,
            pendingInvitationCount,
            missingRequiredSteps: missingSteps,
          }}
        />
      );
    }

    default:
      notFound();
  }
}
