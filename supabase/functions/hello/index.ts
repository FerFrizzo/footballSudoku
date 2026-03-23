// Example Supabase Edge Function. Add more under supabase/functions/<name>/index.ts
// Invoke from the app: supabase.functions.invoke('hello', { body: { name: 'World' } })
// See: https://supabase.com/docs/guides/functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name } = (await req.json()) as { name?: string };
    const message = `Hello, ${name ?? "World"}!`;

    // Example: use Supabase client for DB access (tables, RLS, etc.)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // e.g. const { data } = await supabase.from('your_table').select('*').limit(1);

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
