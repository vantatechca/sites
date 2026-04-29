"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { User, Department } from "@/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TeamMemberStats {
  id: string
  name: string
  email: string
  role: "admin" | "manager" | "team_member"
  department: Department | null
  specialization: string | null
  avatarUrl: string | null
  isActive: boolean
  maxConcurrentProjects: number
  activeProjectCount: number
  completedProjectCount: number
  tasksCompletedThisWeek: number
  lastCheckinAt: string | null
  checkinStreak: number
  timezone: string | null
  createdAt: string
}

export interface TeamFilters {
  search?: string
  department?: Department | "all"
}

export interface CreateTeamMemberPayload {
  name: string
  email: string
  password: string
  role: "manager" | "team_member"
  department: Department
  specialization?: string
  maxConcurrentProjects: number
  timezone?: string
}

export interface UpdateTeamMemberPayload {
  name?: string
  email?: string
  role?: "manager" | "team_member"
  department?: Department
  specialization?: string
  maxConcurrentProjects?: number
  timezone?: string
  isActive?: boolean
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error")
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const teamKeys = {
  all: ["team"] as const,
  lists: () => [...teamKeys.all, "list"] as const,
  list: (filters: TeamFilters) => [...teamKeys.lists(), filters] as const,
  details: () => [...teamKeys.all, "detail"] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function getMockTeamMembers(): TeamMemberStats[] {
  return [
    {
      id: "usr_1",
      name: "Alex Rivera",
      email: "alex@siteforge.dev",
      role: "manager",
      department: "project_management",
      specialization: "E-commerce Strategy",
      avatarUrl: null,
      isActive: true,
      maxConcurrentProjects: 5,
      activeProjectCount: 4,
      completedProjectCount: 23,
      tasksCompletedThisWeek: 12,
      lastCheckinAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      checkinStreak: 14,
      timezone: "America/New_York",
      createdAt: new Date(Date.now() - 200 * 86400000).toISOString(),
    },
    {
      id: "usr_2",
      name: "Jordan Kim",
      email: "jordan@siteforge.dev",
      role: "manager",
      department: "project_management",
      specialization: "Brand Development",
      avatarUrl: null,
      isActive: true,
      maxConcurrentProjects: 4,
      activeProjectCount: 3,
      completedProjectCount: 18,
      tasksCompletedThisWeek: 8,
      lastCheckinAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      checkinStreak: 22,
      timezone: "America/Los_Angeles",
      createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
    },
    {
      id: "usr_3",
      name: "Sam Torres",
      email: "sam@siteforge.dev",
      role: "team_member",
      department: "development",
      specialization: "Shopify Liquid & React",
      avatarUrl: null,
      isActive: true,
      maxConcurrentProjects: 5,
      activeProjectCount: 5,
      completedProjectCount: 31,
      tasksCompletedThisWeek: 15,
      lastCheckinAt: new Date(Date.now() - 0.5 * 3600000).toISOString(),
      checkinStreak: 30,
      timezone: "America/Chicago",
      createdAt: new Date(Date.now() - 300 * 86400000).toISOString(),
    },
    {
      id: "usr_4",
      name: "Chris Lee",
      email: "chris@siteforge.dev",
      role: "team_member",
      department: "design",
      specialization: "UI/UX & Figma",
      avatarUrl: null,
      isActive: true,
      maxConcurrentProjects: 4,
      activeProjectCount: 2,
      completedProjectCount: 15,
      tasksCompletedThisWeek: 6,
      lastCheckinAt: null,
      checkinStreak: 0,
      timezone: "America/New_York",
      createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
    },
    {
      id: "usr_5",
      name: "Taylor Morgan",
      email: "taylor@siteforge.dev",
      role: "team_member",
      department: "content",
      specialization: "SEO & Copywriting",
      avatarUrl: null,
      isActive: true,
      maxConcurrentProjects: 3,
      activeProjectCount: 3,
      completedProjectCount: 27,
      tasksCompletedThisWeek: 10,
      lastCheckinAt: new Date(Date.now() - 26 * 3600000).toISOString(),
      checkinStreak: 5,
      timezone: "Europe/London",
      createdAt: new Date(Date.now() - 250 * 86400000).toISOString(),
    },
    {
      id: "usr_6",
      name: "Morgan Park",
      email: "morgan@siteforge.dev",
      role: "team_member",
      department: "qa",
      specialization: "Cross-browser & Performance Testing",
      avatarUrl: null,
      isActive: true,
      maxConcurrentProjects: 3,
      activeProjectCount: 1,
      completedProjectCount: 40,
      tasksCompletedThisWeek: 4,
      lastCheckinAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      checkinStreak: 8,
      timezone: "America/Denver",
      createdAt: new Date(Date.now() - 350 * 86400000).toISOString(),
    },
    {
      id: "usr_7",
      name: "Jamie Reyes",
      email: "jamie@siteforge.dev",
      role: "team_member",
      department: "development",
      specialization: "Node.js & API Integrations",
      avatarUrl: null,
      isActive: true,
      maxConcurrentProjects: 4,
      activeProjectCount: 3,
      completedProjectCount: 20,
      tasksCompletedThisWeek: 11,
      lastCheckinAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      checkinStreak: 12,
      timezone: "America/New_York",
      createdAt: new Date(Date.now() - 160 * 86400000).toISOString(),
    },
  ]
}

// ---------------------------------------------------------------------------
// useTeam - fetch team members with filters
// ---------------------------------------------------------------------------

export function useTeam(filters: TeamFilters = {}) {
  return useQuery<TeamMemberStats[]>({
    queryKey: teamKeys.list(filters),
    queryFn: async () => {
      try {
        const params = new URLSearchParams()
        if (filters.search) params.set("search", filters.search)
        if (filters.department && filters.department !== "all")
          params.set("department", filters.department)
        const qs = params.toString()
        const data = await fetchJSON<TeamMemberStats[] | { team?: TeamMemberStats[]; users?: TeamMemberStats[] }>(
          `/api/team${qs ? `?${qs}` : ""}`
        )
        // API may return either an array or an envelope { team: [...] }
        if (Array.isArray(data)) return data
        return data.team ?? data.users ?? []
      } catch {
        // No mock fallback — return empty list
        return []
      }
    },
    staleTime: 30_000,
  })
}

// ---------------------------------------------------------------------------
// useTeamMember - fetch single member with stats
// ---------------------------------------------------------------------------

export function useTeamMember(id: string) {
  return useQuery<TeamMemberStats>({
    queryKey: teamKeys.detail(id),
    queryFn: async () => {
      try {
        return await fetchJSON<TeamMemberStats>(`/api/team/${id}`)
      } catch {
        const mock = getMockTeamMembers().find((m) => m.id === id)
        if (mock) return mock
        throw new Error("Team member not found")
      }
    },
    enabled: !!id,
    staleTime: 30_000,
  })
}

// ---------------------------------------------------------------------------
// useCreateTeamMember - mutation for POST /api/team
// ---------------------------------------------------------------------------

export function useCreateTeamMember() {
  const queryClient = useQueryClient()

  return useMutation<TeamMemberStats, Error, CreateTeamMemberPayload>({
    mutationFn: async (payload) => {
      return fetchJSON<TeamMemberStats>("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() })
    },
  })
}

// ---------------------------------------------------------------------------
// useUpdateTeamMember - mutation for PATCH /api/team/:id
// ---------------------------------------------------------------------------

export function useUpdateTeamMember(id: string) {
  const queryClient = useQueryClient()

  return useMutation<TeamMemberStats, Error, UpdateTeamMemberPayload>({
    mutationFn: async (payload) => {
      return fetchJSON<TeamMemberStats>(`/api/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() })
    },
  })
}
