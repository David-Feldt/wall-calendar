# Wall Calendar

A beautiful wall calendar application built with Next.js, featuring Google Calendar integration and real-time weather display for Thornhill, Ontario. Optimized for tablet wall displays as a Progressive Web App.

## Features

- 🌤️ **Weather Display** - Real-time weather for Thornhill, Ontario with animated graphics
- 📅 **10-Day Forecast View** - Compact 5x2 grid showing your Google Calendar events
- 🔐 **Google Calendar Integration** - Sign in to sync your real calendar events
- 🎨 **Calendar Selection** - Choose which calendars to display (primary, birthdays, family, etc.)
- 🌈 **Color Preservation** - Events maintain their original Google Calendar colors
- 📱 **Progressive Web App** - Install on your tablet for a native app experience
- 🕐 **Toronto Timezone** - All times displayed in Toronto timezone (EST/EDT)

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, or pnpm
- Google Cloud account (for Calendar API)
- OpenWeatherMap account (free API key)

### Installation

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Set up Google Calendar API:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project and enable **Google Calendar API**
   - Create OAuth 2.0 credentials (Web application)
   - Add redirect URI: `http://localhost:3000/api/auth/google/callback`
   - Add yourself as a test user in OAuth consent screen

3. **Get OpenWeatherMap API key:**
   - Sign up at [OpenWeatherMap](https://openweathermap.org/api)
   - Get your free API key

4. **Configure environment variables:**
   Create `.env.local`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   ```

5. **Run development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Installing as PWA

### iOS (iPad)
1. Open Safari and navigate to the app
2. Tap Share → "Add to Home Screen"
3. App appears as standalone app

### Android
1. Open Chrome and navigate to the app
2. Tap menu → "Install App" or "Add to Home Screen"
3. App installs and appears in app drawer

**PWA Features:**
- ✅ Works offline (cached pages)
- ✅ Standalone mode (no browser UI)
- ✅ Portrait orientation optimized
- ✅ Auto-updates on deployment

## Deployment to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Add environment variables (see below)
   - Deploy

3. **Environment Variables (Vercel):**
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/google/callback
   NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
   OPENWEATHER_API_KEY=your_api_key
   ```

4. **Update Google Cloud Console:**
   - Add `https://your-app.vercel.app/api/auth/google/callback` to authorized redirect URIs
   - Redeploy on Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
wall-calendar/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (auth, calendar, weather)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout with PWA config
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # UI component library
│   ├── calendar-settings.tsx
│   ├── pwa-install.tsx
│   ├── weather-display.tsx
│   └── weekly-calendar.tsx
├── lib/                  # Utilities
│   ├── timezone.ts       # Toronto timezone helpers
│   └── utils.ts
├── public/               # Static assets
│   ├── manifest.json     # PWA manifest
│   └── sw.js            # Service worker
└── hooks/               # Custom React hooks
```

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **APIs**: Google Calendar API, OpenWeatherMap API
- **PWA**: Service Worker, Web App Manifest

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

This project is private.
