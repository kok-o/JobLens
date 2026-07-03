import type { Metadata } from "next";
import { VacanciesContent } from "./VacanciesContent";

export const metadata: Metadata = {
  title: "Vacancies",
  description: "Browse and filter AI-analyzed job vacancies.",
};

export default function VacanciesPage() {
  return <VacanciesContent />;
}
