/**
 * Timezone utilities for Toronto, Canada
 * Uses America/Toronto timezone (handles EST/EDT automatically)
 */

const TORONTO_TIMEZONE = "America/Toronto"

/**
 * Get current date/time in Toronto timezone
 */
export function getTorontoTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TORONTO_TIMEZONE }))
}

/**
 * Convert a date to Toronto timezone
 */
export function toTorontoTime(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: TORONTO_TIMEZONE }))
}

/**
 * Format time in Toronto timezone
 */
export function formatTorontoTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    timeZone: TORONTO_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

/**
 * Format date in Toronto timezone
 */
export function formatTorontoDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString("en-US", {
    timeZone: TORONTO_TIMEZONE,
    ...options,
  })
}

/**
 * Get start of day in Toronto timezone
 */
export function getStartOfDayToronto(date: Date = new Date()): Date {
  const torontoDate = toTorontoTime(date)
  const startOfDay = new Date(torontoDate)
  startOfDay.setHours(0, 0, 0, 0)
  return startOfDay
}

/**
 * Check if a date is today in Toronto timezone
 */
export function isTodayToronto(date: Date): boolean {
  const today = getStartOfDayToronto()
  const checkDate = getStartOfDayToronto(date)
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  )
}
