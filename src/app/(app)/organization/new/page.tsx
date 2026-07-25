import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { NewOrganizationForm } from "./new-organization-form";

export default async function NewOrganizationPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  return (
    <div>
      <PageHeader
        eyebrow="New organization"
        title="Create another organization"
        description="You'll be the owner of this organization. It starts completely separate from your other organizations — no data or members carry over."
      />
      <NewOrganizationForm />
    </div>
  );
}
