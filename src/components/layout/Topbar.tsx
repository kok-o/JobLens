"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Topbar — breadcrumb navigation + right-side actions
// Sits at the top of each protected page
// =============================================================================

// Route label map — maps pathname segments to display names
const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  vacancies: "Vacancies",
  analytics: "Analytics",
  profile: "Profile",
  settings: "Settings",
};

interface TopbarProps {
  className?: string;
}

export function Topbar({ className }: TopbarProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb items from path segments
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    // Shorten UUIDs/IDs in breadcrumbs
    const label =
      ROUTE_LABELS[segment] ??
      (segment.length > 12 ? `${segment.slice(0, 8)}…` : segment);
    return { href, label };
  });

  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between px-4 border-b flex-shrink-0",
        className
      )}
      style={{
        backgroundColor: "hsl(240 10% 4%)",
        borderColor: "hsl(240 5% 18%)",
      }}
    >
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.href} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 flex-shrink-0"
                  style={{ color: "hsl(240 4% 38%)" }}
                />
              )}
              <span
                className={cn(
                  "text-sm",
                  index === breadcrumbs.length - 1
                    ? "font-medium"
                    : "transition-colors hover:text-[hsl(0_0%_98%)]"
                )}
                style={{
                  color:
                    index === breadcrumbs.length - 1
                      ? "hsl(0 0% 98%)"
                      : "hsl(240 4% 65%)",
                }}
              >
                {crumb.label}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Notification bell — functional in Phase 3 */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[hsl(240_4%_14%)]"
          style={{ color: "hsl(240 4% 38%)" }}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
