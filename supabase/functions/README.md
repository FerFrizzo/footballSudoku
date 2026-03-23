# Supabase Edge Functions

Server-side logic runs here instead of a custom backend. Use Edge Functions when you need:

- Database access with the service role (bypass RLS) or complex queries
- Secret API keys (e.g. calling external APIs)
- Validation or transformation before writing to the DB

## Invoke from the app

```ts
import { supabase } from '@/src/services/supabase';

const { data, error } = await supabase.functions.invoke('hello', {
  body: { name: 'World' },
});
```

## Local development

1. Install Supabase CLI: https://supabase.com/docs/guides/cli
2. From project root: `supabase functions serve`
3. Functions are available at `http://localhost:54321/functions/v1/<function-name>`
4. Set `EXPO_PUBLIC_SUPABASE_URL` to `http://localhost:54321` (or your project URL) when testing

## Deploy

```bash
supabase functions deploy hello
# or deploy all: supabase functions deploy
```

Environment secrets (e.g. `SUPABASE_SERVICE_ROLE_KEY`) are set in the Supabase dashboard under Project Settings → Edge Functions.
