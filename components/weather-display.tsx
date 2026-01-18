"use client"

import { Wind, Droplets } from "lucide-react"
import { useEffect, useState } from "react"
import { getTorontoTime, formatTorontoTime, formatTorontoDate } from "@/lib/timezone"

type TimeOfDay = "morning" | "afternoon" | "evening" | "night"

const getTimeOfDay = (date: Date): TimeOfDay => {
  // Get hour in Toronto timezone
  const torontoHour = parseInt(date.toLocaleString("en-US", {
    timeZone: "America/Toronto",
    hour: "numeric",
    hour12: false
  }))
  if (torontoHour >= 5 && torontoHour < 12) return "morning"
  if (torontoHour >= 12 && torontoHour < 17) return "afternoon"
  if (torontoHour >= 17 && torontoHour < 21) return "evening"
  return "night"
}

const WeatherGraphic = ({ condition, timeOfDay }: { condition: string; timeOfDay: TimeOfDay }) => {
  // Sunny variations
  if (condition === "sunny") {
    switch (timeOfDay) {
      case "morning":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Warm sunrise gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#FF9A56] via-[#FFCC80] to-[#87CEEB]" />
            {/* Rising sun */}
            <div className="absolute bottom-20 right-16 w-28 h-28 rounded-full bg-[#FBBC04] shadow-[0_0_80px_30px_rgba(255,154,86,0.6)]" />
            {/* Morning haze */}
            <div className="absolute bottom-12 left-0 right-0 h-24 bg-gradient-to-t from-white/30 to-transparent" />
            {/* Landscape with morning dew */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#34A853]/40 rounded-t-full scale-x-150" />
            {/* Birds */}
            <svg className="absolute top-16 left-20 w-8 h-4 text-[#374151]/60" viewBox="0 0 32 16">
              <path d="M0 8 Q8 0 16 8 Q24 0 32 8" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <svg className="absolute top-12 left-32 w-6 h-3 text-[#374151]/40" viewBox="0 0 32 16">
              <path d="M0 8 Q8 0 16 8 Q24 0 32 8" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        )
      case "afternoon":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Bright blue sky */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#4285F4] via-[#60A5FA] to-[#93C5FD]" />
            {/* High sun */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-[#FBBC04] shadow-[0_0_60px_25px_rgba(251,188,4,0.5)]" />
            {/* Sun rays */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute top-[72px] left-1/2 w-1 h-16 bg-[#FBBC04]/30 origin-bottom"
                style={{ transform: `translateX(-50%) rotate(${i * 45}deg)` }}
              />
            ))}
            {/* Bright landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-[#34A853]/35 rounded-t-full scale-x-150" />
            {/* Small hill */}
            <div className="absolute bottom-0 right-0 w-48 h-12 bg-[#34A853]/25 rounded-t-full" />
          </div>
        )
      case "evening":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Sunset gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1E3A5F] via-[#EA4335] via-[#FF6B35] to-[#FBBC04]" />
            {/* Setting sun */}
            <div className="absolute bottom-8 left-20 w-24 h-24 rounded-full bg-[#EA4335] shadow-[0_0_60px_20px_rgba(234,67,53,0.5)]" />
            {/* Horizon glow */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FBBC04]/40 to-transparent" />
            {/* Silhouette landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#1F2937] rounded-t-full scale-x-150" />
            {/* Tree silhouettes */}
            <div
              className="absolute bottom-14 left-16 w-8 h-20 bg-[#1F2937]"
              style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
            />
            <div
              className="absolute bottom-14 left-28 w-6 h-16 bg-[#1F2937]"
              style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
            />
          </div>
        )
      case "night":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Night sky */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#334155]" />
            {/* Moon */}
            <div className="absolute top-8 right-12 w-20 h-20 rounded-full bg-[#F1F5F9] shadow-[0_0_40px_15px_rgba(241,245,249,0.3)]" />
            {/* Moon craters */}
            <div className="absolute top-12 right-16 w-4 h-4 rounded-full bg-[#CBD5E1]/50" />
            <div className="absolute top-16 right-20 w-3 h-3 rounded-full bg-[#CBD5E1]/40" />
            {/* Stars */}
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white animate-pulse"
                style={{
                  left: `${5 + ((i * 17) % 90)}%`,
                  top: `${5 + ((i * 13) % 50)}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "2s",
                  opacity: 0.4 + (i % 3) * 0.3,
                }}
              />
            ))}
            {/* Night landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#0F172A] rounded-t-full scale-x-150" />
          </div>
        )
    }
  }

  // Cloudy variations
  if (condition === "cloudy") {
    switch (timeOfDay) {
      case "morning":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Soft morning overcast */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#94A3B8] via-[#CBD5E1] to-[#E2E8F0]" />
            {/* Hint of warm light */}
            <div className="absolute top-0 right-0 w-1/2 h-1/3 bg-gradient-to-bl from-[#FBBF24]/20 to-transparent" />
            {/* Morning clouds */}
            <div className="absolute top-6 left-4 w-44 h-18 bg-white/90 rounded-full blur-sm" />
            <div className="absolute top-14 left-24 w-36 h-14 bg-white/80 rounded-full blur-sm" />
            <div className="absolute top-4 right-8 w-40 h-16 bg-white/85 rounded-full blur-sm" />
            <div className="absolute top-20 left-1/3 w-48 h-16 bg-white/75 rounded-full blur-sm" />
            {/* Muted landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#64748B]/25 rounded-t-full scale-x-150" />
          </div>
        )
      case "afternoon":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Flat gray sky */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#9CA3AF] via-[#D1D5DB] to-[#E5E7EB]" />
            {/* Dense clouds */}
            <div className="absolute top-4 left-0 w-52 h-20 bg-white/95 rounded-full blur-sm" />
            <div className="absolute top-8 left-32 w-44 h-18 bg-white/85 rounded-full blur-sm" />
            <div className="absolute top-2 right-4 w-48 h-20 bg-white/90 rounded-full blur-sm" />
            <div className="absolute top-12 right-24 w-36 h-14 bg-white/75 rounded-full blur-sm" />
            <div className="absolute top-24 left-1/4 w-56 h-18 bg-white/80 rounded-full blur-sm" />
            {/* Landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#6B7280]/20 rounded-t-full scale-x-150" />
          </div>
        )
      case "evening":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Moody evening overcast */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#64748B] via-[#94A3B8] to-[#78716C]" />
            {/* Hint of orange glow */}
            <div className="absolute bottom-16 left-0 right-0 h-24 bg-gradient-to-t from-[#FB923C]/20 to-transparent" />
            {/* Dark clouds */}
            <div className="absolute top-4 left-4 w-48 h-18 bg-[#CBD5E1]/80 rounded-full blur-sm" />
            <div className="absolute top-10 left-28 w-40 h-16 bg-[#CBD5E1]/70 rounded-full blur-sm" />
            <div className="absolute top-6 right-6 w-44 h-18 bg-[#CBD5E1]/75 rounded-full blur-sm" />
            {/* Dusky landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#44403C]/40 rounded-t-full scale-x-150" />
          </div>
        )
      case "night":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Dark overcast night */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1E293B] via-[#334155] to-[#475569]" />
            {/* Heavy night clouds */}
            <div className="absolute top-4 left-4 w-52 h-20 bg-[#475569]/80 rounded-full blur-md" />
            <div className="absolute top-10 left-32 w-44 h-18 bg-[#64748B]/60 rounded-full blur-md" />
            <div className="absolute top-6 right-6 w-48 h-20 bg-[#475569]/70 rounded-full blur-md" />
            <div className="absolute top-20 left-1/3 w-56 h-18 bg-[#64748B]/50 rounded-full blur-md" />
            {/* Faint moon glow behind clouds */}
            <div className="absolute top-8 right-16 w-24 h-24 rounded-full bg-[#94A3B8]/20 blur-xl" />
            {/* Dark landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#0F172A] rounded-t-full scale-x-150" />
          </div>
        )
    }
  }

  // Rainy variations
  if (condition === "rainy") {
    switch (timeOfDay) {
      case "morning":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Gray morning rain sky */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#6B7280] via-[#9CA3AF] to-[#D1D5DB]" />
            {/* Storm clouds */}
            <div className="absolute top-2 left-2 w-48 h-20 bg-[#4B5563] rounded-full blur-md" />
            <div className="absolute top-6 left-24 w-40 h-16 bg-[#6B7280] rounded-full blur-md" />
            <div className="absolute top-0 right-4 w-44 h-18 bg-[#4B5563] rounded-full blur-md" />
            {/* Morning rain - lighter drops */}
            {[...Array(18)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-8 bg-[#4285F4]/50 rounded-full animate-rain"
                style={{
                  left: `${5 + i * 5.5}%`,
                  top: `${25 + (i % 4) * 8}%`,
                  animationDelay: `${i * 0.08}s`,
                  animationDuration: "0.9s",
                }}
              />
            ))}
            {/* Wet landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#4B5563]/30 rounded-t-full scale-x-150" />
          </div>
        )
      case "afternoon":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Dark afternoon storm */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#374151] via-[#4B5563] to-[#6B7280]" />
            {/* Heavy storm clouds */}
            <div className="absolute top-0 left-0 w-56 h-24 bg-[#1F2937] rounded-full blur-md" />
            <div className="absolute top-4 left-32 w-48 h-20 bg-[#374151] rounded-full blur-md" />
            <div className="absolute top-0 right-0 w-52 h-22 bg-[#1F2937] rounded-full blur-md" />
            {/* Heavy rain */}
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-10 bg-[#60A5FA]/60 rounded-full animate-rain"
                style={{
                  left: `${3 + i * 4}%`,
                  top: `${30 + (i % 5) * 6}%`,
                  animationDelay: `${i * 0.06}s`,
                  animationDuration: "0.7s",
                }}
              />
            ))}
            {/* Puddle reflections */}
            <div className="absolute bottom-2 left-1/4 w-20 h-2 bg-[#60A5FA]/20 rounded-full blur-sm" />
            <div className="absolute bottom-4 right-1/3 w-16 h-2 bg-[#60A5FA]/15 rounded-full blur-sm" />
            {/* Landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#1F2937]/40 rounded-t-full scale-x-150" />
          </div>
        )
      case "evening":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Purple-gray evening storm */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#374151] via-[#4B5563] to-[#57534E]" />
            {/* Hint of sunset behind rain */}
            <div className="absolute bottom-12 left-0 right-0 h-16 bg-gradient-to-t from-[#9A3412]/20 to-transparent" />
            {/* Evening storm clouds */}
            <div className="absolute top-2 left-4 w-48 h-20 bg-[#292524] rounded-full blur-md" />
            <div className="absolute top-6 left-28 w-40 h-16 bg-[#44403C] rounded-full blur-md" />
            <div className="absolute top-0 right-6 w-44 h-18 bg-[#292524] rounded-full blur-md" />
            {/* Evening rain */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-8 bg-[#93C5FD]/40 rounded-full animate-rain"
                style={{
                  left: `${4 + i * 5}%`,
                  top: `${28 + (i % 5) * 8}%`,
                  animationDelay: `${i * 0.07}s`,
                  animationDuration: "0.8s",
                }}
              />
            ))}
            {/* Dark landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#1C1917] rounded-t-full scale-x-150" />
          </div>
        )
      case "night":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Dark night storm */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#334155]" />
            {/* Dark storm clouds */}
            <div className="absolute top-0 left-0 w-52 h-22 bg-[#020617] rounded-full blur-lg" />
            <div className="absolute top-4 left-28 w-44 h-18 bg-[#0F172A] rounded-full blur-lg" />
            <div className="absolute top-0 right-0 w-48 h-20 bg-[#020617] rounded-full blur-lg" />
            {/* Night rain - subtle */}
            {[...Array(22)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-6 bg-[#94A3B8]/30 rounded-full animate-rain"
                style={{
                  left: `${4 + i * 4.5}%`,
                  top: `${32 + (i % 5) * 7}%`,
                  animationDelay: `${i * 0.08}s`,
                  animationDuration: "1s",
                }}
              />
            ))}
            {/* Lightning flash hint */}
            <div
              className="absolute top-16 left-1/3 w-32 h-32 bg-[#E0E7FF]/5 rounded-full blur-3xl animate-pulse"
              style={{ animationDuration: "4s" }}
            />
            {/* Dark landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#020617] rounded-t-full scale-x-150" />
          </div>
        )
    }
  }

  // Partly cloudy variations
  if (condition === "partly-cloudy") {
    switch (timeOfDay) {
      case "morning":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Warm morning with clouds */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#60A5FA] via-[#93C5FD] to-[#FDE68A]" />
            {/* Morning sun */}
            <div className="absolute top-12 right-8 w-24 h-24 rounded-full bg-[#FBBF24] shadow-[0_0_50px_20px_rgba(251,191,36,0.4)]" />
            {/* Scattered clouds */}
            <div className="absolute top-8 left-8 w-36 h-14 bg-white/90 rounded-full blur-sm" />
            <div className="absolute top-16 left-28 w-28 h-12 bg-white/80 rounded-full blur-sm" />
            <div className="absolute top-6 right-4 w-32 h-14 bg-white/85 rounded-full blur-sm" />
            {/* Birds */}
            <svg className="absolute top-24 left-16 w-6 h-3 text-[#374151]/50" viewBox="0 0 32 16">
              <path d="M0 8 Q8 0 16 8 Q24 0 32 8" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            {/* Morning landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#34A853]/35 rounded-t-full scale-x-150" />
          </div>
        )
      case "afternoon":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Bright partly cloudy */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#3B82F6] via-[#60A5FA] to-[#93C5FD]" />
            {/* High sun */}
            <div className="absolute top-8 left-1/3 w-28 h-28 rounded-full bg-[#FBBC04] shadow-[0_0_60px_25px_rgba(251,188,4,0.45)]" />
            {/* Fluffy clouds */}
            <div className="absolute top-6 right-6 w-40 h-16 bg-white/95 rounded-full blur-sm" />
            <div className="absolute top-14 right-20 w-32 h-14 bg-white/85 rounded-full blur-sm" />
            <div className="absolute top-10 left-6 w-36 h-14 bg-white/80 rounded-full blur-sm" />
            <div className="absolute top-24 left-1/2 w-44 h-14 bg-white/75 rounded-full blur-sm" />
            {/* Landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#34A853]/30 rounded-t-full scale-x-150" />
          </div>
        )
      case "evening":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Sunset with clouds */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1E3A5F] via-[#F97316] to-[#FBBF24]" />
            {/* Setting sun */}
            <div className="absolute bottom-12 left-16 w-20 h-20 rounded-full bg-[#F97316] shadow-[0_0_50px_20px_rgba(249,115,22,0.5)]" />
            {/* Clouds with sunset colors */}
            <div className="absolute top-6 right-8 w-40 h-16 bg-gradient-to-r from-[#FDA4AF]/80 to-[#FDE68A]/80 rounded-full blur-sm" />
            <div className="absolute top-14 right-24 w-32 h-12 bg-gradient-to-r from-[#FDBA74]/70 to-[#FCD34D]/70 rounded-full blur-sm" />
            <div className="absolute top-10 left-1/3 w-36 h-14 bg-gradient-to-r from-[#F9A8D4]/60 to-[#FDE68A]/60 rounded-full blur-sm" />
            {/* Silhouette landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#1F2937] rounded-t-full scale-x-150" />
          </div>
        )
      case "night":
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Night sky with some clouds */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#334155]" />
            {/* Moon */}
            <div className="absolute top-10 right-16 w-18 h-18 rounded-full bg-[#F1F5F9] shadow-[0_0_35px_12px_rgba(241,245,249,0.25)]" />
            {/* Stars peeking through */}
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white"
                style={{
                  left: `${8 + ((i * 19) % 85)}%`,
                  top: `${8 + ((i * 11) % 45)}%`,
                  opacity: 0.3 + (i % 4) * 0.2,
                }}
              />
            ))}
            {/* Night clouds */}
            <div className="absolute top-4 left-8 w-40 h-14 bg-[#475569]/70 rounded-full blur-sm" />
            <div className="absolute top-16 left-1/3 w-36 h-12 bg-[#64748B]/50 rounded-full blur-sm" />
            <div className="absolute top-8 right-4 w-32 h-14 bg-[#475569]/60 rounded-full blur-sm" />
            {/* Dark landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#0F172A] rounded-t-full scale-x-150" />
          </div>
        )
    }
  }

  // Default fallback
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#4285F4] via-[#87CEEB] to-[#B0E0E6]" />
    </div>
  )
}

interface WeatherData {
  temp: number
  high: number
  low: number
  condition: "sunny" | "cloudy" | "rainy" | "partly-cloudy"
  humidity?: number
  windSpeed?: number
}

export function WeatherDisplay() {
  const [currentTime, setCurrentTime] = useState(getTorontoTime())
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay(getTorontoTime()))
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [location, setLocation] = useState("Thornhill, ON")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      const now = getTorontoTime()
      setCurrentTime(now)
      setTimeOfDay(getTimeOfDay(now))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchWeather()
    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchWeather = async () => {
    try {
      const response = await fetch("/api/weather")
      if (!response.ok) {
        throw new Error("Failed to fetch weather")
      }
      const data = await response.json()
      setWeather(data.current)
      setLocation(data.location || "Thornhill, ON")
    } catch (error) {
      console.error("Error fetching weather:", error)
      // Fallback to default data if API fails
      setWeather({
        temp: 20,
        high: 22,
        low: 15,
        condition: "partly-cloudy",
        humidity: 60,
        windSpeed: 10,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return formatTorontoTime(date)
  }

  const formatDate = (date: Date) => {
    return formatTorontoDate(date, {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }

  const displayWeather = weather || {
    temp: 20,
    high: 22,
    low: 15,
    condition: "partly-cloudy" as const,
    humidity: 60,
    windSpeed: 10,
  }

  return (
    <div className="relative h-[40vh] min-h-[280px] overflow-hidden rounded-b-3xl shadow-sm">
      <WeatherGraphic condition={displayWeather.condition} timeOfDay={timeOfDay} />

      {/* Content overlay */}
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
        {/* Header with time and location */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex gap-0.5">
                <span className="w-2 h-2 rounded-full bg-[#4285F4]" />
                <span className="w-2 h-2 rounded-full bg-[#EA4335]" />
                <span className="w-2 h-2 rounded-full bg-[#FBBC04]" />
                <span className="w-2 h-2 rounded-full bg-[#34A853]" />
              </div>
              <span className="text-sm font-medium text-white/80 drop-shadow-md">Wall Calendar</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight drop-shadow-lg">
              {formatTime(currentTime)}
            </h1>
            <p className="text-lg text-white/90 mt-1 drop-shadow-md">{formatDate(currentTime)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/80 drop-shadow-md">{location}</p>
            <div className="flex items-center gap-2 mt-1">
              <Wind size={16} className="text-white/80" />
              <span className="text-sm text-white/80 drop-shadow-md">
                {displayWeather.windSpeed || 0} km/h
              </span>
              <Droplets size={16} className="text-white/80 ml-2" />
              <span className="text-sm text-white/80 drop-shadow-md">
                {displayWeather.humidity || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Main weather info */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-8xl md:text-9xl font-extralight text-white drop-shadow-lg">
              {displayWeather.temp}°
            </span>
          </div>
          <div className="text-right mb-4">
            <span className="text-2xl capitalize text-white font-medium drop-shadow-lg block">
              {displayWeather.condition.replace("-", " ")}
            </span>
            <span className="text-white/90 drop-shadow-md">
              H: {displayWeather.high}° L: {displayWeather.low}°
            </span>
          </div>
        </div>
      </div>

      {/* Rain animation keyframes */}
      <style jsx>{`
        @keyframes rain {
          0% {
            transform: translateY(-10px);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100px);
            opacity: 0;
          }
        }
        .animate-rain {
          animation: rain linear infinite;
        }
      `}</style>
    </div>
  )
}
