"use client";

// =============================================================================
// EmptyState — Zero-data placeholder component
// =============================================================================

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border py-16 px-6 text-center",
        className
      )}
      style={{ backgroundColor: "hsl(240 6% 7%)", borderColor: "hsl(240 5% 18%)" }}
    >
      {Icon && (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full mb-4"
          style={{ backgroundColor: "hsl(263 70% 58% / 0.1)" }}
        >
          <Icon className="h-6 w-6" style={{ color: "hsl(263 70% 58%)" }} />
        </div>
      )}
      <h3 className="text-sm font-semibold mb-1" style={{ color: "hsl(0 0% 98%)" }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-xs" style={{ color: "hsl(240 4% 38%)" }}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: "hsl(263 70% 58%)", color: "hsl(0 0% 100%)" }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
