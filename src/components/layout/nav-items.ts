import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  ShieldAlert,
  CalendarClock,
  ClipboardList,
  AlertOctagon,
  Upload,
  Gauge,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
}

/**
 * Only routes that actually exist are listed here — see
 * IMPLEMENTATION_PLAN.md Phase 5+ for Opportunity Center, Voice of Customer,
 * Integrations, Health Model Configuration, Organization Settings, and the
 * Audit Log, each of which gets added here as it ships. A nav item that
 * points to a page that doesn't exist yet is a broken link, and the founder's
 * brief explicitly prohibits those.
 */
export const navItems: NavItem[] = [
  {
    label: "Mission Control",
    shortLabel: "Mission Control",
    href: "/mission-control",
    icon: LayoutDashboard,
    description: "What changed, what's at risk, what to do next",
  },
  {
    label: "Customer Portfolio",
    shortLabel: "Customers",
    href: "/customers",
    icon: Building2,
    description: "Every customer account in one view",
  },
  {
    label: "Risk Radar",
    shortLabel: "Risks",
    href: "/risks",
    icon: ShieldAlert,
    description: "Open risk signals and the evidence behind them",
  },
  {
    label: "Renewal Center",
    shortLabel: "Renewals",
    href: "/renewals",
    icon: CalendarClock,
    description: "Upcoming renewals, forecasts, and preparation",
  },
  {
    label: "Actions",
    shortLabel: "Actions",
    href: "/actions",
    icon: ClipboardList,
    description: "What should happen next, and who owns it",
  },
  {
    label: "Escalations",
    shortLabel: "Escalations",
    href: "/escalations",
    icon: AlertOctagon,
    description: "Serious customer situations under active management",
  },
  {
    label: "Executive Briefs",
    shortLabel: "Briefs",
    href: "/executive-briefs",
    icon: FileText,
    description: "What leadership sees",
  },
  {
    label: "Data Imports",
    shortLabel: "Imports",
    href: "/imports",
    icon: Upload,
    description: "Bring customer data into Ground Control",
  },
  {
    label: "Data Quality",
    shortLabel: "Data Quality",
    href: "/data-quality",
    icon: Gauge,
    description: "What the data can and cannot support",
  },
  {
    label: "Team",
    shortLabel: "Team",
    href: "/organization/members",
    icon: Users,
    description: "Members, roles, and invitations",
  },
];

/**
 * The mobile bottom bar holds five destinations at most before the labels
 * become unreadable. Everything else stays one tap away in the mobile menu.
 */
const BOTTOM_NAV_HREFS = ["/mission-control", "/customers", "/risks", "/renewals", "/actions"];

export const bottomNavItems: NavItem[] = BOTTOM_NAV_HREFS.map(
  (href) => navItems.find((item) => item.href === href)!
);
