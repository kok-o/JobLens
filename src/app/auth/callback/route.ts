import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Supabase Auth Callback Route (/auth/callback)
//
// Supabase redirects here after the user clicks the magic link in their email.
// This route exchanges the authorization code for a user session.
// =============================================================================

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, redirect to login with an error indicator
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
