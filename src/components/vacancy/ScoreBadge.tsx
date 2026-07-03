"use client";

// =============================================================================
// ScoreBadge — SVG circular progress ring
//
// The primary visual "wow" element. Color-coded by score range.
// Props: score (0-100), size ("sm" | "md" | "lg"), showLabel
// =============================================================================

import { scoreToVariant, scoreToLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

const SCORE_COLORS = {
  high: { stroke: "hsl(142 71% 45%)", text: "hsl(142 71% 45%)" },    // green
  mid: { stroke: "hsl(38 92% 50%)", text: "hsl(38 92% 50%)" },        // amber
  low: { stroke: "hsl(0 72% 51%)", text: "hsl(0 72% 51%)" },          // red
  unknown: { stroke: "hsl(240 4% 38%)", text: "hsl(240 4% 38%)" },    // gray
} as const;

const SIZE_MAP = {
  sm: { size: 40, strokeWidth: 3, fontSize: "9px", labelSize: "9px" },
  md: { size: 56, strokeWidth: 3.5, fontSize: "12px", labelSize: "10px" },
  lg: { size: 80, strokeWidth: 4, fontSize: "16px", labelSize: "11px" },
} as const;

interface ScoreBadgeProps {
  score: number | null | undefined;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  animate?: boolean;
}

export function ScoreBadge({
  score,
  size = "md",
  showLabel = false,
  className,
  animate = true,
}: ScoreBadgeProps) {
  const variant = scoreToVariant(score);
  const colors = SCORE_COLORS[variant];
  const dims = SIZE_MAP[size];

  const radius = (dims.size - dims.strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score != null ? Math.max(0, Math.min(100, score)) : 0;
  const dashOffset = circumference - (progress / 100) * circumference;
  const cx = dims.size / 2;
  const cy = dims.size / 2;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <svg
        width={dims.size}
        height={dims.size}
        viewBox={`0 0 ${dims.size} ${dims.size}`}
        role="img"
        aria-label={`Match score: ${score ?? "unknown"} out of 100`}
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="hsl(240 5% 18%)"
          strokeWidth={dims.strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={dims.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={
            animate
              ? {
                  transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                }
              : undefined
          }
        />
        {/* Score text */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={dims.fontSize}
          fontWeight="700"
          fill={colors.text}
          style={{ fontFamily: "var(--font-sans, system-ui)" }}
        >
          {score != null ? score : "—"}
        </text>
      </svg>
      {showLabel && (
        <span
          className="text-center leading-tight"
          style={{ fontSize: dims.labelSize, color: colors.text }}
        >
          {scoreToLabel(score)}
        </span>
      )}
    </div>
  );
}
