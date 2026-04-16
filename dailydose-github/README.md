# DailyDose+ 💊

A medication tracking app for iOS and Android built with React Native (Expo) and Supabase.

---

## Features

- 📋 **Medication tracking** — add medications with dosage, schedule, and reminders
- 🔒 **Privacy mode** — cover names hide real medication names in notifications
- 👨‍👩‍👦 **Caregiver access** — invite family members to help manage medications
- 🌐 **Multilingual** — English, Spanish, French, Arabic
- 🔔 **Push notifications** — dose reminders and missed-dose alerts
- 💳 **30-day free trial** — $5/month subscription after trial

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native + Expo SDK 51 |
| Navigation | React Navigation v6 |
| State | Zustand + AsyncStorage |
| Backend | Supabase (Postgres + Auth + Realtime) |
| Email | Resend |
| Push Notifications | Expo Notifications |
| Language | TypeScript |

---

## Project Structure

```
dailydose-plus/
├── App.tsx                    # Entry point
├── app.json                   # Expo config
├── CLAUDE.md                  # Full project instructions for Claude Code
├── DailyDose_Code.html        # Original HTML prototype (visual reference)
├── locales/                   # Translations (en, es, fr, ar)
├── src/
│   ├── components/            # Reusable UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/supabase.ts        # Supabase client + all API calls
│   ├── navigation/            # React Navigation setup
│   ├── screens/               # All app screens
│   │   ├── auth/              # Sign up, add medication, notifications setup
│   │   ├── caregiver/         # Caregiver invite + account switcher
│   │   ├── home/              # Dashboard + calendar
│   │   ├── meds/              # Medication list
│   │   └── settings/          # Settings + language
│   ├── store/                 # Zustand state stores
│   ├── theme/                 # Colors + typography tokens
│   └── utils/                 # Helper functions
└── supabase/
    ├── migrations/            # Database schema (run in order)
    └── functions/             # Edge functions (email + push notifications)
```

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Fill in your Supabase URL and keys
```

### 3. Set up the database
- Create a project at [supabase.com](https://supabase.com)
- Go to SQL Editor and run `supabase/migrations/run_all.sql`

### 4. Start the app
```bash
npx expo start
```

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with **Expo Go** app for physical device

---

## Environment Variables

Create a `.env` file (never commit this):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Team

Built with DailyDose+ using Claude + Expo + Supabase.
