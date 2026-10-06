// The viewer's chosen time zone, stored in a cookie so server-rendered dates match it.
// Only zones in this list are accepted, so a hand-edited cookie can't break date formatting.

export const TZ_COOKIE = "gc-tz";
export const DEFAULT_TZ = "America/New_York";

export const TIMEZONES = [
  { id: "America/New_York", label: "Eastern", short: "ET" },
  { id: "America/Chicago", label: "Central", short: "CT" },
  { id: "America/Denver", label: "Mountain", short: "MT" },
  { id: "America/Phoenix", label: "Arizona", short: "MST" },
  { id: "America/Los_Angeles", label: "Pacific", short: "PT" },
  { id: "America/Anchorage", label: "Alaska", short: "AKT" },
  { id: "Pacific/Honolulu", label: "Hawaii", short: "HT" },
  { id: "UTC", label: "UTC", short: "UTC" },
  { id: "Europe/London", label: "London", short: "UK" },
  { id: "Asia/Tokyo", label: "Tokyo", short: "JST" },
] as const;

export type TimeZoneId = (typeof TIMEZONES)[number]["id"];

export function resolveTimeZone(value: string | null | undefined): TimeZoneId {
  return TIMEZONES.find((t) => t.id === value)?.id ?? DEFAULT_TZ;
}

export function timeZoneInfo(id: TimeZoneId) {
  return TIMEZONES.find((t) => t.id === id) ?? TIMEZONES[0];
}

/** "Tuesday, October 6" for `date` as seen in `timeZone`. */
export function formatDateLabel(date: Date, timeZone: TimeZoneId) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone }).format(date);
}
