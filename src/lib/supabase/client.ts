import { createBrowserClient } from "@supabase/ssr";

// =============================================================================
// Supabase Browser Client
//
// Used in Client Components ("use client") for:
// - Auth state (listening to session changes)
// - Realtime subscriptions (future)
//
// Creates a new client each call — this is intentional for SSR compatibility.
// @supabase/ssr handles cookie sync automatically.
// =============================================================================

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
