const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY
const LAT = "43.65"
const LON = "-79.38"

export type WeatherCondition = "sunny" | "cloudy" | "rainy" | "partly-cloudy"

/** Finer-grained condition used for icons (e.g. on the TRMNL e-ink display). */
export type WeatherIcon =
  | "clear"
  | "clear-night"
  | "partly-cloudy"
  | "partly-cloudy-night"
  | "cloudy"
  | "rain"
  | "storm"
  | "snow"
  | "fog"

/** Map an OpenWeatherMap condition code (https://openweathermap.org/weather-conditions) to an icon. */
export function iconForCode(code: number, night = false): WeatherIcon {
  if (code >= 200 && code < 300) return "storm"
  if (code >= 300 && code < 600) return "rain"
  if (code >= 600 && code < 700) return "snow"
  if (code >= 700 && code < 800) return "fog"
  if (code === 800) return night ? "clear-night" : "clear"
  if (code === 801 || code === 802) return night ? "partly-cloudy-night" : "partly-cloudy"
  return "cloudy"
}

export interface WeatherData {
  current: {
    temp: number
    high: number
    low: number
    condition: WeatherCondition
    humidity: number
    windSpeed: number
    description: string
    icon: WeatherIcon
  }
  forecast: { day: string; temp: number; high: number; low: number; condition: string; icon: WeatherIcon }[]
  location: string
}

/** Fetch current weather + daily forecast (default 4 days, today first) for Thornhill, ON. Throws on failure. */
export async function getWeather(forecastDays = 4): Promise<WeatherData> {
  if (!WEATHER_API_KEY) {
    throw new Error("Weather API key not configured")
  }

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
    icon: iconForCode(
      currentData.weather[0].id,
      currentData.dt < currentData.sys?.sunrise || currentData.dt > currentData.sys?.sunset
    ),
  }

  // Process forecast (get daily highs/lows from 3-hourly data)
  // The icon uses the reading closest to 1pm, so it reflects daytime weather.
  const dailyForecast: Record<
    string,
    { high: number; low: number; condition: string; iconCode: number; iconHourDistance: number }
  > = {}

  forecastData.list.forEach((item: any) => {
    const date = new Date(item.dt * 1000)
    const dateKey = date.toLocaleDateString("en-US", { 
      timeZone: "America/Toronto",
      weekday: "short" 
    })
    
    const hour = parseInt(date.toLocaleString("en-US", { timeZone: "America/Toronto", hour: "numeric", hour12: false }))
    const hourDistance = Math.abs((hour % 24) - 13)

    if (!dailyForecast[dateKey]) {
      dailyForecast[dateKey] = {
        high: Math.round(item.main.temp_max),
        low: Math.round(item.main.temp_min),
        condition: mapCondition(item.weather[0].id),
        iconCode: item.weather[0].id,
        iconHourDistance: hourDistance,
      }
    } else {
      const day = dailyForecast[dateKey]
      day.high = Math.max(day.high, Math.round(item.main.temp_max))
      day.low = Math.min(day.low, Math.round(item.main.temp_min))
      if (hourDistance < day.iconHourDistance) {
        day.iconCode = item.weather[0].id
        day.iconHourDistance = hourDistance
      }
    }
  })

  const forecast = Object.entries(dailyForecast)
    .slice(0, forecastDays)
    .map(([day, data]) => ({
      day,
      temp: data.high, // Use high as display temp
      high: data.high,
      low: data.low,
      condition: data.condition,
      icon: iconForCode(data.iconCode),
    }))

  return {
    current,
    forecast,
    location: "Thornhill, ON",
  }
}
