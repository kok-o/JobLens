import type { Metadata } from "next";
import { DashboardContent } from "./DashboardContent";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of your job search performance and recent vacancies.",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
