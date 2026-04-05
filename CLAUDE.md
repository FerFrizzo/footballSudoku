# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies (runs patch-package postinstall)
npm start            # Start Expo dev server
npm run android      # Run on Android emulator/device
npm run ios          # Run on iOS simulator/device
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
```

**Native builds (generates ios/ and android/ via prebuild):**
```bash
npx expo run:ios
npx expo run:android
npx expo prebuild --platform ios   # prebuild only, without running
```

**RevenueCat seed (one-time setup):**
```bash
npx tsx scripts/seedRevenueCat.ts
```

**Supabase Edge Functions:**
```bash
supabase functions serve    # Local development
supabase functions deploy   # Deploy to production
```

**No test suite is configured.** Linting is the primary code quality check.

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_REVENUECAT_TEST_API_KEY=   # must start with "test_"
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
```

In dev/Expo Go the app uses `REVENUECAT_TEST_API_KEY`. Native iOS/Android builds use their respective platform keys. If RevenueCat warns about wrong key type, restart the dev server.

## Architecture

**Football Sudoku** is a freemium story-mode sudoku game set in a fictional 10-tier football pyramid. Players manage a fictional club and progress by completing sudoku puzzles that simulate matchdays.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo 54), TypeScript |
| Routing | Expo Router (file-based, `app/` directory) |
| State | Zustand + AsyncStorage (full local persistence) |
| Backend | Supabase (auth, DB, edge functions) |
| Monetization | RevenueCat (IAP), Google Mobile Ads, gems system |
| i18n | i18next — 8 languages (en, es, fr, de, it, pl, pt-BR, pt-PT) |

### Core Game Loop

Puzzle performance → match result (3 stars = win, 1-2 = draw, 0 = loss) → league table update → promotion/relegation after 20 matchdays. Difficulty scales with division tier: Tier 1 (hardest, ~22-25 givens) to Tier 10 (easiest, ~50-52 givens).

### Key Files

- **`src/types.ts`** — Central type definitions, division configs (tiers, difficulty, teams), and dialogue arrays (WIN/DRAW/LOSS/PROMOTION/RELEGATION)
- **`src/state/gameStore.ts`** — Single Zustand store (key: `'sudoku-game-storage'`) holding all app state: auth, club profile, league standings, gems, premium status, settings, language
- **`src/sudoku/engine.ts`** — Puzzle generation (`generatePuzzle`), solving, validation, star/gem calculation, and deterministic seeding via `getPuzzleSeed(divisionId, matchdayIndex)`
- **`src/utils/clubGenerator.ts`** — Procedural team name and league table generation (seeded RNG)
- **`app/_layout.tsx`** — Root layout: auth gate, theme provider, subscription provider, query client
- **`src/lib/revenuecat.tsx`** — `SubscriptionProvider` wrapping the app; platform-aware API key selection; uses TanStack Query (60s customer info cache, 300s offerings cache)

### Route Structure

```
app/
├── (auth)/login.tsx          # Email/password auth via Supabase
├── (setup)/club.tsx          # Onboarding: create club name + colors
├── (tabs)/
│   ├── index.tsx             # Pyramid map — 10 divisions with unlock state
│   └── settings.tsx          # Language, sound, premium, hints, reset
├── division/[divisionId].tsx # Division detail — matchday list and league table
├── matchday/[divisionId]/[matchdayId].tsx  # Active sudoku game
├── dialogue.tsx              # Post-match story/commentary screen
└── about.tsx                 # About/legal info
```

### State Management Pattern

All game state lives in a single Zustand store (`gameStore.ts`) persisted to AsyncStorage. Components read state via selectors and mutate via actions defined in the store. There is no server-side state for gameplay — Supabase is used for auth and analytics only.

Key store actions: `initDivision`, `completeMatchday` (handles promotion when finishing top 3), `addGems`/`spendGems`, `markFreeHintUsed`/`hasFreeHint`, `incrementGamesCompleted` (returns `true` every 2 completions to trigger an ad), `isDivisionUnlocked`, `isMatchdayUnlocked`.

### Scoring & Gems

Defined in `src/sudoku/engine.ts`:
- Stars: 3 = 0 mistakes, 2 = 1 mistake, 1 = 2 mistakes, 0 = 3+ mistakes
- Gems: 15 for 3 stars, 10 for 2, 5 for 1

### Monetization

- **Gems**: Earned from matchdays, spent on hints. Managed in the Zustand store.
- **Premium subscription**: `$0.99/month`, product ID `premium_monthly`. Entitlement key: `premium`. Managed via RevenueCat.
- **Hints**: Non-premium users get one free hint per matchday (`freeHintsUsed` in store). Premium users pay gems.
- **Ads**: Interstitial shown every 2 completed games (`gamesCompletedSinceLastAd` counter in store). Google Mobile Ads app IDs are in `app.json` plugins.

### Config Plugins

`plugins/withPrivacyManifest.js` — copies `PrivacyInfo.xcprivacy` from the project root into `ios/<ProjectName>/` during prebuild. Xcode project registration is intentionally left to React Native's CocoaPods post-install hook (`privacy_manifest_utils.rb`). Do not add `addResourceFile` calls here — it produces malformed PBXBuildFile entries that crash xcodeproj.

### Patches (patch-package)

- **`patches/expo-asset+12.0.12.patch`** — fixes HTTPS dev server support in Expo Go (backport from Expo 55)
- **`patches/xcode+3.0.1.patch`** — null-safety fix in `correctForPath` when a PBX group doesn't exist

### Supabase Edge Functions

- **`delete-account`** — authenticates via JWT, deletes the user via Admin API. Used from the settings screen.
- **`hello`** — example/template function, not used in production.

### Path Aliases

`@/*` resolves to the project root (configured in `tsconfig.json`).
