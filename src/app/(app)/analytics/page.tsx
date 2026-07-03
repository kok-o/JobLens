import type { Metadata } from "next";
import { AnalyticsContent } from "./AnalyticsContent";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Market trends, skill frequencies, and your job search analytics.",
};

export default function AnalyticsPage() {
  return <AnalyticsContent />;
}
