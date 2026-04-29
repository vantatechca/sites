"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { CheckinStatus, Department } from "@/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaskUpdate {
  taskId: string
  taskTitle: string
  previousStatus: string
  newStatus: string
}

export interface CheckinEntry {
  id: string
  userId: string
  userName: string
  userAvatarUrl: string | null
  userDepartment: Department | null
  checkinDate: string
  submittedAt: string
  status: CheckinStatus
  rawResponse: string
  aiSummary: string | null
  taskUpdates: TaskUpdate[]
  hoursLogged: number | null
  blockers: string[]
  confidenceScore: number | null
  reviewedById: string | null
  reviewedByName: string | null
  reviewNotes: string | null
}

export interface CheckinSummary {
  totalTeamMembers: number
  checkedInCount: number
  blockersReported: number
  tasksUpdated: number
}

export interface SubmitCheckinPayload {
  response: string
}

export interface CheckinResult {
  checkin: CheckinEntry
  summary: string
  taskUpdates: TaskUpdate[]
  hoursLogged: number | null
  blockers: string[]
  confidenceScore: number
}

export interface UserProjectContext {
  projectId: string
  projectName: string
  currentPhase: string
  taskCount: number
  completedTaskCount: number
  recentActivity: string
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

export const checkinKeys = {
  all: ["checkins"] as const,
  lists: () => [...checkinKeys.all, "list"] as const,
  list: (date: string, userId?: string) =>
    [...checkinKeys.lists(), date, userId] as const,
  mine: (date: string) => [...checkinKeys.all, "mine", date] as const,
  summary: (date: string) => [...checkinKeys.all, "summary", date] as const,
  context: () => [...checkinKeys.all, "context"] as const,
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function getMockCheckins(date: string): CheckinEntry[] {
  return [
    {
      id: "chk_1",
      userId: "usr_1",
      userName: "Alex Rivera",
      userAvatarUrl: null,
      userDepartment: "project_management",
      checkinDate: date,
      submittedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      status: "ai_processed",
      rawResponse:
        "Worked on Artisan Candles design review and coordinated with the dev team on FitGear Pro timeline. Had a client meeting for Brew Masters launch prep. Blocker: waiting on brand assets from Artisan Candles client.",
      aiSummary:
        "Progressed on 3 projects. Conducted design review for Artisan Candles, coordinated FitGear Pro development timeline, and held Brew Masters launch prep meeting. One blocker: pending brand assets from the Artisan Candles client.",
      taskUpdates: [
        {
          taskId: "task_12",
          taskTitle: "Design review meeting",
          previousStatus: "in_progress",
          newStatus: "completed",
        },
        {
          taskId: "task_15",
          taskTitle: "Dev timeline coordination",
          previousStatus: "not_started",
          newStatus: "in_progress",
        },
      ],
      hoursLogged: 7.5,
      blockers: ["Waiting on brand assets from Artisan Candles client"],
      confidenceScore: 0.92,
      reviewedById: null,
      reviewedByName: null,
      reviewNotes: null,
    },
    {
      id: "chk_2",
      userId: "usr_3",
      userName: "Sam Torres",
      userAvatarUrl: null,
      userDepartment: "development",
      checkinDate: date,
      submittedAt: new Date(Date.now() - 0.5 * 3600000).toISOString(),
      status: "ai_processed",
      rawResponse:
        "Built the product filtering component for FitGear Pro and fixed a cart bug on Urban Threads. Started the subscription integration for Brew Masters. No blockers today, everything is moving smoothly.",
      aiSummary:
        "Completed product filtering for FitGear Pro, resolved cart bug on Urban Threads, and started Brew Masters subscription integration. No blockers reported.",
      taskUpdates: [
        {
          taskId: "task_22",
          taskTitle: "Product filtering component",
          previousStatus: "in_progress",
          newStatus: "completed",
        },
        {
          taskId: "task_28",
          taskTitle: "Cart calculation bug fix",
          previousStatus: "in_progress",
          newStatus: "completed",
        },
        {
          taskId: "task_31",
          taskTitle: "Subscription integration",
          previousStatus: "not_started",
          newStatus: "in_progress",
        },
      ],
      hoursLogged: 8,
      blockers: [],
      confidenceScore: 0.96,
      reviewedById: null,
      reviewedByName: null,
      reviewNotes: null,
    },
    {
      id: "chk_3",
      userId: "usr_5",
      userName: "Taylor Morgan",
      userAvatarUrl: null,
      userDepartment: "content",
      checkinDate: date,
      submittedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      status: "reviewed",
      rawResponse:
        "Wrote product descriptions for PetPals (25 products done). Working on SEO metadata for Urban Threads. Blocker: need high-res product images from PetPals client for the remaining 15 products.",
      aiSummary:
        "Completed 25 product descriptions for PetPals and progressed on Urban Threads SEO metadata. Blocked on remaining 15 PetPals descriptions due to missing high-res product images from the client.",
      taskUpdates: [
        {
          taskId: "task_40",
          taskTitle: "Product descriptions batch 1",
          previousStatus: "in_progress",
          newStatus: "completed",
        },
        {
          taskId: "task_41",
          taskTitle: "SEO metadata setup",
          previousStatus: "not_started",
          newStatus: "in_progress",
        },
      ],
      hoursLogged: 6.5,
      blockers: [
        "Need high-res product images from PetPals client for remaining 15 products",
      ],
      confidenceScore: 0.89,
      reviewedById: "usr_2",
      reviewedByName: "Jordan Kim",
      reviewNotes: "Good progress. Following up with PetPals client on images.",
    },
    {
      id: "chk_4",
      userId: "usr_7",
      userName: "Jamie Reyes",
      userAvatarUrl: null,
      userDepartment: "development",
      checkinDate: date,
      submittedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      status: "ai_processed",
      rawResponse:
        "Set up the payment gateway for Brew Masters and tested the checkout flow. Worked on API integrations for FitGear Pro inventory sync. No blockers.",
      aiSummary:
        "Configured payment gateway and tested checkout for Brew Masters. Progressed on FitGear Pro inventory sync API integration. No blockers.",
      taskUpdates: [
        {
          taskId: "task_50",
          taskTitle: "Payment gateway setup",
          previousStatus: "in_progress",
          newStatus: "completed",
        },
        {
          taskId: "task_52",
          taskTitle: "Inventory sync API",
          previousStatus: "not_started",
          newStatus: "in_progress",
        },
      ],
      hoursLogged: 7,
      blockers: [],
      confidenceScore: 0.94,
      reviewedById: null,
      reviewedByName: null,
      reviewNotes: null,
    },
  ]
}

function getMockProjectContext(): UserProjectContext[] {
  return [
    {
      projectId: "proj_1",
      projectName: "Artisan Candles Store",
      currentPhase: "Design",
      taskCount: 12,
      completedTaskCount: 4,
      recentActivity: "Design mockups uploaded 2 days ago",
    },
    {
      projectId: "proj_5",
      projectName: "Brew Masters Coffee",
      currentPhase: "Launch Prep",
      taskCount: 8,
      completedTaskCount: 7,
      recentActivity: "Final QA checklist completed yesterday",
    },
    {
      projectId: "proj_3",
      projectName: "PetPals Supplies",
      currentPhase: "Content",
      taskCount: 15,
      completedTaskCount: 8,
      recentActivity: "Product descriptions added 1 day ago",
    },
  ]
}

// ---------------------------------------------------------------------------
// useCheckins - fetch check-ins for a date
// ---------------------------------------------------------------------------

export function useCheckins(date: string, userId?: string) {
  return useQuery<CheckinEntry[]>({
    queryKey: checkinKeys.list(date, userId),
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ date })
        if (userId) params.set("userId", userId)
        const data = await fetchJSON<
          CheckinEntry[] | { checkins?: CheckinEntry[] }
        >(`/api/checkins?${params}`)
        if (Array.isArray(data)) return data
        return data.checkins ?? []
      } catch {
        // No mock fallback — return empty list
        return []
      }
    },
    staleTime: 30_000,
  })
}

