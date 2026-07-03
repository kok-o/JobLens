"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  User,
  BarChart3,
  Settings,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SidebarNavItem } from "./SidebarNavItem";
import { cn } from "@/lib/utils";

// =============================================================================
// Sidebar Navigation
//
// Collapsible sidebar: 240px ↔ 64px
// State managed by parent (AppShell) via Zustand filterStore
// Persisted to localStorage so it survives page refresh
// =============================================================================

const NAV_ITEMS = [
  {
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    label: "Dashboard",
  },
  {
    href: "/vacancies",
    icon: <BriefcaseBusiness className="h-4 w-4" />,
    label: "Vacancies",
  },
  {
    href: "/analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    label: "Analytics",
  },
  {
    href: "/profile",
    icon: <User className="h-4 w-4" />,
    label: "Profile",
  },
  {
    href: "/settings",
    icon: <Settings className="h-4 w-4" />,
    label: "Settings",
  },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  userEmail?: string | null;
}

export function Sidebar({ collapsed, onToggle, userEmail }: SidebarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [supabase, router]);

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r transition-[width] duration-200 ease-in-out overflow-hidden flex-shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
      style={{
        backgroundColor: "hsl(240 6% 7%)",
        borderColor: "hsl(240 5% 18%)",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header — Logo + Collapse Toggle                                     */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={cn(
          "flex items-center h-14 px-3 border-b flex-shrink-0",
          collapsed ? "justify-center" : "justify-between"
        )}
        style={{ borderColor: "hsl(240 5% 18%)" }}
      >
        {/* Logo */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: "hsl(263 70% 58%)" }}
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span
              className="text-sm font-semibold tracking-tight truncate"
              style={{ color: "hsl(0 0% 98%)" }}
            >
              AI Job Assistant
            </span>
          </div>
        )}

        {collapsed && (
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: "hsl(263 70% 58%)" }}
          >
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
        )}

        {/* Collapse toggle */}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="flex-shrink-0 rounded-md p-1.5 transition-colors hover:bg-[hsl(240_4%_14%)]"
            style={{ color: "hsl(240 4% 38%)" }}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Navigation                                                          */}
      {/* ------------------------------------------------------------------ */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Footer — User info + Sign out                                       */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="flex-shrink-0 border-t p-2"
        style={{ borderColor: "hsl(240 5% 18%)" }}
      >
        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={onToggle}
            className="flex w-full items-center justify-center rounded-md p-2 transition-colors hover:bg-[hsl(240_4%_14%)]"
            style={{ color: "hsl(240 4% 38%)" }}
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}

        {/* User info when expanded */}
        {!collapsed && (
          <div className="space-y-1">
            <div
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2"
            >
              {/* Avatar */}
              <div
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "hsl(263 70% 58% / 0.2)",
                  color: "hsl(263 70% 68%)",
                }}
              >
                {userEmail?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span
                className="flex-1 min-w-0 truncate text-xs"
                style={{ color: "hsl(240 4% 65%)" }}
              >
                {userEmail ?? "Loading..."}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs transition-colors hover:bg-[hsl(240_4%_14%)]"
              style={{ color: "hsl(240 4% 38%)" }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
