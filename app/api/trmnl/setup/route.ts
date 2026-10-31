import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { isAuthorized } from "@/lib/trmnl/auth"

export const dynamic = "force-dynamic"

/**
 * GET /api/trmnl/setup?key=<TRMNL_KEY>
 *
 * One-time helper: after signing in to the wall calendar in this browser,
 * shows the Google refresh token (to store as GOOGLE_REFRESH_TOKEN) and your
 * calendar IDs (optionally store a comma-separated subset as TRMNL_CALENDAR_IDS).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized — set TRMNL_KEY and pass it as ?key=" }, { status: 401 })
  }

  const refreshToken = request.cookies.get("google_refresh_token")?.value
  if (!refreshToken) {
    return NextResponse.json(
      {
        error: "No refresh token cookie. Sign out of the wall calendar, sign back in with Google, then reload this page.",
      },
      { status: 400 }
    )
  }

  const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
  client.setCredentials({ refresh_token: refreshToken })
  const list = await google.calendar({ version: "v3", auth: client }).calendarList.list({ minAccessRole: "reader" })

  return NextResponse.json(
    {
      GOOGLE_REFRESH_TOKEN: refreshToken,
      calendars: (list.data.items || []).map((c) => ({
        id: c.id,
        name: c.summary,
        shownByDefault: Boolean(c.selected || c.primary),
      })),
      note: "Calendars marked shownByDefault are used unless TRMNL_CALENDAR_IDS is set.",
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
