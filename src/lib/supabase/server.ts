import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// =============================================================================
// Supabase Server Client
//
// Used in:
// - Server Components (RSC)
// - API Route Handlers
// - Middleware (see middleware.ts — uses a different pattern there)
//
// Reads and writes cookies via Next.js `next/headers` cookies() API.
// This is what allows the session to persist between server requests.
// =============================================================================

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component where cookies are read-only.
            // This is safe to ignore — the middleware handles session refresh.
          }
        },
      },
    }
  );
}
