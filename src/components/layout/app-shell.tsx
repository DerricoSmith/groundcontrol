import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BottomNav } from "./bottom-nav";
import { Footer } from "./footer";
import { getAvailableOrganizations, getCurrentMembership } from "@/lib/auth/session";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [membership, availableOrganizations] = await Promise.all([
    getCurrentMembership(),
    getAvailableOrganizations(),
  ]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar membership={membership} availableOrganizations={availableOrganizations} />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar membership={membership} availableOrganizations={availableOrganizations} />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
          <div className="mx-auto w-full max-w-[1400px]">
            {children}
            <Footer />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
