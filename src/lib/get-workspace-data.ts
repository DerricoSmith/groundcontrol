import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mapCustomer, mapInvoice, mapOpenLoop, mapOpportunity, mapRisk } from "@/lib/mappers";
import {
  customers as mockCustomers,
  invoices as mockInvoices,
  openLoopsSeed as mockOpenLoops,
  opportunities as mockOpportunities,
  risks as mockRisks,
  founder as mockFounder,
} from "@/lib/data";
import type { Customer, Invoice, OpenLoop, Opportunity, Risk } from "@/lib/types";

/** Request-memoized: at most one session + workspace lookup per request. */
export const getCurrentWorkspace = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.workspace.findUnique({ where: { ownerId: session.user.id } });
});

export const getCurrentUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});

/** True once a real signed-in workspace exists — false means "demo mode". */
export async function isLiveWorkspace() {
  return (await getCurrentWorkspace()) !== null;
}

export async function getFounder() {
  const workspace = await getCurrentWorkspace();
  const user = await getCurrentUser();
  if (!workspace || !user) return mockFounder;

  const [first, ...rest] = (user.name ?? "").split(" ");
  return {
    name: user.name ?? "",
    firstName: first || "there",
    business: workspace.businessName,
    role: "Founder",
    avatarInitials: `${first?.[0] ?? ""}${rest[0]?.[0] ?? ""}`.toUpperCase() || "U",
  };
}

export async function getCustomers(): Promise<Customer[]> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return mockCustomers;
  const rows = await prisma.customer.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } });
  return rows.map(mapCustomer);
}

export async function getInvoices(): Promise<Invoice[]> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return mockInvoices;
  const rows = await prisma.invoice.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } });
  return rows.map(mapInvoice);
}

export async function getOpenLoops(): Promise<OpenLoop[]> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return mockOpenLoops;
  const rows = await prisma.openLoop.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } });
  return rows.map(mapOpenLoop);
}

export async function getOpportunities(): Promise<Opportunity[]> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return mockOpportunities;
  const rows = await prisma.opportunity.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } });
  return rows.map(mapOpportunity);
}

export async function getRisks(): Promise<Risk[]> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return mockRisks;
  const rows = await prisma.risk.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } });
  return rows.map(mapRisk);
}
