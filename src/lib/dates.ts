const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * MS_PER_DAY);
}

/**
 * Whole days between now and `date`, rounded up. Negative when the date has
 * passed. Kept here rather than inline in a component because reading the
 * clock during render is impure.
 */
export function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / MS_PER_DAY);
}
