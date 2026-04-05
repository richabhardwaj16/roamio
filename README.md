# Roamio Web

Roamio is a React + Vite travel web app with:

- Gemini-powered trip planning and AI chat through the main backend
- Firebase email/password authentication
- Firebase Realtime Database for profile data, public buddy profiles, chats, reviews, trips, notifications, timeline, and SOS alerts
- Live travel map and destination search using OpenStreetMap data
- Buddy matching based on real public traveler profiles
- Blend trip planning, travel memory timeline, place reviews, gamified quiz/facts, and toast feedback

## Environment

Create `.env` with:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.region.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Run

Frontend:

```bash
npm run dev
```

Main backend:

```bash
cd ../roamio-backend
npm run dev
```

## Firebase Setup

1. Enable `Authentication -> Sign-in method -> Email/Password`.
2. Create a Realtime Database.
3. Apply `database.rules.json`.
4. Confirm `.firebaserc` points at the correct project.

## Data Paths

- `users/{uid}`: private user profile, trips, direct messages, reviews, notifications, memory timeline
- `publicProfiles/{uid}`: limited public traveler profile used for buddy matching
- `community/groupChat`: shared realtime chat room
- `alerts/{uid}`: SOS payload

## Deploy

Deploy hosting:

```bash
npm run build
npm run deploy:hosting
```

Deploy database rules:

```bash
npm run deploy:rules
```

## Notes

- AI requests are proxied to the main backend on port `5000`.
- Explore uses live OpenStreetMap search plus curated fallback destinations.
- Buddy matching now comes from realtime public profiles instead of only local sample data.
