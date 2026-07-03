import type { Metadata } from "next";
import { VacancyDetailContent } from "./VacancyDetailContent";

export const metadata: Metadata = {
  title: "Vacancy Detail",
  description: "AI analysis, job details, and cover letter for this vacancy.",
};

interface VacancyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function VacancyDetailPage({ params }: VacancyDetailPageProps) {
  const { id } = await params;
  return <VacancyDetailContent id={id} />;
}
