import { NextResponse } from "next/server"
import { getWeather } from "@/lib/weather"

export async function GET() {
  try {
    return NextResponse.json(await getWeather())
  } catch (error: any) {
    console.error("Error fetching weather:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch weather data" },
      { status: 500 }
    )
  }
}
