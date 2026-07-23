import { getCustomers, isLiveWorkspace } from "@/lib/get-workspace-data";
import { CustomerRadarClient } from "./customer-radar-client";

export default async function CustomerRadarPage() {
  const [customers, isLive] = await Promise.all([getCustomers(), isLiveWorkspace()]);
  return <CustomerRadarClient customers={customers} isLive={isLive} />;
}
