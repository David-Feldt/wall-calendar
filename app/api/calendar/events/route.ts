import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/google/callback`
)

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("google_access_token")?.value
  const refreshToken = request.cookies.get("google_refresh_token")?.value

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  const searchParams = request.nextUrl.searchParams
  const timeMin = searchParams.get("timeMin")
  const timeMax = searchParams.get("timeMax")
  const calendarIdsParam = searchParams.get("calendarIds")

  if (!timeMin || !timeMax) {
    return NextResponse.json({ error: "timeMin and timeMax are required" }, { status: 400 })
  }

  // Parse calendar IDs from query param (comma-separated) or default to primary
  const calendarIds = calendarIdsParam 
    ? calendarIdsParam.split(",").filter(Boolean)
    : ["primary"]

  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client })
    
    // First, get calendar colors for all selected calendars
    const calendarListResponse = await calendar.calendarList.list({
      minAccessRole: "reader",
    })
    const calendarMap = new Map()
    ;(calendarListResponse.data.items || []).forEach((cal) => {
      calendarMap.set(cal.id, {
        backgroundColor: cal.backgroundColor || "#4285F4",
        foregroundColor: cal.foregroundColor || "#FFFFFF",
      })
    })

    // Fetch events from all selected calendars in parallel
    const eventPromises = calendarIds.map(async (calendarId) => {
      try {
        const decodedId = decodeURIComponent(calendarId)
        const response = await calendar.events.list({
          calendarId: decodedId,
          timeMin,
          timeMax,
          maxResults: 50,
          singleEvents: true,
          orderBy: "startTime",
        })
        const calendarInfo = calendarMap.get(decodedId) || {
          backgroundColor: "#4285F4",
          foregroundColor: "#FFFFFF",
        }
        // Add calendar metadata to each event
        return (response.data.items || []).map((event) => ({
          ...event,
          calendarId: decodedId,
          backgroundColor: event.colorId 
            ? getColorFromColorId(String(event.colorId)) 
            : calendarInfo.backgroundColor,
          foregroundColor: calendarInfo.foregroundColor,
        }))
      } catch (error: any) {
        console.error(`Error fetching events from calendar ${calendarId}:`, error)
        return []
      }
    })

    const eventArrays = await Promise.all(eventPromises)
    const allEvents = eventArrays.flat()

    // Sort all events by start time
    allEvents.sort((a, b) => {
      const aTime = a.start?.dateTime || a.start?.date || ""
      const bTime = b.start?.dateTime || b.start?.date || ""
      return aTime.localeCompare(bTime)
    })

    return NextResponse.json({ events: allEvents })
  } catch (error: any) {
    console.error("Error fetching events:", error)
    
    if (error.code === 401) {
      return NextResponse.json({ error: "Authentication expired" }, { status: 401 })
    }
    
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

// Google Calendar colorId to hex color mapping
function getColorFromColorId(colorId: string): string {
  const colorMap: Record<string, string> = {
    "1": "#A4BDFC", // Lavender
    "2": "#7AE7BF", // Sage
    "3": "#DBADFF", // Grape
    "4": "#FF887C", // Flamingo
    "5": "#FBD75B", // Banana
    "6": "#FFB878", // Tangerine
    "7": "#46D6DB", // Peacock
    "8": "#E1E1E1", // Graphite
    "9": "#5484ED", // Blueberry
    "10": "#51B749", // Basil
    "11": "#DC2127", // Tomato
  }
  return colorMap[colorId] || "#4285F4" // Default to Google blue
}
