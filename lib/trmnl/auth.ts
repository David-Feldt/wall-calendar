import { timingSafeEqual } from "crypto"
import type { NextRequest } from "next/server"

/**
 * TRMNL endpoints are public URLs (the device fetches them directly and can't
 * send custom headers), so they're protected by a shared secret in `?key=`.
 */
export function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.TRMNL_KEY
  const given = request.nextUrl.searchParams.get("key")
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
