"use client";

// =============================================================================
// SkillTag — pill badge for skills
//
// Variants: required, nice, missing, tech, neutral
// =============================================================================

import { cn } from "@/lib/utils";

type SkillVariant = "required" | "nice" | "missing" | "tech" | "neutral";

const VARIANT_STYLES: Record<SkillVariant, { bg: string; text: string; border: string }> = {
  required: {
    bg: "hsl(263 70% 58% / 0.12)",
    text: "hsl(263 70% 75%)",
    border: "hsl(263 70% 58% / 0.3)",
  },
  nice: {
    bg: "hsl(217 91% 60% / 0.1)",
    text: "hsl(217 91% 70%)",
    border: "hsl(217 91% 60% / 0.25)",
  },
  missing: {
    bg: "hsl(0 72% 51% / 0.1)",
    text: "hsl(0 72% 65%)",
    border: "hsl(0 72% 51% / 0.3)",
  },
  tech: {
    bg: "hsl(38 92% 50% / 0.1)",
    text: "hsl(38 92% 60%)",
    border: "hsl(38 92% 50% / 0.3)",
  },
  neutral: {
    bg: "hsl(240 4% 14%)",
    text: "hsl(240 4% 65%)",
    border: "hsl(240 5% 22%)",
  },
};

interface SkillTagProps {
  label: string;
  variant?: SkillVariant;
  className?: string;
  onClick?: () => void;
}

export function SkillTag({ label, variant = "neutral", className, onClick }: SkillTagProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border transition-opacity",
        onClick && "cursor-pointer hover:opacity-80",
        className
      )}
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        borderColor: styles.border,
      }}
      onClick={onClick}
    >
      {label}
    </span>
  );
}
