# Story Mode Sudoku

A freemium "Story Mode Sudoku" game set in a fully fictional football pyramid universe. Built with React Native (Expo) + TypeScript.

## Legal / IP
All content is entirely fictional. No real leagues, clubs, cities, stadiums, or logos are referenced anywhere in the app. The About screen displays the full legal disclaimer. The procedural club name generator (`src/utils/clubGenerator.ts`) uses invented word-part combinations only — no real place names.

## Architecture
- **Frontend**: Expo (React Native) with expo-router for file-based routing
- **Backend**: Express server on port 5000 (APIs + static landing page)
- **State**: Zustand with AsyncStorage persistence (fully local — no server sync needed)
- **Auth**: Supabase (dev bypass active when env vars not set)
- **Analytics**: Offline queue flushed to Supabase `analytics_events` table
- **IAP**: RevenueCat — fully integrated, entitlement `premium`, $2.99/month

## 10-Division Fictional Pyramid (Top → Bottom)
| Tier | Division | Clue Range |
|------|----------|-----------|
| T1 | Elite Division | 22–25 |
| T2 | Crown Division | 26–28 |
| T3 | Champion Division | 29–31 |
| T4 | National Division | 32–34 |
| T5 | Federation Division | 35–37 |
| T6 | Regional Division | 38–40 |
| T7 | County Division | 41–43 |
| T8 | Borough Division | 44–46 |
| T9 | Township Division | 47–49 |
| T10 | Grassroots Division | 50–52 |

Each division: 20 matchdays, 20 teams (1 user + 19 AI procedural).

## League Table & Scoring
- 3 stars → Win (+3 pts), 2 stars → Draw (+1 pt), 1 star → Draw (+1 pt), 0 stars → Loss (+0 pts)
- Top 3 of 20 earn **promotion** after all 20 matchdays
- Bottom 3 are in the **Drop Zone** (relegation warning)
- AI team results simulated each matchday with seeded, weighted randomness
- Grassroots (T10) is always unlocked; higher divisions unlock on promotion

## Matchday Flow
1. Player selects division → `app/division/[divisionId].tsx` (Matchdays tab + League Table tab)
2. Player taps a matchday → `app/matchday/[divisionId]/[matchdayId].tsx` (Sudoku game)
3. On puzzle complete → `CompletionModal` shows stars, result badge (WIN/DRAW/LOSS), gems earned
4. CompletionModal → `app/dialogue.tsx` modal with manager/board dialogue
5. Dialogue dismissed → returns to division screen (league table updates)

## File Structure
```
app/
  _layout.tsx              # Root layout: providers, auth gate, RevenueCat init
  +native-intent.tsx       # Deep link handler
  +not-found.tsx           # 404 screen
  dialogue.tsx             # Post-matchday dialogue modal (promotion/regular)
  about.tsx                # Legal disclaimer + game info screen
  (auth)/
    _layout.tsx
    login.tsx              # Login/signup with Supabase
  (setup)/
    _layout.tsx
    club.tsx               # Club creation (name, badge, colors)
  (tabs)/
    _layout.tsx            # Tab navigation (Season + Settings)
    index.tsx              # Pyramid map (10 divisions, bottom→top visual order)
    settings.tsx           # Settings, premium IAP, language, About link
  division/
    [divisionId].tsx       # Season dashboard: Matchdays tab + League Table tab
  matchday/
    [divisionId]/
      [matchdayId].tsx     # Sudoku game screen

src/
  types.ts                 # All interfaces, DIVISIONS array, dialogue arrays, constants
  state/
    gameStore.ts           # Zustand store: leagueProgress, initDivision, completeMatchday
  sudoku/
    engine.ts              # Puzzle generator/solver, calculateStars, calculateGems
  services/
    supabase.ts            # Supabase client (optional)
    analytics.ts           # Analytics event queue
    stubs.ts               # Ads stub (AdsService)
  components/
    SudokuGrid.tsx         # 9×9 grid with conflict highlighting
    NumberPad.tsx          # Number input pad + notes/undo/erase/hint controls
    CompletionModal.tsx    # End-of-matchday modal: stars, WIN/DRAW/LOSS badge, gems
    ColorPicker.tsx        # Club color picker
    ErrorBoundary.tsx      # App crash recovery
  theme/
    ThemeProvider.tsx      # Theme context driven by club primary/secondary colors
  utils/
    clubGenerator.ts       # Procedural fictional club names (seeded RNG)
  lib/
    revenuecat.tsx         # SubscriptionProvider + useSubscription hook (RevenueCat)
  i18n/
    index.ts               # i18next bootstrap
    locales/               # en, pt-BR, it, es, fr, de, pl

server/
  index.ts                 # Express server
  routes.ts                # API routes
  storage.ts               # Server storage helpers
  templates/
    landing-page.html      # Static landing page served at /

scripts/
  seedRevenueCat.ts        # One-time RevenueCat product/entitlement setup
```

## In-App Purchases (RevenueCat — LIVE)
- **Entitlement**: `premium`
- **Package**: `$rc_monthly`
- **Product**: `premium_monthly` — $2.99/month
- **Integration**: Replit RevenueCat integration connected (project `proj85e7ca90`)
- **Hook**: `useSubscription()` from `src/lib/revenuecat.tsx` → `isSubscribed`, `purchase(pkg)`, `priceString`
- **Premium features**: unlimited hints, no ads
- In dev/Expo Go/web: SDK runs in Preview API Mode automatically (no real charges)

## Environment Variables
| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY` | RevenueCat test store key |
| `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | RevenueCat iOS production key |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` | RevenueCat Android production key |
| `EXPO_PUBLIC_REVENUECAT_PROJECT_ID` | RevenueCat project ID |
| `EXPO_PUBLIC_REVENUECAT_TEST_STORE_APP_ID` | Test store app ID |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (optional) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (optional) |
| `SESSION_SECRET` | Express session secret |

## Internationalisation (i18n)
- 7 languages: English (`en`), Portuguese Brazil (`pt-BR`), Italian (`it`), Spanish (`es`), French (`fr`), German (`de`), Polish (`pl`)
- Translation files: `src/i18n/locales/` — one TypeScript file per language
- i18next + react-i18next; bootstrapped via `import '@/src/i18n'` in `_layout.tsx`
- Active language stored in Zustand `language` field, persisted via AsyncStorage, synced to i18next on rehydrate
- Language switcher in Settings tab: flag emoji + native name buttons
- Division names (Elite, Crown, etc.) are proper nouns — NOT translated

## Key Packages
- `expo`, `expo-router`, `expo-crypto`, `expo-haptics`, `expo-image-picker`
- `zustand`, `@tanstack/react-query`
- `@react-native-async-storage/async-storage`
- `react-native-purchases` (RevenueCat)
- `@supabase/supabase-js`
- `@expo/vector-icons` (Ionicons)
- `@expo-google-fonts/inter` (Inter 400/500/600/700)
- `react-native-keyboard-controller`, `react-native-gesture-handler`
- `react-native-safe-area-context`, `react-native-reanimated`
- `i18next`, `react-i18next`

## Running
- Frontend: `npm run expo:dev` → port 8081
- Backend: `npm run server:dev` → port 5000

## Supabase Analytics Table
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

## Analytics Events Tracked
| Event | When |
|-------|------|
| `app_open` | App launch |
| `matchday_start` | Puzzle begins |
| `matchday_complete` | Puzzle solved (includes result, stars, time) |
| `league_table_viewed` | League Table tab opened |
| `hint_used` | Hint button pressed |
