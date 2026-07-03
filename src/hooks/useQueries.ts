"use client";
// =============================================================================
// TanStack Query Hooks — vacancies, dashboard, profile, analytics
// =============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ApiSuccess, DashboardStats, Vacancy, VacancyFilters, Profile, Settings } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: "Request failed" } }));
    throw new Error(err?.error?.message ?? "Request failed");
  }
  const json = await res.json() as ApiSuccess<T>;
  return json.data;
}

function buildVacancyUrl(filters: Partial<VacancyFilters>): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.scoreMin !== undefined && filters.scoreMin > 0) params.set("score_min", String(filters.scoreMin));
  if (filters.scoreMax !== undefined && filters.scoreMax < 100) params.set("score_max", String(filters.scoreMax));
  if (filters.workFormats?.length) params.set("work_format", filters.workFormats.join(","));
  if (filters.statuses?.length) params.set("status", filters.statuses.join(","));
  if (filters.isFavorite !== null && filters.isFavorite !== undefined) params.set("is_favorite", String(filters.isFavorite));
  if (filters.cities?.length) params.set("city", filters.cities.join(","));
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  return `/api/vacancies?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Vacancies
// ---------------------------------------------------------------------------

export interface VacancyListResponse {
  data: Vacancy[];
  meta: { total: number; page: number; limit: number; hasMore: boolean };
}

export function useVacancies(filters: Partial<VacancyFilters> = {}) {
  return useQuery({
    queryKey: ["vacancies", filters],
    queryFn: async () => {
      const url = buildVacancyUrl(filters);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch vacancies");
      return res.json() as Promise<VacancyListResponse>;
    },
  });
}

export function useVacancy(id: string | null) {
  return useQuery({
    queryKey: ["vacancy", id],
    queryFn: () => fetcher<Vacancy>(`/api/vacancies/${id}`),
    enabled: !!id,
  });
}

// Optimistic favorite toggle
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const res = await fetch(`/api/vacancies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !isFavorite }),
      });
      if (!res.ok) throw new Error("Failed to update favorite");
      return res.json();
    },
    onMutate: async ({ id, isFavorite }) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ["vacancies"] });
      // Optimistically update the detail cache
      queryClient.setQueryData(["vacancy", id], (old: Vacancy | undefined) =>
        old ? { ...old, isFavorite: !isFavorite } : old
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
    },
  });
}

// Update vacancy status
export function useUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/vacancies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["vacancy", id] });
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetcher<DashboardStats>("/api/dashboard/stats"),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 min in background
  });
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => fetcher<Profile>("/api/profile"),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => fetcher<Settings>("/api/settings"),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Settings>) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ---------------------------------------------------------------------------
// Cover letter
// ---------------------------------------------------------------------------

export function useGenerateCoverLetter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vacancyId: string) => {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vacancyId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? "Failed to generate cover letter");
      }
      return res.json() as Promise<{ data: { coverLetter: string } }>;
    },
    onSuccess: (_, vacancyId) => {
      queryClient.invalidateQueries({ queryKey: ["vacancy", vacancyId] });
      toast.success("Cover letter generated!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetcher("/api/analytics/overview"),
    staleTime: 10 * 60 * 1000, // Analytics can be stale for 10 min
  });
}
