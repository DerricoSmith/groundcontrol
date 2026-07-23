import {
  ShoppingBag,
  BriefcaseBusiness,
  Truck,
  Sparkles,
  UsersRound,
  Handshake,
  Smile,
  Meh,
  Frown,
  MessageCircleMore,
  CircleDollarSign,
  PackageSearch,
  Megaphone,
  ListChecks,
  Video,
  RotateCcw,
  Clock,
  type LucideIcon,
} from "lucide-react";
import type { Channel, Sentiment, LoopType } from "@/lib/types";

export const channelIcon: Record<Channel, LucideIcon> = {
  shopify: ShoppingBag,
  consulting: BriefcaseBusiness,
  wholesale: Truck,
  digital: Sparkles,
  community: UsersRound,
  vendor: Truck,
  partnership: Handshake,
};

export const channelLabel: Record<Channel, string> = {
  shopify: "Shopify",
  consulting: "Consulting",
  wholesale: "Wholesale",
  digital: "Digital product",
  community: "Community",
  vendor: "Vendor",
  partnership: "Partnership",
};

export const sentimentIcon: Record<Sentiment, LucideIcon> = {
  positive: Smile,
  neutral: Meh,
  negative: Frown,
};

export const loopTypeIcon: Record<LoopType, LucideIcon> = {
  "customer-reply": MessageCircleMore,
  "invoice-follow-up": CircleDollarSign,
  "vendor-waiting": Truck,
  "shipment-issue": PackageSearch,
  "proposal-follow-up": Handshake,
  "content-overdue": Megaphone,
  "product-task": ListChecks,
  "meeting-follow-up": Video,
  "refund-review": RotateCcw,
  "personal-reminder": Clock,
};
