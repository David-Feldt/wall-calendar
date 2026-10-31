import type { WeatherIcon as WeatherIconName } from "@/lib/weather"

/*
 * Line-art weather icons for the e-ink display, drawn on a 24x24 grid.
 * Shapes adapted from Lucide (ISC license, https://lucide.dev).
 * Plain <svg>/<path> elements only, so Satori (next/og) can render them.
 */

const CLOUD_BASE = "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"

const ICONS: Record<WeatherIconName, { paths: string[]; circles?: [number, number, number][] }> = {
  clear: {
    circles: [[12, 12, 4]],
    paths: ["M12 2v2", "M12 20v2", "m4.93 4.93 1.41 1.41", "m17.66 17.66 1.41 1.41", "M2 12h2", "M20 12h2", "m6.34 17.66-1.41 1.41", "m19.07 4.93-1.41 1.41"],
  },
  "clear-night": {
    paths: ["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"],
  },
  "partly-cloudy": {
    paths: ["M12 2v2", "m4.93 4.93 1.41 1.41", "M20 12h2", "m19.07 4.93-1.41 1.41", "M15.947 12.65a4 4 0 0 0-5.925-4.128", "M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"],
  },
  "partly-cloudy-night": {
    paths: ["M10.188 8.5A6 6 0 0 1 16 4a1 1 0 0 0 6 6 6 6 0 0 1-3 5.197", "M13 16a3 3 0 1 1 0 6H7a5 5 0 1 1 4.9-6Z"],
  },
  cloudy: {
    paths: ["M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"],
  },
  rain: {
    paths: [CLOUD_BASE, "M16 14v6", "M8 14v6", "M12 16v6"],
  },
  storm: {
    paths: ["M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973", "m13 12-3 5h4l-3 5"],
  },
  snow: {
    paths: [CLOUD_BASE, "M8 15h.01", "M8 19h.01", "M12 17h.01", "M12 21h.01", "M16 15h.01", "M16 19h.01"],
  },
  fog: {
    paths: [CLOUD_BASE, "M16 17H7", "M17 21H9"],
  },
}

export function WeatherIcon({
  icon,
  size,
  color = "#000",
  strokeWidth = 2.25,
}: {
  icon: WeatherIconName
  size: number
  color?: string
  strokeWidth?: number
}) {
  const { paths, circles = [] } = ICONS[icon]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {circles.map(([cx, cy, r], i) => (
        <circle key={`c${i}`} cx={cx} cy={cy} r={r} />
      ))}
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}

export const ALL_WEATHER_ICONS = Object.keys(ICONS) as WeatherIconName[]
