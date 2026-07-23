import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BottomNav } from "./bottom-nav";
import { QuickAskFab } from "./quick-ask-fab";
import { Footer } from "./footer";
import { DemoBanner } from "./demo-banner";
import { getCurrentUser, getFounder, isLiveWorkspace } from "@/lib/get-workspace-data";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [user, founder, isLive] = await Promise.all([getCurrentUser(), getFounder(), isLiveWorkspace()]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar founder={founder} isLive={isLive} />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar founder={founder} isLive={isLive} userEmail={user?.email ?? null} />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
          <div className="mx-auto w-full max-w-[1400px]">
            {!isLive && <DemoBanner />}
            {children}
            <Footer />
          </div>
        </main>
      </div>

      <BottomNav />
      <QuickAskFab />
    </div>
  );
}
