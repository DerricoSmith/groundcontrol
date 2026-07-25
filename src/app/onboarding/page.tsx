import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth/session";
import { getOnboardingSession } from "@/lib/services/onboarding-service";

export default async function OnboardingEntryPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const session = await getOnboardingSession(membership.organizationId);
  redirect(`/onboarding/${session?.currentStep ?? "welcome"}`);
}
