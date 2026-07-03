"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// =============================================================================
// SidebarNavItem — single navigation link in the sidebar
// Shows icon always. Shows label when sidebar is expanded.
// Active state uses violet accent background.
// =============================================================================

interface SidebarNavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  badge?: number; // e.g. new vacancy count
}

export function SidebarNavItem({
  href,
  icon,
  label,
  collapsed,
  badge,
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm",
        "transition-all duration-150 relative",
        isActive
          ? "bg-[hsl(263_70%_58%/0.15)] text-[hsl(263_70%_58%)]"
          : "text-[hsl(240_4%_65%)] hover:bg-[hsl(240_4%_14%)] hover:text-[hsl(0_0%_98%)]"
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full"
          style={{ backgroundColor: "hsl(263 70% 58%)" }}
        />
      )}

      {/* Icon */}
      <span className={cn("flex-shrink-0", isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100")}>
        {icon}
      </span>

      {/* Label — hidden when collapsed */}
      {!collapsed && (
        <span className="flex-1 min-w-0 truncate font-medium">{label}</span>
      )}

      {/* Badge */}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span
          className="flex-shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium"
          style={{
            backgroundColor: "hsl(263 70% 58% / 0.2)",
            color: "hsl(263 70% 68%)",
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
