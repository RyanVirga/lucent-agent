// Date Utilities for Pacific Timezone
// All date calculations use America/Los_Angeles timezone for consistency

/**
 * Get today's date in Pacific timezone as a date string (YYYY-MM-DD)
 */
export function getTodayInPacific(): string {
  const now = new Date()
  // Convert to Pacific timezone
  const pacificDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
  return pacificDate.toISOString().split('T')[0]
}

/**
 * Get current date/time in Pacific timezone
 */
export function getNowInPacific(): Date {
  const now = new Date()
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
}

/**
 * Calculate days until a future date from a reference date
 * Positive number means future, negative means past
 * @param futureDate - Target date (YYYY-MM-DD or ISO string)
 * @param fromDate - Reference date (defaults to today in Pacific)
 * @returns Number of days until future date (negative if in past)
 */
export function daysUntil(futureDate: string | null | undefined, fromDate?: string): number {
  if (!futureDate) return Infinity
  
  const from = fromDate ? parseDate(fromDate) : parseDate(getTodayInPacific())
  const to = parseDate(futureDate)
  
  const diffTime = to.getTime() - from.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Calculate days since a past date from a reference date
 * Always returns a positive number
 * @param pastDate - Date in the past (YYYY-MM-DD or ISO string)
 * @param fromDate - Reference date (defaults to today in Pacific)
 * @returns Number of days since past date
 */
export function daysSince(pastDate: string | null | undefined, fromDate?: string): number {
  if (!pastDate) return 0
  
  const from = fromDate ? parseDate(fromDate) : parseDate(getTodayInPacific())
  const past = parseDate(pastDate)
  
  const diffTime = from.getTime() - past.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

/**
 * Calculate absolute difference in days between two dates
 * @param date1 - First date (YYYY-MM-DD or ISO string)
 * @param date2 - Second date (YYYY-MM-DD or ISO string)
 * @returns Absolute number of days between dates
 */
export function differenceInDays(date1: string, date2: string): number {
  const d1 = parseDate(date1)
  const d2 = parseDate(date2)
  
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Check if two dates are the same day
 * @param date1 - First date (YYYY-MM-DD or ISO string)
 * @param date2 - Second date (YYYY-MM-DD or ISO string)
 * @returns True if dates are the same day
 */
export function isSameDay(date1: string, date2: string): boolean {
  const d1 = parseDate(date1)
  const d2 = parseDate(date2)
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

/**
 * Check if a date is in the past
 * @param date - Date to check (YYYY-MM-DD or ISO string)
 * @returns True if date is before today
 */
export function isPast(date: string | null | undefined): boolean {
  if (!date) return false
  const today = getTodayInPacific()
  return daysUntil(date, today) < 0
}

/**
 * Check if a date is in the future
 * @param date - Date to check (YYYY-MM-DD or ISO string)
 * @returns True if date is after today
 */
export function isFuture(date: string | null | undefined): boolean {
  if (!date) return false
  const today = getTodayInPacific()
  return daysUntil(date, today) > 0
}

/**
 * Check if a date is today
 * @param date - Date to check (YYYY-MM-DD or ISO string)
 * @returns True if date is today
 */
export function isToday(date: string | null | undefined): boolean {
  if (!date) return false
  const today = getTodayInPacific()
  return isSameDay(date, today)
}

/**
 * Add days to a date
 * @param date - Starting date (YYYY-MM-DD or ISO string)
 * @param days - Number of days to add (can be negative)
 * @returns New date string (YYYY-MM-DD)
 */
export function addDays(date: string, days: number): string {
  const d = parseDate(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

/**
 * Format a date string for display
 * @param date - Date to format (YYYY-MM-DD or ISO string)
 * @returns Formatted date string (e.g., "Nov 24, 2024")
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return 'TBD'
  try {
    const d = parseDate(date)
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  } catch {
    return 'TBD'
  }
}

/**
 * Parse a date string into a Date object
 * Handles both YYYY-MM-DD and ISO datetime strings
 * Always treats YYYY-MM-DD as start of day in Pacific timezone
 */
function parseDate(dateString: string): Date {
  // If it's just a date (YYYY-MM-DD), treat as midnight Pacific time
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day, 0, 0, 0, 0)
  }
  
  // Otherwise parse as ISO datetime
  return new Date(dateString)
}

