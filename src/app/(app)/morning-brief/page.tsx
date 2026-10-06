import {
  getCustomers,
  getInvoices,
  getOpenLoops,
  getOpportunities,
  getRisks,
  getFounder,
  isLiveWorkspace,
} from "@/lib/get-workspace-data";
import { cookies } from "next/headers";
import { TZ_COOKIE, formatDateLabel, resolveTimeZone } from "@/lib/timezone";
import { MorningBriefClient } from "./morning-brief-client";

export default async function MorningBriefPage() {
  const timeZone = resolveTimeZone((await cookies()).get(TZ_COOKIE)?.value);
  const dateLabel = formatDateLabel(new Date(), timeZone);

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
