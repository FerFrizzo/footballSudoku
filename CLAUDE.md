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
- **`src/state/gameStore.ts`** — Single Zustand store holding all app state: auth, club profile, league standings, gems, premium status, settings, language
- **`src/sudoku/engine.ts`** — Sudoku generation, solving, and validation logic
- **`src/utils/clubGenerator.ts`** — Procedural team name and league table generation (seeded RNG)
- **`app/_layout.tsx`** — Root layout: auth gate, theme provider, subscription provider, query client
- **`src/lib/revenuecat.tsx`** — `SubscriptionProvider` wrapping the app; exposes premium state

### Route Structure

```
app/
├── (auth)/login.tsx          # Email/password auth via Supabase
├── (setup)/club.tsx          # Onboarding: create club name + colors
├── (tabs)/
│   ├── index.tsx             # Season view — division selection
│   └── settings.tsx          # Language, sound, premium, hints, reset
├── division/[divisionId].tsx # Division detail
├── matchday/[divisionId]/[matchdayId].tsx  # Active sudoku game
├── dialogue.tsx              # Post-match story/commentary screen
└── about.tsx                 # About/legal info
```

### State Management Pattern

All game state lives in a single Zustand store (`gameStore.ts`) persisted to AsyncStorage. Components read state via selectors and mutate via actions defined in the store. There is no server-side state for gameplay — Supabase is used for auth and analytics only.

### Monetization

- **Gems**: Earned from matchdays, spent on hints. Managed in the Zustand store.
- **Premium subscription**: `$0.99/month`, product ID `premium_monthly`. Managed via RevenueCat. Required env vars: `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`.
- **Ads**: Google Mobile Ads configured in `app.json` plugins.

### Path Aliases

`@/*` resolves to the project root (configured in `tsconfig.json`).
