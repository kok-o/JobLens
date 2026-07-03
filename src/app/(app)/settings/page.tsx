import type { Metadata } from "next";
import { SettingsContent } from "./SettingsContent";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure AI providers, Telegram notifications, and search parameters.",
};

export default function SettingsPage() {
  return <SettingsContent />;
}
