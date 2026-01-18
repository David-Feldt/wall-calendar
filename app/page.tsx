import { WeatherDisplay } from "@/components/weather-display"
import { WeeklyCalendar } from "@/components/weekly-calendar"

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <WeatherDisplay />
      <WeeklyCalendar />
    </main>
  )
}
