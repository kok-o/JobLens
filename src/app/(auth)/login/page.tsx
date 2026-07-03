"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Sparkles, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Login Page — Magic Link Auth
// Design: split layout — form left, visual right
// Aesthetic: Vercel login × Linear onboarding
// =============================================================================

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ------------------------------------------------------------------ */}
      {/* Left — Form                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="flex flex-col justify-between p-8 lg:p-12"
        style={{ backgroundColor: "hsl(240 10% 4%)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: "hsl(263 70% 58%)" }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: "hsl(0 0% 98%)" }}
          >
            AI Job Assistant
          </span>
        </div>

        {/* Form */}
        <div className="mx-auto w-full max-w-sm animate-fade-up">
          {!sent ? (
            <>
              <div className="mb-8">
                <h1
                  className="text-2xl font-semibold tracking-tight mb-2"
                  style={{ color: "hsl(0 0% 98%)" }}
                >
                  Welcome back
                </h1>
                <p className="text-sm" style={{ color: "hsl(240 4% 65%)" }}>
                  Enter your email to receive a magic link. No password needed.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-xs font-medium"
                    style={{ color: "hsl(240 4% 65%)" }}
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                      style={{ color: "hsl(240 4% 38%)" }}
                    />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      autoFocus
                      className={cn(
                        "w-full rounded-lg pl-9 pr-4 py-2.5 text-sm",
                        "transition-all duration-150",
                        "placeholder:text-[hsl(240_4%_38%)]"
                      )}
                      style={{
                        backgroundColor: "hsl(240 6% 7%)",
                        border: "1px solid hsl(240 5% 18%)",
                        color: "hsl(0 0% 98%)",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "hsl(263 70% 58%)";
                        e.target.style.boxShadow = "0 0 0 3px hsl(263 70% 58% / 0.15)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "hsl(240 5% 18%)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs" style={{ color: "hsl(0 72% 51%)" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className={cn(
                    "w-full flex items-center justify-center gap-2",
                    "rounded-lg py-2.5 px-4 text-sm font-medium",
                    "transition-all duration-150",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  style={{
                    backgroundColor: "hsl(263 70% 58%)",
                    color: "white",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = "hsl(263 70% 52%)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "hsl(263 70% 58%)";
                  }}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Continue with email
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-xs text-center" style={{ color: "hsl(240 4% 38%)" }}>
                By continuing, you agree to our{" "}
                <span style={{ color: "hsl(263 70% 58%)" }} className="cursor-pointer hover:underline">
                  Terms of Service
                </span>
              </p>
            </>
          ) : (
            /* Success state */
            <div className="text-center animate-fade-up">
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: "hsl(142 71% 45% / 0.15)" }}
              >
                <CheckCircle2 className="h-6 w-6" style={{ color: "hsl(142 71% 45%)" }} />
              </div>
              <h2
                className="text-xl font-semibold mb-2"
                style={{ color: "hsl(0 0% 98%)" }}
              >
                Check your email
              </h2>
              <p className="text-sm mb-1" style={{ color: "hsl(240 4% 65%)" }}>
                We sent a magic link to
              </p>
              <p className="text-sm font-medium mb-6" style={{ color: "hsl(0 0% 98%)" }}>
                {email}
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-xs hover:underline"
                style={{ color: "hsl(240 4% 38%)" }}
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs" style={{ color: "hsl(240 4% 38%)" }}>
          AI Job Assistant © {new Date().getFullYear()}
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right — Visual (hidden on mobile)                                   */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="hidden lg:flex flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ backgroundColor: "hsl(240 6% 7%)" }}
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, hsl(263 70% 58% / 0.12) 0%, transparent 70%)",
          }}
        />

        {/* Feature list */}
        <div className="relative z-10 max-w-xs space-y-6">
          <div className="space-y-2">
            <h2
              className="text-xl font-semibold tracking-tight"
              style={{ color: "hsl(0 0% 98%)" }}
            >
              Your AI-powered career assistant
            </h2>
            <p className="text-sm" style={{ color: "hsl(240 4% 65%)" }}>
              Automatically finds, analyzes, and scores job vacancies — so you
              can focus on what matters.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: "🔍",
                label: "Automatic discovery",
                desc: "Scans HeadHunter and other sources every 4 hours",
              },
              {
                icon: "🤖",
                label: "AI analysis",
                desc: "Scores each vacancy against your profile from 0 to 100",
              },
              {
                icon: "✉️",
                label: "Cover letters",
                desc: "Generates personalized drafts in one click",
              },
              {
                icon: "📊",
                label: "Analytics",
                desc: "Tracks trends across the market and your applications",
              },
            ].map((feature) => (
              <div key={feature.label} className="flex gap-3">
                <span className="text-lg mt-0.5">{feature.icon}</span>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "hsl(0 0% 98%)" }}
                  >
                    {feature.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(240 4% 65%)" }}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
