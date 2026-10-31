import { NextRequest, NextResponse } from "next/server"
import { ImageResponse } from "next/og"
import { isAuthorized } from "@/lib/trmnl/auth"
import { getCalendarDays, type CalendarDay, type DayEvent } from "@/lib/trmnl/calendar"
import { toTrmnlPng } from "@/lib/trmnl/png"
import { getWeather, type WeatherData } from "@/lib/weather"
import { ALL_WEATHER_ICONS, WeatherIcon } from "@/lib/trmnl/weather-icons"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// TRMNL OG panel
const WIDTH = 800
const HEIGHT = 480
const NUM_DAYS = 5

const HEADER_HEIGHT = 84
const COLUMN_HEADER_HEIGHT = 58
const EVENTS_HEIGHT = HEIGHT - HEADER_HEIGHT - COLUMN_HEADER_HEIGHT - 12
const ALL_DAY_ROW = 28
const TIMED_ROW = 42
const MORE_ROW = 22

/**
 * GET /api/trmnl/image?key=<TRMNL_KEY>[&bits=2]
 * Returns an 800x480 grayscale PNG for the TRMNL Alias plugin.
 * Add &demo=1 to preview the layout with sample events.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const bits = request.nextUrl.searchParams.get("bits") === "2" ? 2 : 1
  const demo = request.nextUrl.searchParams.get("demo") === "1"

  const [daysResult, weatherResult, fonts] = await Promise.all([
    (demo ? Promise.resolve(demoDays()) : getCalendarDays(NUM_DAYS)).then(
      (days) => ({ ok: true as const, days }),
      (error: Error) => {
        console.error("TRMNL: calendar error", error)
        return { ok: false as const, message: error.message }
      }
    ),
    getWeather(NUM_DAYS).catch((error) => {
      console.error("TRMNL: weather error", error)
      return null
    }),
    loadFonts(),
  ])

  if (demo && weatherResult) {
    // Cycle through icons so the whole set can be previewed
    weatherResult.current.icon = ALL_WEATHER_ICONS[new Date().getMinutes() % ALL_WEATHER_ICONS.length]
    const demoDayList = demoDays()
    weatherResult.forecast = demoDayList.map((d, i) => ({
      day: d.weekday,
      temp: 10 + i,
      high: 10 + i,
      low: 2 + i,
      condition: "partly-cloudy",
      icon: ALL_WEATHER_ICONS[(i + 1) % ALL_WEATHER_ICONS.length],
    }))
  }

  const image = new ImageResponse(
    <Screen days={daysResult.ok ? daysResult.days : null} error={daysResult.ok ? null : daysResult.message} weather={weatherResult} />,
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: fonts.length ? fonts : undefined,
    }
  )

  const png = toTrmnlPng(Buffer.from(await image.arrayBuffer()), WIDTH, HEIGHT, bits)

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(png.length),
      "Cache-Control": "no-store",
    },
  })
}

// ---------------------------------------------------------------------------
// Layout (Satori: flexbox only, every multi-child div needs display:flex)
// ---------------------------------------------------------------------------

function Screen({ days, error, weather }: { days: CalendarDay[] | null; error: string | null; weather: WeatherData | null }) {
  const now = new Date()
  const weekday = now.toLocaleDateString("en-US", { weekday: "long", timeZone: "America/Toronto" })
  const date = now.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "America/Toronto" })
  const updated = now
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" })
    .toLowerCase()
    .replace(" ", "")

  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        color: "#000",
        fontFamily: "Inter",
      }}
    >
      {/* Header: date + current weather */}
      <div
        style={{
          height: HEADER_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          borderBottom: "3px solid #000",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 20, lineHeight: 1.1 }}>{weekday}</div>
          <div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.1 }}>{date}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          {weather ? (
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", marginRight: 12 }}>
                <WeatherIcon icon={weather.current.icon} size={54} strokeWidth={2} />
              </div>
              <div style={{ fontSize: 50, fontWeight: 700, lineHeight: 1 }}>{`${weather.current.temp}°`}</div>
              <div style={{ display: "flex", flexDirection: "column", marginLeft: 12 }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{weather.current.description}</div>
                <div style={{ fontSize: 16 }}>{`H ${weather.current.high}° · L ${weather.current.low}°`}</div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 16 }}>Weather unavailable</div>
          )}
          <div style={{ display: "flex", fontSize: 12, marginLeft: 18, alignSelf: "flex-end", marginBottom: 4 }}>
            {updated}
          </div>
        </div>
      </div>

      {/* Body */}
      {days ? (
        <div style={{ flex: 1, display: "flex" }}>
          {days.map((day, i) => (
            <DayColumn key={day.key} day={day} weather={weather} last={i === days.length - 1} />
          ))}
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>Calendar unavailable</div>
          <div style={{ fontSize: 16, marginTop: 10, textAlign: "center" }}>{error}</div>
        </div>
      )}
    </div>
  )
}

