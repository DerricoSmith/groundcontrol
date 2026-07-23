export type Channel =
  | "shopify"
  | "consulting"
  | "wholesale"
  | "digital"
  | "community"
  | "vendor"
  | "partnership";

export type Sentiment = "positive" | "neutral" | "negative";

export type WaitingOn = "you" | "them" | null;

export type CustomerStatus =
  | "Needs personal touch"
  | "Overdue payment"
  | "Ready for follow-up"
  | "Order issue"
  | "Warm lead"
  | "Quiet VIP"
  | "Needs reply"
  | "Quiet but valuable"
  | "On track";

export interface TimelineEvent {
  date: string;
  label: string;
  detail: string;
}

export interface Customer {
  id: string;
  name: string;
  company?: string;
  avatarInitials: string;
  channel: Channel;
  status: CustomerStatus;
  sentiment: Sentiment;
  isVIP: boolean;
  atRisk: boolean;
  isOpportunity: boolean;
  needsReply: boolean;
  waitingOn: WaitingOn;
  ltv: number;
  lastTouchDaysAgo: number;
  location: string;
  email: string;
  tags: string[];
  relationshipSummary: string;
  lastMessage: string;
  openIssue: string | null;
  nextAction: string;
  suggestedReply: string;
  notes: string;
  revenueOpportunity: number | null;
  timeline: TimelineEvent[];
}

export type OrderStatus = "fulfilled" | "processing" | "delayed" | "refund-requested" | "refunded";

export interface Order {
  id: string;
  customerId: string | null;
  customerName: string;
  amount: number;
  status: OrderStatus;
  placedHoursAgo: number;
  items: number;
  product: string;
  channel: Channel;
}

export type InvoiceStatus = "paid" | "sent" | "overdue" | "draft";

export interface Invoice {
  id: string;
  customerId: string | null;
  client: string;
  amount: number;
  issuedDaysAgo: number;
  dueInDays: number;
  status: InvoiceStatus;
  channel: Channel;
}

export type Priority = "urgent" | "high" | "normal" | "low";
export type LoopType =
  | "customer-reply"
  | "invoice-follow-up"
  | "vendor-waiting"
  | "shipment-issue"
  | "proposal-follow-up"
  | "content-overdue"
  | "product-task"
  | "meeting-follow-up"
  | "refund-review"
  | "personal-reminder";

export interface OpenLoop {
  id: string;
  title: string;
  type: LoopType;
  source: string;
  customerId: string | null;
  priority: Priority;
  dollarImpact: number | null;
  due: "today" | "tomorrow" | "this-week" | "waiting" | "someday";
  dueLabel: string;
  recommendedAction: string;
  status: "open" | "done" | "snoozed";
  revenueTied: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  customerId: string | null;
  customerName: string;
  value: number;
  confidence: "warm" | "hot" | "exploratory";
  note: string;
  nextAction: string;
}

export interface Risk {
  id: string;
  title: string;
  customerId: string | null;
  customerName: string;
  severity: "watch" | "elevated" | "critical";
  note: string;
  recommendedAction: string;
}

export interface RevenueStreamPoint {
  week: string;
  shopify: number;
  consulting: number;
  wholesale: number;
  digital: number;
  community: number;
}

export interface RevenueEvent {
  id: string;
  title: string;
  detail: string;
  amount: number;
  hoursAgo: number;
  channel: Channel;
  sentiment: Sentiment;
}

export interface VendorUpdate {
  id: string;
  vendor: string;
  message: string;
  waitingOn: WaitingOn;
  daysAgo: number;
}

export interface ContentReminder {
  id: string;
  title: string;
  channel: string;
  dueLabel: string;
  overdue: boolean;
}

export interface SupportIssue {
  id: string;
  customerId: string | null;
  customerName: string;
  issue: string;
  severity: "low" | "medium" | "high";
  hoursAgo: number;
}

export interface UpcomingMoment {
  id: string;
  title: string;
  detail: string;
  when: string;
  icon: "calendar" | "renewal" | "milestone" | "meeting";
}
