import { NextResponse } from "next/server"

const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY
const LOCATION = "Thornhill,ON,CA"
const LAT = "43.65"
const LON = "-79.38"

export async function GET() {
  if (!WEATHER_API_KEY) {
    return NextResponse.json(
      { error: "Weather API key not configured" },
      { status: 500 }
    )
  }

  try {
    // Fetch current weather
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=metric&appid=${WEATHER_API_KEY}`
    )

    if (!currentResponse.ok) {
      throw new Error("Failed to fetch current weather")
    }

    const currentData = await currentResponse.json()

    // Fetch 5-day forecast
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&appid=${WEATHER_API_KEY}`
    )

    if (!forecastResponse.ok) {
      throw new Error("Failed to fetch forecast")
    }

    const forecastData = await forecastResponse.json()

    // Map OpenWeatherMap condition codes to our condition types
    const mapCondition = (code: number): "sunny" | "cloudy" | "rainy" | "partly-cloudy" => {
      // Get current hour in Toronto timezone
      const torontoHour = new Date().toLocaleString("en-US", { 
        timeZone: "America/Toronto",
        hour: "numeric",
        hour12: false 
      })
      const hour = parseInt(torontoHour)
      
      // Clear sky
      if (code === 800) return "sunny"
      // Clear sky (night)
      if (code === 800 && (hour < 6 || hour >= 20)) return "sunny"
      // Clouds
      if (code >= 801 && code <= 804) {
        if (code === 801 || code === 802) return "partly-cloudy"
        return "cloudy"
      }
      // Rain, Drizzle, Thunderstorm
      if (code >= 200 && code < 600) return "rainy"
      // Default
      return "partly-cloudy"
    }

    // Process current weather
    const current = {
      temp: Math.round(currentData.main.temp),
      high: Math.round(currentData.main.temp_max),
      low: Math.round(currentData.main.temp_min),
      condition: mapCondition(currentData.weather[0].id),
      humidity: currentData.main.humidity,
      windSpeed: Math.round(currentData.wind?.speed * 3.6 || 0), // Convert m/s to km/h
      description: currentData.weather[0].main,
    }

    // Process forecast (get daily highs/lows from 3-hourly data)
    const dailyForecast: Record<string, { high: number; low: number; condition: string }> = {}
    
    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000)
      const dateKey = date.toLocaleDateString("en-US", { 
        timeZone: "America/Toronto",
        weekday: "short" 
      })
      
      if (!dailyForecast[dateKey]) {
        dailyForecast[dateKey] = {
          high: Math.round(item.main.temp_max),
          low: Math.round(item.main.temp_min),
          condition: mapCondition(item.weather[0].id),
        }
      } else {
        dailyForecast[dateKey].high = Math.max(dailyForecast[dateKey].high, Math.round(item.main.temp_max))
        dailyForecast[dateKey].low = Math.min(dailyForecast[dateKey].low, Math.round(item.main.temp_min))
      }
    })

    const forecast = Object.entries(dailyForecast)
      .slice(0, 4)
      .map(([day, data]) => ({
        day,
        temp: data.high, // Use high as display temp
        high: data.high,
        low: data.low,
        condition: data.condition,
      }))

    return NextResponse.json({
      current,
      forecast,
      location: "Thornhill, ON",
    })
  } catch (error: any) {
    console.error("Error fetching weather:", error)
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    )
  }
}
