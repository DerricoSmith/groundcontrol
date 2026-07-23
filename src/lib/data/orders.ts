import type { Order, Invoice, RevenueStreamPoint } from "@/lib/types";

export const orders: Order[] = [
  { id: "ORD-4821", customerId: "cus_kenji", customerName: "Kenji Mori", amount: 340, status: "delayed", placedHoursAgo: 96, items: 2, product: "Ceramic Pour-Over Set", channel: "shopify" },
  { id: "ORD-4820", customerId: "cus_harlan", customerName: "Harlan Reed", amount: 210, status: "refund-requested", placedHoursAgo: 216, items: 3, product: "Everyday Mug Trio", channel: "shopify" },
  { id: "ORD-4819", customerId: null, customerName: "Priya Anand", amount: 412, status: "fulfilled", placedHoursAgo: 14, items: 4, product: "Studio Desk Set", channel: "shopify" },
  { id: "ORD-4818", customerId: null, customerName: "Grace Whitfield", amount: 268, status: "fulfilled", placedHoursAgo: 22, items: 3, product: "Ceramic Pour-Over Kit", channel: "shopify" },
  { id: "ORD-4817", customerId: "cus_northline", customerName: "Northline Goods", amount: 2140, status: "delayed", placedHoursAgo: 432, items: 24, product: "Wholesale Launch Restock", channel: "wholesale" },
  { id: "ORD-4816", customerId: null, customerName: "Harriet Okafor", amount: 156, status: "fulfilled", placedHoursAgo: 33, items: 2, product: "Weekly Planner Refill", channel: "shopify" },
  { id: "ORD-4815", customerId: "cus_bellweather", customerName: "Bellweather & Finch", amount: 890, status: "fulfilled", placedHoursAgo: 960, items: 8, product: "Wholesale Starter Case", channel: "wholesale" },
  { id: "ORD-4814", customerId: "cus_route", customerName: "Route & River", amount: 34, status: "fulfilled", placedHoursAgo: 744, items: 1, product: "Planning Template", channel: "digital" },
];

export const invoices: Invoice[] = [
  { id: "INV-2041", customerId: "cus_carvalho", client: "Carvalho Consulting Group", amount: 4200, issuedDaysAgo: 34, dueInDays: -12, status: "overdue", channel: "consulting" },
  { id: "INV-2040", customerId: "cus_apex", client: "Apex Creative", amount: 3800, issuedDaysAgo: 96, dueInDays: -62, status: "paid", channel: "consulting" },
  { id: "INV-2039", customerId: "cus_northline", client: "Northline Goods", amount: 2140, issuedDaysAgo: 18, dueInDays: -3, status: "overdue", channel: "wholesale" },
  { id: "INV-2038", customerId: null, client: "Kessler Studio", amount: 7500, issuedDaysAgo: 6, dueInDays: 9, status: "sent", channel: "consulting" },
  { id: "INV-2037", customerId: "cus_bellweather", client: "Bellweather & Finch", amount: 890, issuedDaysAgo: 2, dueInDays: 13, status: "paid", channel: "wholesale" },
  { id: "INV-2036", customerId: null, client: "Trumbull Logistics", amount: 980, issuedDaysAgo: 55, dueInDays: -25, status: "overdue", channel: "wholesale" },
  { id: "INV-2035", customerId: "cus_mira", client: "Mira Studio — Proposal", amount: 6800, issuedDaysAgo: 3, dueInDays: 14, status: "draft", channel: "consulting" },
  { id: "INV-2034", customerId: null, client: "Anand Wellness Studio", amount: 640, issuedDaysAgo: 20, dueInDays: 0, status: "paid", channel: "wholesale" },
];

export const revenueStreamSeries: RevenueStreamPoint[] = [
  { week: "May 26", shopify: 2380, consulting: 1800, wholesale: 640, digital: 210, community: 290 },
  { week: "Jun 02", shopify: 2610, consulting: 2400, wholesale: 890, digital: 260, community: 300 },
  { week: "Jun 09", shopify: 2190, consulting: 1200, wholesale: 0, digital: 180, community: 310 },
  { week: "Jun 16", shopify: 2940, consulting: 3400, wholesale: 1180, digital: 320, community: 300 },
  { week: "Jun 23", shopify: 3120, consulting: 1800, wholesale: 640, digital: 240, community: 320 },
  { week: "Jun 30", shopify: 2870, consulting: 4200, wholesale: 0, digital: 410, community: 330 },
  { week: "Jul 07", shopify: 3480, consulting: 2600, wholesale: 890, digital: 290, community: 340 },
  { week: "Jul 14", shopify: 3910, consulting: 3800, wholesale: 2140, digital: 360, community: 350 },
];

export const streamMeta = {
  shopify: { label: "Shopify", color: "var(--color-brand)" },
  consulting: { label: "Consulting", color: "var(--color-accent-blue)" },
  wholesale: { label: "Wholesale", color: "var(--color-accent-amber)" },
  digital: { label: "Digital products", color: "var(--color-accent-green)" },
  community: { label: "Community", color: "var(--color-chart-5)" },
} as const;
