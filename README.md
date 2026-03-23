# Story Mode Sudoku

A freemium **Story Mode Sudoku** game set in a fully fictional football pyramid universe. Built with React Native (Expo) + TypeScript.

- **Frontend:** Expo (React Native) with expo-router
- **Data / server logic:** Supabase (auth, analytics, DB) + **Supabase Edge Functions** when you need server-side logic or DB access with secrets
- **IAP:** RevenueCat (premium entitlement)

## RevenueCat production checklist

RevenueCat **is** configured for production: in release builds (`!__DEV__`) the app uses `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` (see `src/lib/revenuecat.tsx`). The **$0.99/month price is not set in RevenueCat** — it is set in the stores:

1. **App Store Connect**  
   Create a **subscription** (or auto-renewable subscription) with:
   - **Product ID:** `premium_monthly` (must match `scripts/seedRevenueCat.ts`: `PRODUCT_IDENTIFIER`)
   - **Price:** $0.99/month (or your desired price)

2. **Google Play Console**  
   Create a **subscription** with:
   - **Product ID:** `premium_monthly` (or `premium_monthly:monthly` if you use the Play Store subscription ID format — must match `PLAY_STORE_PRODUCT_IDENTIFIER` in the seed script)
   - **Price:** $0.99/month

3. **RevenueCat dashboard**  
   - Run `npx tsx scripts/seedRevenueCat.ts` once to create the **premium** entitlement, **default** offering, and **$rc_monthly** package, and to link your App Store / Play Store apps and products.
   - In RevenueCat, the products are linked by **store identifier**; the price shown in the app comes from the store (RevenueCat returns `product.priceString` from Apple/Google).

4. **Production build env**  
   For EAS Build (or any production build), ensure the build has access to:
   - `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
   - `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`  
   (e.g. via EAS Secrets or `eas.json` env).

**How to verify the $0.99 in production:** Use a **sandbox** (iOS) or **license testing** (Android) account, install a **release** build (not Expo Go), open Settings and tap the premium subscription — the price should appear from the store. If it shows “$0.99” or the localized equivalent, the store product is configured correctly.

## Quick start

```bash
npm install
cp .env.example .env   # then fill in your values
npm start
```

## Supabase Edge Functions

When you need backend-style logic (DB with service role, secret API keys, etc.), use **Supabase Edge Functions** instead of a custom server.

- Add functions under `supabase/functions/<name>/index.ts`
- Invoke from the app: `supabase.functions.invoke('hello', { body: { ... } })`
- Local: `supabase functions serve`  
- Deploy: `supabase functions deploy <name>`

See `supabase/functions/README.md` for details.

## Legal

All content is fictional. No real leagues, clubs, or logos are used. See the in-app About screen for the full disclaimer.
