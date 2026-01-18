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

  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client })
    
    const response = await calendar.calendarList.list({
      minAccessRole: "reader",
    })

    const calendars = (response.data.items || []).map((cal) => ({
      id: cal.id,
      summary: cal.summary || cal.id,
      backgroundColor: cal.backgroundColor,
      foregroundColor: cal.foregroundColor,
      selected: cal.selected !== false, // Default to selected
      primary: cal.primary === true,
    }))

    return NextResponse.json({ calendars })
  } catch (error: any) {
    console.error("Error fetching calendars:", error)
    
    if (error.code === 401) {
      return NextResponse.json({ error: "Authentication expired" }, { status: 401 })
    }
    
    return NextResponse.json({ error: "Failed to fetch calendars" }, { status: 500 })
  }
}
