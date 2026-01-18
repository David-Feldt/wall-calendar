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
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  const baseUrl = request.nextUrl.origin

  if (error) {
    return NextResponse.redirect(`${baseUrl}/?error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?error=no_code`)
  }

  const redirectUri = getRedirectUri(request)

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("Missing Google OAuth credentials")
    return NextResponse.redirect(`${baseUrl}/?error=missing_credentials`)
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  )

  try {
    const { tokens } = await oauth2Client.getToken(code)
    
    const response = NextResponse.redirect(`${baseUrl}/`)
    response.cookies.set("google_access_token", tokens.access_token || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    
    if (tokens.refresh_token) {
      response.cookies.set("google_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
    }

    return response
  } catch (error: any) {
    console.error("Error getting token:", error)
    
    // More specific error handling
    if (error.message?.includes("invalid_client")) {
      console.error("Invalid client credentials. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET")
      console.error("Redirect URI configured:", redirectUri)
      return NextResponse.redirect(`${baseUrl}/?error=invalid_client`)
    }
    
    return NextResponse.redirect(`${baseUrl}/?error=auth_failed`)
  }
}
