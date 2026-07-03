"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

// =============================================================================
// AppShell — root layout wrapper for protected pages
//
// Layout:
//   ┌──────────┬─────────────────────────┐
//   │          │ Topbar                  │
//   │ Sidebar  ├─────────────────────────┤
//   │          │ Page Content            │
//   └──────────┴─────────────────────────┘
//
// The sidebar width is controlled by CSS transition (not JS layout reflow)
// so it animates smoothly.
// =============================================================================

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
}

export function AppShell({ children, userEmail }: AppShellProps) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "hsl(240 10% 4%)" }}
    >
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        userEmail={userEmail}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <Topbar />

        {/* Page content — scrollable */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: "hsl(240 10% 4%)" }}
        >
          <div className="h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
