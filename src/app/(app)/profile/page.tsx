import type { Metadata } from "next";
import { ProfileContent } from "./ProfileContent";

export const metadata: Metadata = {
  title: "Profile",
  description: "Edit your profile — skills, experience, and preferences used for AI scoring.",
};

export default function ProfilePage() {
  return <ProfileContent />;
}
