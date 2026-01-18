"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CalendarSettings, getSelectedCalendarIds } from "@/components/calendar-settings"
import { getTorontoTime, getStartOfDayToronto, isTodayToronto, formatTorontoDate, formatTorontoTime } from "@/lib/timezone"

interface CalendarEvent {
  id: string
  title: string
  time: string
  backgroundColor: string
  foregroundColor: string
  day: number
}

interface GoogleCalendarEvent {
  id: string
  summary: string
  start: {
    dateTime?: string
    date?: string
  }
  backgroundColor?: string
  foregroundColor?: string
  colorId?: string
}

export function WeeklyCalendar() {
  const [currentStart, setCurrentStart] = useState(() => {
    return getStartOfDayToronto()
  })

  const [today, setToday] = useState(getTorontoTime())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setToday(getTorontoTime()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [currentStart])

  const handleCalendarsChange = () => {
    fetchEvents()
  }

  const fetchEvents = async () => {
    setIsLoading(true)
    const forecastEnd = new Date(currentStart)
    forecastEnd.setDate(forecastEnd.getDate() + 10)
    forecastEnd.setHours(23, 59, 59, 999)

    const timeMin = currentStart.toISOString()
    const timeMax = forecastEnd.toISOString()

    // Get selected calendar IDs from localStorage
    const selectedCalendarIds = getSelectedCalendarIds()
    const calendarIdsParam = selectedCalendarIds.map(id => encodeURIComponent(id)).join(",")

    try {
      const response = await fetch(`/api/calendar/events?timeMin=${timeMin}&timeMax=${timeMax}&calendarIds=${calendarIdsParam}`)
      
      if (response.status === 401) {
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch events")
      }

      const data = await response.json()
      setIsAuthenticated(true)
      mapGoogleEventsToCalendarEvents(data.events || [])
    } catch (error) {
      console.error("Error fetching events:", error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const mapGoogleEventsToCalendarEvents = (googleEvents: GoogleCalendarEvent[]) => {
    const mappedEvents: CalendarEvent[] = []

    googleEvents.forEach((event) => {
      const startDate = event.start.dateTime 
        ? new Date(event.start.dateTime) 
        : new Date(event.start.date || "")
      
      // Normalize dates to midnight for accurate day calculation
      const eventDay = new Date(startDate)
      eventDay.setHours(0, 0, 0, 0)
      const startNormalized = new Date(currentStart)
      startNormalized.setHours(0, 0, 0, 0)
      
      const dayIndex = Math.floor((eventDay.getTime() - startNormalized.getTime()) / (1000 * 60 * 60 * 24))
      
      if (dayIndex >= 0 && dayIndex < 10) {
        const timeStr = event.start.dateTime
          ? formatTorontoTime(startDate)
          : "All day"

        // Use actual calendar colors, fallback to defaults
        const backgroundColor = event.backgroundColor || "#4285F4"
        const foregroundColor = event.foregroundColor || "#FFFFFF"

        mappedEvents.push({
          id: event.id,
          title: event.summary || "No title",
          time: timeStr,
          backgroundColor,
          foregroundColor,
          day: dayIndex,
        })
      }
    })

    setEvents(mappedEvents)
  }

  const forecastDays = Array.from({ length: 10 }, (_, i) => {
    const date = new Date(currentStart)
    date.setDate(date.getDate() + i)
    // Ensure we're working with Toronto timezone dates
    return new Date(date.toLocaleString("en-US", { timeZone: "America/Toronto" }))
  })

  const navigateForecast = (direction: "prev" | "next") => {
    const newStart = new Date(currentStart)
    newStart.setDate(newStart.getDate() + (direction === "next" ? 10 : -10))
    setCurrentStart(newStart)
  }

  const goToToday = () => {
    setCurrentStart(getStartOfDayToronto())
  }

  const handleLogin = () => {
    window.location.href = "/api/auth/google"
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setIsAuthenticated(false)
    setEvents([])
  }

  const isToday = (date: Date) => {
    return isTodayToronto(date)
  }

  const getEventsForDay = (dayIndex: number) => {
    return events.filter((event) => event.day === dayIndex)
  }

  const formatMonthYear = () => {
    const firstDay = forecastDays[0]
    const lastDay = forecastDays[9]

    if (firstDay.getMonth() === lastDay.getMonth()) {
      return formatTorontoDate(firstDay, { month: "long", year: "numeric" })
    }

    return `${formatTorontoDate(firstDay, { month: "short" })} - ${formatTorontoDate(lastDay, { month: "short", year: "numeric" })}`
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-normal text-foreground mb-4">Connect Google Calendar</h2>
          <p className="text-muted-foreground mb-6">Sign in to view your calendar events</p>
          <Button
            onClick={handleLogin}
            className="bg-[#4285F4] hover:bg-[#4285F4]/90 text-white"
          >
            Sign in with Google
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 md:p-8">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-normal text-foreground">{formatMonthYear()}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="rounded-full border-[#4285F4] text-[#4285F4] hover:bg-[#4285F4]/10 bg-transparent"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="rounded-full text-muted-foreground hover:bg-muted"
          >
            Sign out
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <CalendarSettings onCalendarsChange={handleCalendarsChange} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateForecast("prev")}
            className="rounded-full hover:bg-muted"
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateForecast("next")}
            className="rounded-full hover:bg-muted"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      {/* 10-day forecast grid: 5 columns x 2 rows */}
      <div className="grid grid-cols-5 gap-2">
        {forecastDays.map((date, index) => {
          const dayEvents = getEventsForDay(index)
          const isTodayDate = isToday(date)

          return (
            <div
              key={index}
              className={`flex flex-col rounded-xl p-2 min-h-[200px] transition-all ${
                isTodayDate ? "bg-[#4285F4]/5 ring-2 ring-[#4285F4]" : "bg-card hover:bg-muted/50"
              }`}
            >
              {/* Day header - compact */}
              <div className="text-center mb-2">
                <p
                  className={`text-[10px] font-medium uppercase tracking-wider ${
                    isTodayDate ? "text-[#4285F4]" : "text-muted-foreground"
                  }`}
                >
                  {formatTorontoDate(date, { weekday: "short" })}
                </p>
                <p
                  className={`text-lg font-light mt-0.5 ${
                    isTodayDate
                      ? "bg-[#4285F4] text-white w-7 h-7 rounded-full flex items-center justify-center mx-auto text-sm"
                      : "text-foreground"
                  }`}
                >
                  {date.getDate()}
                </p>
              </div>

              {/* Events - compact */}
              <div className="flex-1 space-y-1 overflow-y-auto">
                {isLoading ? (
                  <p className="text-[10px] text-muted-foreground text-center py-2">Loading...</p>
                ) : dayEvents.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-2">No events</p>
                ) : (
                  dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-1.5 rounded text-[10px] leading-tight"
                      style={{
                        backgroundColor: event.backgroundColor,
                        color: event.foregroundColor,
                      }}
                    >
                      <p className="font-medium truncate">{event.title}</p>
                      <p className="opacity-80 text-[9px]">{event.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Google branding footer */}
      <div className="flex items-center justify-center gap-2 mt-8 opacity-50">
        <div className="flex gap-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC04]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
        </div>
        <span className="text-xs text-muted-foreground">Powered by David</span>
      </div>
    </div>
  )
}
