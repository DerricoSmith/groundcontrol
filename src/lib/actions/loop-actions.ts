"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentWorkspace } from "@/lib/get-workspace-data";

export async function setOpenLoopStatus(loopId: string, status: "open" | "done" | "snoozed") {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return; // demo mode — nothing to persist

  // Scope the update to the caller's own workspace so one user can never
  // mutate another workspace's data by guessing an id.
  const result = await prisma.openLoop.updateMany({
    where: { id: loopId, workspaceId: workspace.id },
    data: { status },
  });

  if (result.count > 0) {
    revalidatePath("/open-loops");
    revalidatePath("/morning-brief");
  }
}
