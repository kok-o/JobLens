import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "sonner";

// =============================================================================
// Protected App Layout
//
// This layout wraps all routes in the (app) group:
//   /dashboard, /vacancies, /profile, /analytics, /settings
//
// Responsibilities:
// 1. Verify the user is authenticated (double-check after middleware)
// 2. Pass user email to the shell for display
// 3. Wrap content in AppShell (sidebar + topbar)
// 4. Render toast stack (Sonner)
//
// Note: Middleware already redirects unauthenticated users to /login.
// This is a defense-in-depth check.
// =============================================================================

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell userEmail={user.email}>
      {children}
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "hsl(240 5% 11%)",
            border: "1px solid hsl(240 5% 18%)",
            color: "hsl(0 0% 98%)",
          },
        }}
      />
    </AppShell>
  );
}
