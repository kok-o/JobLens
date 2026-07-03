import { redirect } from "next/navigation";

// Root page — immediately redirect to dashboard.
// The middleware handles the auth check before we get here,
// so if we're here, the user is authenticated.
export default function RootPage() {
  redirect("/dashboard");
}
