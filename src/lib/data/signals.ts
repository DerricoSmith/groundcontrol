import type { Opportunity, Risk, VendorUpdate, ContentReminder, SupportIssue, RevenueEvent, UpcomingMoment } from "@/lib/types";

export const opportunities: Opportunity[] = [
  {
    id: "opp_bellweather",
    title: "Wholesale line sheet request",
    customerId: "cus_bellweather",
    customerName: "Bellweather & Finch",
    value: 2400,
    confidence: "hot",
    note: "Asked directly for pricing — this is a send, not a pitch.",
    nextAction: "Send the line sheet today",
  },
  {
    id: "opp_mira",
    title: "Consulting engagement, 6-week scope",
    customerId: "cus_mira",
    customerName: "Mira Studio",
    value: 6800,
    confidence: "hot",
    note: "Opened the proposal twice last night. Warmest lead on the board.",
    nextAction: "Follow up before noon",
  },
  {
    id: "opp_apex",
    title: "Quarterly retainer renewal",
    customerId: "cus_apex",
    customerName: "Apex Creative",
    value: 4800,
    confidence: "warm",
    note: "Past client, great terms, just needs a specific reason to re-engage.",
    nextAction: "Pitch a lighter-touch quarterly retainer",
  },
  {
    id: "opp_vela",
    title: "Co-branded Q4 bundle",
    customerId: "cus_vela",
    customerName: "Vela House",
    value: 3200,
    confidence: "warm",
    note: "Inbound partnership request with strong audience overlap.",
    nextAction: "Propose a scoping call",
  },
  {
    id: "opp_route",
    title: "Template library upsell",
    customerId: "cus_route",
    customerName: "Route & River",
    value: 140,
    confidence: "hot",
    note: "Already asked for the bundle — just needs the link.",
    nextAction: "Send bundle link",
  },
];

export const risks: Risk[] = [
  {
    id: "risk_northline",
    title: "Launch deadline at risk",
    customerId: "cus_northline",
    customerName: "Northline Goods",
    severity: "critical",
    note: "Production is 4 days behind their in-store launch deadline on the 30th.",
    recommendedAction: "Get a confirmed ship date from production today",
  },
  {
    id: "risk_elena",
    title: "Reliable buyer gone quiet",
    customerId: "cus_elena",
    customerName: "Elena Voss",
    severity: "elevated",
    note: "61 days since her last order after nearly a year of monthly purchases.",
    recommendedAction: "Send a personal note, not a discount blast",
  },
  {
    id: "risk_june",
    title: "Founding community member drifting",
    customerId: "cus_june",
    customerName: "June Park",
    severity: "elevated",
    note: "22 days without logging into the community after months of daily activity.",
    recommendedAction: "Personal check-in before renewal date",
  },
  {
    id: "risk_kenji",
    title: "Shipping delay could turn into a complaint",
    customerId: "cus_kenji",
    customerName: "Kenji Mori",
    severity: "watch",
    note: "Order has no carrier scan in 4 days. Customer is polite but noticing.",
    recommendedAction: "Reply today with a concrete update",
  },
  {
    id: "risk_carvalho",
    title: "Payment pattern slipping",
    customerId: "cus_carvalho",
    customerName: "Carvalho Consulting Group",
    severity: "elevated",
    note: "Invoices have drifted later each of the last three cycles.",
    recommendedAction: "Call instead of a third email",
  },
];

export const vendorUpdates: VendorUpdate[] = [
  {
    id: "vendor_tanaka",
    vendor: "Tanaka Supply Co.",
    message: "Artwork proof ready for sign-off — production is blocked until approved.",
    waitingOn: "you",
    daysAgo: 4,
  },
  {
    id: "vendor_northline_prod",
    vendor: "Production partner (Northline order)",
    message: "Running 4 days behind on the Northline Goods restock.",
    waitingOn: "them",
    daysAgo: 1,
  },
  {
    id: "vendor_packaging",
    vendor: "Cedar & Co. Packaging",
    message: "New mailer boxes shipped, arriving Thursday.",
    waitingOn: null,
    daysAgo: 2,
  },
];

export const contentReminders: ContentReminder[] = [
  { id: "content_newsletter", title: "Weekly newsletter", channel: "Email", dueLabel: "2 days overdue", overdue: true },
  { id: "content_reel", title: "TikTok collab follow-up post", channel: "Social", dueLabel: "Due this week", overdue: false },
  { id: "content_case_study", title: "Apex Creative case study writeup", channel: "Website", dueLabel: "Due in 5 days", overdue: false },
];

export const supportIssues: SupportIssue[] = [
  { id: "sup_kenji", customerId: "cus_kenji", customerName: "Kenji Mori", issue: "Order stuck in transit, no carrier scan in 4 days", severity: "medium", hoursAgo: 20 },
  { id: "sup_harlan", customerId: "cus_harlan", customerName: "Harlan Reed", issue: "Damaged item, refund or replacement requested", severity: "medium", hoursAgo: 26 },
  { id: "sup_northline", customerId: "cus_northline", customerName: "Northline Goods", issue: "Production delay risking launch-day deadline", severity: "high", hoursAgo: 40 },
];

export const revenueEvents: RevenueEvent[] = [
  { id: "rev_01", title: "Bellweather & Finch paid invoice", detail: "INV-2037 settled same day", amount: 890, hoursAgo: 6, channel: "wholesale", sentiment: "positive" },
  { id: "rev_02", title: "New order from Route & River", detail: "Planning template purchase", amount: 34, hoursAgo: 18, channel: "digital", sentiment: "positive" },
  { id: "rev_03", title: "Carvalho invoice crossed 12 days overdue", detail: "INV-2041, third follow-up needed", amount: 4200, hoursAgo: 20, channel: "consulting", sentiment: "negative" },
  { id: "rev_04", title: "Mira Studio opened the proposal again", detail: "Second open in one evening", amount: 6800, hoursAgo: 12, channel: "consulting", sentiment: "positive" },
  { id: "rev_05", title: "Community renewal charge succeeded", detail: "14 members renewed automatically", amount: 406, hoursAgo: 30, channel: "community", sentiment: "positive" },
  { id: "rev_06", title: "Northline shipment flagged delayed", detail: "Production running 4 days behind", amount: 2140, hoursAgo: 40, channel: "wholesale", sentiment: "negative" },
];

export const upcomingMoments: UpcomingMoment[] = [
  { id: "mom_01", title: "Northline Goods launch deadline", detail: "They need stock in-store by the 30th", when: "In 6 days", icon: "milestone" },
  { id: "mom_02", title: "Mira Studio proposal call", when: "Thursday, 2:00 PM", detail: "If she confirms this week", icon: "meeting" },
  { id: "mom_03", title: "Community annual renewal window opens", when: "In 9 days", detail: "38 members up for renewal", icon: "renewal" },
  { id: "mom_04", title: "Q3 consulting capacity check", when: "In 12 days", detail: "Currently booked through the 24th", icon: "calendar" },
];
