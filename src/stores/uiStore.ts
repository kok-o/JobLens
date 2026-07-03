import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_FILTERS, type VacancyFilters } from "@/types";

// =============================================================================
// UI Store — persistent UI state
//
// Stores sidebar collapse state and vacancy filters.
// Persisted to localStorage so state survives page refresh.
//
// Why Zustand over useState/Context?
// - Sidebar state is needed by multiple components (Sidebar + main content padding)
// - Filters are shared between filter UI and the vacancy list
// - Context would cause unnecessary re-renders
// - Zustand is minimal boilerplate, no provider needed
// =============================================================================

interface UIStore {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Vacancy filters
  filters: VacancyFilters;
  setFilter: <K extends keyof VacancyFilters>(
    key: K,
    value: VacancyFilters[K]
  ) => void;
  resetFilters: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // -----------------------------------------------------------------------
      // Sidebar
      // -----------------------------------------------------------------------
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // -----------------------------------------------------------------------
      // Filters
      // -----------------------------------------------------------------------
      filters: DEFAULT_FILTERS,
      setFilter: (key, value) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [key]: value,
            // Reset to page 1 when any filter changes (except page itself)
            ...(key !== "page" ? { page: 1 } : {}),
          },
        })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
    }),
    {
      name: "ai-job-assistant-ui",
      // Only persist sidebar state — filters should reset on load
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);
