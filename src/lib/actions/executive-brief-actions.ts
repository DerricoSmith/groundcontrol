"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMembership } from "@/lib/auth/session";
import { generatePreviewBrief, ExecutiveBriefError } from "@/lib/services/executive-brief-service";

export async function generateBriefPreviewAction(): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "You must be logged in." };

  try {
    await generatePreviewBrief({ organizationId: membership.organizationId, actingUserId: membership.userId, actingRole: membership.role });
    revalidatePath("/executive-briefs");
    return {};
  } catch (error) {
    if (error instanceof ExecutiveBriefError || error instanceof Error) return { error: error.message };
    throw error;
  }
}
