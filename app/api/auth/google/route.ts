import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

function getRedirectUri(request: NextRequest): string {
  // If GOOGLE_REDIRECT_URI is set and already includes the full path, use it as-is
  if (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.includes('/api/auth/google/callback')) {
    return process.env.GOOGLE_REDIRECT_URI
  }
  
  // Otherwise, construct it from base URL
  const baseUrl = process.env.GOOGLE_REDIRECT_URI || process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
  return `${baseUrl}/api/auth/google/callback`
}

export async function GET(request: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Missing Google OAuth credentials" },
      { status: 500 }
    )
  }

  const redirectUri = getRedirectUri(request)

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  )

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.readonly"],
    prompt: "consent",
  })

  return NextResponse.redirect(authUrl)
}
