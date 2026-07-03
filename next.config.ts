import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // HeadHunter company logos
        protocol: "https",
        hostname: "**hhcdn.ru",
      },
      {
        // Supabase storage
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        // General CDN logos (RemoteOK, etc.)
        protocol: "https",
        hostname: "remoteok.com",
      },
    ],
  },
  // Expose non-secret env vars to the client where needed
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default nextConfig;
