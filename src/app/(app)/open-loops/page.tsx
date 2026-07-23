import { getOpenLoops, isLiveWorkspace } from "@/lib/get-workspace-data";
import { OpenLoopsClient } from "./open-loops-client";

export default async function OpenLoopsPage() {
  const [loops, isLive] = await Promise.all([getOpenLoops(), isLiveWorkspace()]);
  return <OpenLoopsClient initialLoops={loops} isLive={isLive} />;
}