function DayColumn({ day, weather, last }: { day: CalendarDay; weather: WeatherData | null; last: boolean }) {
  const forecast = weather?.forecast.find((f) => f.day === day.weekday)
  const { visible, hidden } = fitEvents(day.events)

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        borderRight: last ? "none" : "2px solid #000",
        minWidth: 0,
      }}
    >
      {/* Column header (inverted for today) */}
      <div
        style={{
          height: COLUMN_HEADER_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 10px",
          background: day.isToday ? "#000" : "#fff",
          color: day.isToday ? "#fff" : "#000",
          borderBottom: "2px solid #000",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>{day.weekday.toUpperCase()}</div>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{String(day.dayOfMonth)}</div>
        </div>
        {forecast && (
          <div style={{ display: "flex" }}>
            <WeatherIcon icon={forecast.icon} size={30} color={day.isToday ? "#fff" : "#000"} strokeWidth={2.25} />
          </div>
        )}
        {forecast && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: 14 }}>
            <div style={{ fontWeight: 700 }}>{`${forecast.high}°`}</div>
            <div>{`${forecast.low}°`}</div>
          </div>
        )}
      </div>

      {/* Events */}
      <div style={{ display: "flex", flexDirection: "column", padding: "6px 8px 0" }}>
        {day.events.length === 0 && <div style={{ fontSize: 14, marginTop: 6 }}>—</div>}
        {visible.map((event, i) => (
          <EventRow key={i} event={event} />
        ))}
        {hidden > 0 && <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{`+${hidden} more`}</div>}
      </div>
    </div>
  )
}

function EventRow({ event }: { event: DayEvent }) {
  const ellipsis = { overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" } as const

  if (event.allDay) {
    return (
      <div
        style={{
          display: "flex",
          height: ALL_DAY_ROW - 4,
          marginBottom: 4,
          padding: "0 6px",
          alignItems: "center",
          background: "#000",
          color: "#fff",
          borderRadius: 4,
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        <div style={{ ...ellipsis, display: "flex", width: "100%" }}>{event.title}</div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: TIMED_ROW, paddingLeft: 6, borderLeft: "3px solid #000", marginBottom: 2 }}>
      <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{event.time}</div>
      <div style={{ ...ellipsis, display: "flex", fontSize: 15, lineHeight: 1.3 }}>{event.title}</div>
    </div>
  )
}

function demoDays(): CalendarDay[] {
  const samples: DayEvent[][] = [
    [
      { title: "Halloween", time: null, allDay: true },
      { title: "School drop-off", time: "8:15a", allDay: false },
      { title: "Dentist — Dr. Patel", time: "10:30a", allDay: false },
      { title: "Trick-or-treating with the kids", time: "6p", allDay: false },
    ],
    [{ title: "Soccer practice", time: "9a", allDay: false }, { title: "Brunch at Mom's", time: "11:30a", allDay: false }],
    [],
    Array.from({ length: 11 }, (_, i) => ({ title: `Meeting ${i + 1}`, time: [9, 10, 11].includes(9 + i) ? `${9 + i}a` : `${((8 + i) % 12) + 1}p`, allDay: false })),
    [
      { title: "Family vacation", time: null, allDay: true },
      { title: "Flight AC 123 to Vancouver", time: "7:05a", allDay: false },
    ],
  ]
  const today = new Date()
  return samples.map((events, i) => {
    const d = new Date(today.getTime() + i * 86400000)
    return {
      key: String(i),
      weekday: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/Toronto" }),
      dayOfMonth: Number(d.toLocaleDateString("en-US", { day: "numeric", timeZone: "America/Toronto" })),
      month: d.toLocaleDateString("en-US", { month: "short", timeZone: "America/Toronto" }),
      isToday: i === 0,
      events,
    }
  })
}

/** Decide how many events fit in a column; the rest become "+N more". */
function fitEvents(events: DayEvent[]): { visible: DayEvent[]; hidden: number } {
  const height = (e: DayEvent) => (e.allDay ? ALL_DAY_ROW : TIMED_ROW + 2)
  let used = 0
  const visible: DayEvent[] = []
  for (let i = 0; i < events.length; i++) {
    const remainingAfter = events.length - i - 1
    const needed = height(events[i]) + (remainingAfter > 0 ? MORE_ROW : 0)
    if (used + needed > EVENTS_HEIGHT) break
    used += height(events[i])
    visible.push(events[i])
  }
  return { visible, hidden: events.length - visible.length }
}

// ---------------------------------------------------------------------------
// Fonts: Inter from Google Fonts (cached per server instance). Falls back to
// next/og's built-in font if the fetch fails.
// ---------------------------------------------------------------------------

type Font = { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }
let fontCache: Promise<Font[]> | null = null

function loadFonts(): Promise<Font[]> {
  fontCache ??= Promise.all(
    ([400, 700] as const).map(async (weight) => {
      // No browser User-Agent => Google serves TTF, which Satori can read
      const css = await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`).then((r) => r.text())
      const url = css.match(/src: url\((.+?)\)/)?.[1]
      if (!url) throw new Error("Font URL not found")
      const data = await fetch(url).then((r) => r.arrayBuffer())
      return { name: "Inter", data, weight, style: "normal" as const }
    })
  ).catch((error) => {
    console.error("TRMNL: font load failed, using default font", error)
    fontCache = null // retry next request
    return []
  })
  return fontCache
}
