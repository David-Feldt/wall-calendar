# Wall Calendar

A beautiful wall calendar application built with Next.js, featuring Google Calendar integration and real-time weather display for Thornhill, Ontario.

## Features

- 🌤️ **Weather Display** - Real-time weather for Thornhill, Ontario with animated graphics
- 📅 **10-Day Forecast View** - Compact 5x2 grid showing your Google Calendar events
- 🔐 **Google Calendar Integration** - Sign in to sync your real calendar events
- 🎨 **Calendar Selection** - Choose which calendars to display (primary, birthdays, family, etc.)
- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui components
- 🌈 **Color Preservation** - Events maintain their original Google Calendar colors

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- A package manager: **npm**, **yarn**, or **pnpm** (any will work)

## Getting Started

### 1. Set Up Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
   - Copy your **Client ID** and **Client Secret**
5. **Add test users** (required for testing):
   - Go to "APIs & Services" > "OAuth consent screen"
   - Scroll down to "Test users" section
   - Click "+ ADD USERS"
   - Add your email address (e.g., `dsfeldt@gmail.com`)
   - Click "Add"
   
   **Note:** While the app is in testing mode, only added test users can sign in. For production use, you'll need to submit the app for verification.

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
NEXT_PUBLIC_BASE_URL=http://localhost:3000
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

**Weather API Setup:**
1. Sign up for a free API key at [OpenWeatherMap](https://openweathermap.org/api)
2. Add your API key to `.env.local` as `OPENWEATHER_API_KEY`
3. The weather will automatically show for Thornhill, Ontario

**Important:** 
- `GOOGLE_REDIRECT_URI` should be the **full redirect URI** including the path: `http://localhost:3000/api/auth/google/callback`
- This must **exactly match** what you configure in Google Cloud Console under "Authorized redirect URIs"
- For production, update both `GOOGLE_REDIRECT_URI` and `NEXT_PUBLIC_BASE_URL` to your production URL

### 3. Install Dependencies

Choose your preferred package manager:

**Using npm:**
```bash
npm install
```

**Using yarn:**
```bash
yarn install
```

**Using pnpm:**
```bash
pnpm install
```

### 4. Run Development Server

Start the development server:

**Using npm:**
```bash
npm run dev
```

**Using yarn:**
```bash
yarn dev
```

**Using pnpm:**
```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

### 5. Build for Production

To create an optimized production build:

**Using npm:**
```bash
npm run build
```

**Using yarn:**
```bash
yarn build
```

**Using pnpm:**
```bash
pnpm build
```

### 6. Start Production Server

After building, start the production server:

**Using npm:**
```bash
npm start
```

**Using yarn:**
```bash
yarn start
```

**Using pnpm:**
```bash
pnpm start
```

## Available Scripts

- `dev` - Start the development server
- `build` - Build the application for production
- `start` - Start the production server
- `lint` - Run ESLint to check for code issues

Replace the command prefix with your package manager (`npm run`, `yarn`, or `pnpm`).

## Project Structure

```
google-wall-calendar/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # UI component library (shadcn/ui)
│   ├── weather-display.tsx
│   └── weekly-calendar.tsx
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── public/               # Static assets
```

## Technology Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Google Calendar API**: Integrated via googleapis
- **Package Manager**: npm, yarn, or pnpm (your choice)

## Google Calendar Setup

After starting the app, click "Sign in with Google" to connect your calendar. The app will:
- Request read-only access to your calendar
- Display your events in the weekly view
- Automatically refresh when you navigate between weeks

Your authentication is stored securely in HTTP-only cookies and persists across sessions.

## Development

The project uses:

- **Next.js 16** with App Router
- **React 19**
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** components built on Radix UI

## License

This project is private.
