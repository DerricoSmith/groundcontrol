import { cn } from "@/lib/utils";
import type { CustomerStatus, Priority, InvoiceStatus } from "@/lib/types";

const toneClasses = {
  brand: "bg-brand-soft text-brand",
  positive: "bg-positive-soft text-positive",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-accent-blue",
  neutral: "bg-secondary text-text-secondary",
} as const;

type Tone = keyof typeof toneClasses;

function Pill({ tone, children, dot = true }: { tone: Tone; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium", toneClasses[tone])}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const statusTone: Record<CustomerStatus, Tone> = {
  "Needs personal touch": "warning",
  "Overdue payment": "danger",
  "Ready for follow-up": "brand",
  "Order issue": "danger",
  "Warm lead": "positive",
  "Quiet VIP": "info",
  "Needs reply": "warning",
  "Quiet but valuable": "info",
  "On track": "positive",
};

export function StatusBadge({ status }: { status: CustomerStatus }) {
  return <Pill tone={statusTone[status]}>{status}</Pill>;
}

const priorityTone: Record<Priority, Tone> = {
  urgent: "danger",
  high: "warning",
  normal: "neutral",
  low: "neutral",
};

const priorityLabel: Record<Priority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Pill tone={priorityTone[priority]}>{priorityLabel[priority]}</Pill>;
}

const invoiceTone: Record<InvoiceStatus, Tone> = {
  paid: "positive",
  sent: "info",
  overdue: "danger",
  draft: "neutral",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Pill tone={invoiceTone[status]} dot={false}>
      <span className="capitalize">{status}</span>
    </Pill>
  );
}

export function ChipBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return <Pill tone={tone}>{label}</Pill>;
}
