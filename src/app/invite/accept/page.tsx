import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/auth/session";
import { LogoMark } from "@/components/brand/logo-mark";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { AcceptInviteForm } from "./accept-invite-form";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const membership = await getCurrentMembership();

  const invitation = token
    ? await prisma.organizationInvitation.findUnique({
        where: { token },
        include: { organization: true },
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-5 sm:px-6">
        <LogoMark size={26} />
        <span className="text-[14px] font-semibold text-text-primary">Ground Control</span>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-4 pb-24 pt-10 sm:px-6">
        <SurfaceCard className="p-6">
          {!token || !invitation ? (
            <div>
              <h1 className="font-serif text-[22px] font-medium text-text-primary">Invitation not found</h1>
              <p className="mt-2 text-[13.5px] text-text-secondary">
                This invitation link is missing or invalid. Ask whoever invited you to send a new one.
              </p>
            </div>
          ) : invitation.status !== "PENDING" ? (
            <div>
              <h1 className="font-serif text-[22px] font-medium text-text-primary">
                {invitation.status === "ACCEPTED" ? "Already accepted" : invitation.status === "REVOKED" ? "Invitation revoked" : "Invitation expired"}
              </h1>
              <p className="mt-2 text-[13.5px] text-text-secondary">
                {invitation.status === "ACCEPTED"
                  ? "This invitation has already been used."
                  : invitation.status === "REVOKED"
                    ? "This invitation was revoked by an administrator."
                    : "This invitation has expired. Ask an administrator to resend it."}
              </p>
            </div>
          ) : (
            <div>
              <h1 className="font-serif text-[22px] font-medium text-text-primary">Join {invitation.organization.name}</h1>
              <p className="mt-2 text-[13.5px] text-text-secondary">
                You&apos;ve been invited to join <strong>{invitation.organization.name}</strong> on Ground Control as
                a <strong>{invitation.role.replace(/_/g, " ").toLowerCase()}</strong>. This invitation was sent to{" "}
                <strong>{invitation.email}</strong>.
              </p>

              {!membership ? (
                <div className="mt-5 space-y-2">
                  <p className="text-[13px] text-text-secondary">
                    Log in or create an account using <strong>{invitation.email}</strong> to accept this invitation.
                  </p>
                  <div className="flex gap-2">
                    <Link href="/login" className="flex-1 rounded-lg bg-brand px-3 py-2 text-center text-[13.5px] font-medium text-white hover:bg-brand-hover">
                      Log in
                    </Link>
                    <Link href="/signup" className="flex-1 rounded-lg border border-border px-3 py-2 text-center text-[13.5px] font-medium text-text-primary hover:bg-surface-soft">
                      Create account
                    </Link>
                  </div>
                </div>
              ) : membership.userEmail !== invitation.email.toLowerCase() ? (
                <p className="mt-5 rounded-lg border border-danger/20 bg-danger-soft p-3 text-[13px] text-text-primary">
                  You&apos;re logged in as {membership.userEmail}, but this invitation was sent to {invitation.email}.
                  Log out and sign in with the invited address to accept it.
                </p>
              ) : (
                <AcceptInviteForm token={token} />
              )}
            </div>
          )}
        </SurfaceCard>
      </main>
    </div>
  );
}
