import { google } from "googleapis"

const TZ = "America/Toronto"

export interface DayEvent {
  title: string
  /** e.g. "9:30a"; null for all-day events */
  time: string | null
  allDay: boolean
}

export interface CalendarDay {
  /** YYYY-MM-DD in Toronto time */
  key: string
  weekday: string // "Sat"
  dayOfMonth: number
  month: string // "Oct"
  isToday: boolean
  events: DayEvent[]
}

/** YYYY-MM-DD for an instant, in Toronto time. */
export function torontoDateKey(date: Date): string {
  // en-CA formats as YYYY-MM-DD
  return date.toLocaleDateString("en-CA", { timeZone: TZ })
}

/** Add days to a YYYY-MM-DD key (calendar arithmetic, DST-safe). */
function addDays(key: string, days: number): string {
  const d = new Date(`${key}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatShortTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date)
  const hour = parts.find((p) => p.type === "hour")?.value ?? ""
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00"
  const period = (parts.find((p) => p.type === "dayPeriod")?.value ?? "").toLowerCase().charAt(0)
  return minute === "00" ? `${hour}${period}` : `${hour}:${minute}${period}`
}

function getAuthClient() {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  if (!refreshToken) {
    throw new Error("GOOGLE_REFRESH_TOKEN is not set (visit /api/trmnl/setup to get one)")
  }
  const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
  client.setCredentials({ refresh_token: refreshToken })
  return client
}

/**
 * Calendars to show: TRMNL_CALENDAR_IDS (comma-separated) if set, otherwise
 * every calendar that is checked in Google Calendar (plus primary).
 */
async function getCalendarIds(calendar: ReturnType<typeof google.calendar>): Promise<string[]> {
  const fromEnv = process.env.TRMNL_CALENDAR_IDS?.split(",").map((s) => s.trim()).filter(Boolean)
  if (fromEnv?.length) return fromEnv

  const list = await calendar.calendarList.list({ minAccessRole: "reader" })
  const ids = (list.data.items || []).filter((c) => c.selected || c.primary).map((c) => c.id!)
  return ids.length ? ids : ["primary"]
}

/** Fetch events for `numDays` days starting today (Toronto), grouped by day. */
export async function getCalendarDays(numDays: number): Promise<CalendarDay[]> {
  const calendar = google.calendar({ version: "v3", auth: getAuthClient() })
  const now = new Date()
  const todayKey = torontoDateKey(now)

  const days: CalendarDay[] = Array.from({ length: numDays }, (_, i) => {
    const key = addDays(todayKey, i)
    const noonUtc = new Date(`${key}T12:00:00Z`)
    return {
      key,
      weekday: noonUtc.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      dayOfMonth: noonUtc.getUTCDate(),
      month: noonUtc.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      isToday: i === 0,
      events: [],
    }
  })
  const byKey = new Map(days.map((d) => [d.key, d]))
  const lastKey = days[days.length - 1].key

  // Query a slightly wider UTC window, then bucket precisely by Toronto date.
  const timeMin = new Date(`${todayKey}T00:00:00Z`)
  timeMin.setUTCDate(timeMin.getUTCDate() - 1)
  const timeMax = new Date(`${addDays(lastKey, 2)}T00:00:00Z`)

  const calendarIds = await getCalendarIds(calendar)
  const results = await Promise.all(
    calendarIds.map(async (calendarId) => {
      try {
        const res = await calendar.events.list({
          calendarId,
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          maxResults: 100,
          singleEvents: true,
          orderBy: "startTime",
        })
        return res.data.items || []
      } catch (error) {
        console.error(`TRMNL: failed to fetch calendar ${calendarId}:`, error)
        return []
      }
    })
  )

  const seen = new Set<string>()
  const timed: { day: CalendarDay; start: number; event: DayEvent }[] = []

  for (const event of results.flat()) {
    if (event.status === "cancelled") continue
    // Same event can appear in multiple calendars (e.g. shared invites)
    const dedupeKey = `${event.iCalUID ?? event.id}|${event.start?.dateTime ?? event.start?.date}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    const title = event.summary || "(No title)"

    if (event.start?.date) {
      // All-day: show on every day it spans (end date is exclusive)
      const end = event.end?.date ?? addDays(event.start.date, 1)
      for (let k = event.start.date; k < end && k <= lastKey; k = addDays(k, 1)) {
        byKey.get(k)?.events.push({ title, time: null, allDay: true })
      }
    } else if (event.start?.dateTime) {
      const start = new Date(event.start.dateTime)
      const day = byKey.get(torontoDateKey(start))
      if (day) {
        timed.push({ day, start: start.getTime(), event: { title, time: formatShortTime(start), allDay: false } })
      }
    }
  }

  // All-day events first (already pushed), then timed events in start order
  timed.sort((a, b) => a.start - b.start)
  for (const t of timed) t.day.events.push(t.event)

  return days
}
