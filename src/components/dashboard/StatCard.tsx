// =============================================================================
// StatCard — Dashboard metric card
//
// Shows: large value, label, trend delta (±N vs yesterday)
// =============================================================================

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number | null;
  deltaLabel?: string;
  highlight?: boolean;
  subtitle?: string;
  className?: string;
}

function DeltaBadge({ delta, label }: { delta: number; label?: string }) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  const color = isNeutral
    ? "hsl(240 4% 38%)"
    : isPositive
      ? "hsl(142 71% 45%)"
      : "hsl(0 72% 51%)";

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="flex items-center gap-1" style={{ color }}>
      <Icon className="h-3 w-3" />
      <span className="text-xs font-medium">
        {isPositive ? "+" : ""}{delta} {label ?? "vs yesterday"}
      </span>
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  highlight,
  subtitle,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-4 transition-colors hover:border-[hsl(240_5%_22%)]",
        className
      )}
      style={{
        backgroundColor: "hsl(240 6% 7%)",
        borderColor: highlight ? "hsl(263 70% 58% / 0.4)" : "hsl(240 5% 18%)",
        boxShadow: highlight ? "0 0 0 1px hsl(263 70% 58% / 0.1) inset" : undefined,
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(240 4% 38%)" }}>
        {label}
      </p>
      <p
        className="text-3xl font-bold leading-none tracking-tight"
        style={{ color: highlight ? "hsl(263 70% 68%)" : "hsl(0 0% 98%)" }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-xs truncate" style={{ color: "hsl(240 4% 65%)" }}>
          {subtitle}
        </p>
      )}
      {delta !== null && delta !== undefined && (
        <DeltaBadge delta={delta} label={deltaLabel} />
      )}
    </div>
  );
}