// ---------------------------------------------------------------------------
// useCheckinSummary - summary stats for a date
// ---------------------------------------------------------------------------

export function useCheckinSummary(date: string) {
  return useQuery<CheckinSummary>({
    queryKey: checkinKeys.summary(date),
    queryFn: async () => {
      try {
        return await fetchJSON<CheckinSummary>(
          `/api/checkins/summary?date=${date}`
        )
      } catch {
        const checkins = getMockCheckins(date)
        return {
          totalTeamMembers: 7,
          checkedInCount: checkins.length,
          blockersReported: checkins.reduce(
            (acc, c) => acc + c.blockers.length,
            0
          ),
          tasksUpdated: checkins.reduce(
            (acc, c) => acc + c.taskUpdates.length,
            0
          ),
        }
      }
    },
    staleTime: 30_000,
  })
}

// ---------------------------------------------------------------------------
// useMyCheckin - current user's check-in for a date
// ---------------------------------------------------------------------------

export function useMyCheckin(date: string) {
  return useQuery<CheckinEntry | null>({
    queryKey: checkinKeys.mine(date),
    queryFn: async () => {
      try {
        return await fetchJSON<CheckinEntry | null>(
          `/api/checkins/mine?date=${date}`
        )
      } catch {
        return null
      }
    },
    staleTime: 30_000,
  })
}

// ---------------------------------------------------------------------------
// useMyProjectContext - user's assigned projects for checkin context
// ---------------------------------------------------------------------------

export function useMyProjectContext() {
  return useQuery<UserProjectContext[]>({
    queryKey: checkinKeys.context(),
    queryFn: async () => {
      try {
        return await fetchJSON<UserProjectContext[]>(
          "/api/checkins/context"
        )
      } catch {
        return getMockProjectContext()
      }
    },
    staleTime: 60_000,
  })
}

// ---------------------------------------------------------------------------
// useSubmitCheckin - mutation that submits + triggers AI processing
// ---------------------------------------------------------------------------

export function useSubmitCheckin() {
  const queryClient = useQueryClient()

  return useMutation<CheckinResult, Error, SubmitCheckinPayload>({
    mutationFn: async (payload) => {
      return fetchJSON<CheckinResult>("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkinKeys.all })
    },
  })
}
