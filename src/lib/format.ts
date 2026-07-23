export function formatCurrency(value: number, opts?: { compact?: boolean }) {
  if (opts?.compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRelativeHours(hoursAgo: number) {
  if (hoursAgo < 1) return "just now";
  if (hoursAgo < 24) return `${Math.round(hoursAgo)}h ago`;
  const days = Math.round(hoursAgo / 24);
  return `${days}d ago`;
}

export function formatRelativeDays(daysAgo: number | null) {
  if (daysAgo === null) return "—";
  if (daysAgo === 0) return "today";
  if (daysAgo === 1) return "yesterday";
  return `${daysAgo}d ago`;
}

export function formatDueLabel(dueInDays: number) {
  if (dueInDays < 0) return `${Math.abs(dueInDays)}d overdue`;
  if (dueInDays === 0) return "due today";
  return `due in ${dueInDays}d`;
}
