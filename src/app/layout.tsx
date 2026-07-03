import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { QueryProvider } from "@/components/shared/QueryProvider";
import "./globals.css";

// =============================================================================
// Root Layout
// =============================================================================

export const metadata: Metadata = {
  title: {
    default: "AI Job Assistant",
    template: "%s | AI Job Assistant",
  },
  description:
    "AI-powered job discovery and analysis. Automatically finds vacancies, scores them against your profile, and generates personalized cover letters.",
  keywords: ["AI", "jobs", "automation", "career", "HeadHunter", "n8n"],
  authors: [{ name: "AI Job Assistant" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "AI Job Assistant",
    description: "AI-powered job discovery and analysis.",
    siteName: "AI Job Assistant",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
