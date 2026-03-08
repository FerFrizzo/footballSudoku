# Story Mode Sudoku

A freemium "Story Mode Sudoku" game set in a fully fictional football pyramid universe. Built with React Native (Expo) + TypeScript.

## Legal / IP
All content is fictional. No real leagues, clubs, cities, stadiums, or logos are referenced. See the About screen for the full disclaimer.

## Architecture
- **Frontend**: Expo (React Native) with expo-router for file-based routing
- **Backend**: Express server on port 5000 (APIs + landing page)
- **State**: Zustand with AsyncStorage persistence (local-only progress)
- **Auth**: Supabase (with dev bypass when not configured)
- **Analytics**: Queue to Supabase, offline-first
- **Ads/IAP**: Stubs in src/services/stubs.ts

## 10-Division Fictional Pyramid (Top to Bottom)
1. Elite Division (T1) - 22-25 clues
2. Crown Division (T2) - 26-28 clues
3. Champion Division (T3) - 29-31 clues
4. National Division (T4) - 32-34 clues
5. Federation Division (T5) - 35-37 clues
6. Regional Division (T6) - 38-40 clues
7. County Division (T7) - 41-43 clues
8. Borough Division (T8) - 44-46 clues
9. Township Division (T9) - 47-49 clues
10. Grassroots Division (T10) - 50-52 clues

Each division: 20 matchdays, 20 teams (1 user + 19 AI procedural)

## League Table
- 3 stars = Win (3pts), 2 stars = Draw (1pt), 1 star = Loss (0pts)
- Top 3 promote, Bottom 3 in "Drop Zone"
- AI results simulated with weighted randomness

## File Structure
```
app/
  _layout.tsx              # Root layout with providers + auth gate
  +native-intent.tsx       # Deep link handler
  +not-found.tsx           # 404 screen
  dialogue.tsx             # Post-matchday dialogue modal
  about.tsx                # Legal disclaimer screen
  (auth)/
    _layout.tsx
    login.tsx              # Login/signup with Supabase
  (setup)/
    _layout.tsx
    club.tsx               # Club creation (name, badge, colors)
  (tabs)/
    _layout.tsx            # Tab navigation (Season + Settings)
    index.tsx              # Pyramid map (10 divisions)
    settings.tsx           # Settings + About link
  division/
    [divisionId].tsx       # Season dashboard + league table
  matchday/
    [divisionId]/
      [matchdayId].tsx     # Sudoku game screen

src/
  types.ts                 # All types, division configs, constants
  state/
    gameStore.ts           # Zustand store with league progress
  sudoku/
    engine.ts              # Puzzle generator/solver
  services/
    supabase.ts            # Supabase client
    analytics.ts           # Analytics queue
    stubs.ts               # Ads/IAP stubs
  components/
    SudokuGrid.tsx         # 9x9 grid component
    NumberPad.tsx           # Number input pad
    CompletionModal.tsx    # End-of-matchday modal with result
    ColorPicker.tsx        # Club color picker
  theme/
    ThemeProvider.tsx       # Theme context using club colors
  utils/
    clubGenerator.ts       # Procedural fictional club names

server/
  index.ts                 # Express server
  routes.ts                # API routes
  storage.ts               # Server storage
  templates/
    landing-page.html      # Static landing page
```

## Environment Variables
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SESSION_SECRET` - Express session secret

## Internationalisation (i18n)
- 7 supported languages: English (en), Portuguese Brazil (pt-BR), Italian (it), Spanish (es), French (fr), German (de), Polish (pl)
- Translation files: `src/i18n/locales/` (one file per language)
- i18next + react-i18next, bootstrapped in `app/_layout.tsx` via `import '@/src/i18n'`
- Language stored in Zustand `language` field, persisted via AsyncStorage, synced to i18next on rehydrate
- Language switcher in Settings tab: flag emoji + native name buttons
- Division names (Elite, Crown, etc.) are proper nouns — NOT translated

## Key Packages
- expo, expo-router, expo-crypto, expo-haptics, expo-image-picker
- zustand, @tanstack/react-query
- @react-native-async-storage/async-storage
- @react-native-community/netinfo
- @supabase/supabase-js
- @expo/vector-icons (Ionicons)
- Inter font family (@expo-google-fonts/inter)

## Running
- Frontend: `npm run expo:dev` (port 8081)
- Backend: `npm run server:dev` (port 5000)

## Supabase SQL
```sql
CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  device_id text,
  event_name text,
  payload_json jsonb,
  created_at timestamptz DEFAULT now()
);
```
