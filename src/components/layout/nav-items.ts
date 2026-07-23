import { Sunrise, Radar, WalletCards, ListChecks, Command, BookOpenText, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
}

export const navItems: NavItem[] = [
  {
    label: "Morning Brief",
    shortLabel: "Brief",
    href: "/morning-brief",
    icon: Sunrise,
    description: "What changed overnight",
  },
  {
    label: "Customer Radar",
    shortLabel: "Radar",
    href: "/customer-radar",
    icon: Radar,
    description: "People who need attention",
    badge: "7",
  },
  {
    label: "Money Watch",
    shortLabel: "Money",
    href: "/money-watch",
    icon: WalletCards,
    description: "Where the money is stuck",
    badge: "3",
  },
  {
    label: "Open Loops",
    shortLabel: "Loops",
    href: "/open-loops",
    icon: ListChecks,
    description: "Unfinished business",
    badge: "14",
  },
  {
    label: "Command Center",
    shortLabel: "Ask",
    href: "/command-center",
    icon: Command,
    description: "Ask your business anything",
  },
  {
    label: "Case Study",
    shortLabel: "Story",
    href: "/case-study",
    icon: BookOpenText,
    description: "How Ground Control was built",
  },
];

export const primaryMobileNav = navItems.filter((n) => n.href !== "/case-study");
