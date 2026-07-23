import {
  getCustomers,
  getInvoices,
  getOpenLoops,
  getOpportunities,
  getRisks,
  getFounder,
  isLiveWorkspace,
} from "@/lib/get-workspace-data";
import { MorningBriefClient } from "./morning-brief-client";

const today = new Date(2026, 6, 23);
const dateLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

export default async function MorningBriefPage() {
  const [customers, invoices, loops, opportunities, risks, founder, isLive] = await Promise.all([
    getCustomers(),
    getInvoices(),
    getOpenLoops(),
    getOpportunities(),
    getRisks(),
    getFounder(),
    isLiveWorkspace(),
  ]);

  return (
    <MorningBriefClient
      dateLabel={dateLabel}
      founderFirstName={founder.firstName}
      customers={customers}
      invoices={invoices}
      loops={loops}
      opportunities={opportunities}
      risks={risks}
      isLive={isLive}
    />
  );
}
