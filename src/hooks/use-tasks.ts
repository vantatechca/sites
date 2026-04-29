"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { projectKeys } from "@/hooks/use-projects"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaskData {
  id: string
  projectId: string
  templateTaskId: string | null
  phaseName: string
  name: string
  description: string | null
  status: "not_started" | "in_progress" | "completed" | "skipped" | "blocked"
  assignedTo: string | null
  estimatedHours: string | null
  actualHours: string
  isMilestone: boolean
  clientVisible: boolean
  clientLabel: string | null
  clientStatusOverride: string | null
  tierApplicable: boolean
  dependsOn: string[] | null
  sortOrder: number
  completedAt: string | null
  completedBy: string | null
  notes: string | null
  attachments: Array<{ name: string; url: string; type: string }> | null
  createdAt: string
  updatedAt: string
}

export interface TasksByPhase {
  [phaseName: string]: TaskData[]
}

export interface TaskUpdatePayload {
  status?: string
  assigned_to?: string | null
  actual_hours?: number
  notes?: string | null
  client_visible?: boolean
  client_label?: string | null
  name?: string
  description?: string | null
  estimated_hours?: number | null
  is_milestone?: boolean
  depends_on?: string[]
}

export interface BulkTaskUpdate {
  id: string
  sort_order?: number
  status?: string
  assigned_to?: string | null
  phase_name?: string
}

export interface CreateTaskPayload {
  phase_name: string
  name: string
  description?: string
  estimated_hours?: number
  is_milestone?: boolean
  client_visible?: boolean
  client_label?: string
  assigned_to?: string
  sort_order?: number
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const taskKeys = {
  all: (projectId: string) => ["tasks", projectId] as const,
  byPhase: (projectId: string) => [...taskKeys.all(projectId), "byPhase"] as const,
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
// useTasks – fetch tasks grouped by phase
// ---------------------------------------------------------------------------

export function useTasks(projectId: string) {
  return useQuery<TasksByPhase>({
    queryKey: taskKeys.byPhase(projectId),
    queryFn: async () => {
      try {
        const data = await fetchJSON<{ tasksByPhase?: TasksByPhase }>(
          `/api/projects/${projectId}/tasks`
        )
        return data?.tasksByPhase ?? {}
      } catch {
        // No mock fallback — return empty grouping
        return {}
      }
    },
    enabled: !!projectId,
    staleTime: 15_000,
  })
}

// ---------------------------------------------------------------------------
// useUpdateTask – mutation to update single task via PATCH
// ---------------------------------------------------------------------------

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation<
    { task: TaskData; projectProgress: number },
    Error,
    { taskId: string; data: TaskUpdatePayload }
  >({
    mutationFn: async ({ taskId, data }) => {
      return fetchJSON(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

// ---------------------------------------------------------------------------
// useBulkUpdateTasks – bulk update (reorder, status changes, reassign)
// ---------------------------------------------------------------------------

export function useBulkUpdateTasks(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation<
    { tasks: TaskData[]; updated: number },
    Error,
    BulkTaskUpdate[]
  >({
    mutationFn: async (updates) => {
      return fetchJSON(`/api/projects/${projectId}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

// ---------------------------------------------------------------------------
// useCreateTask – mutation to add a custom task
// ---------------------------------------------------------------------------

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation<{ task: TaskData }, Error, CreateTaskPayload>({
    mutationFn: async (payload) => {
      return fetchJSON(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function getMockTasksByPhase(): TasksByPhase {
  const now = new Date().toISOString()

  return {
    "Project Setup": [
      {
        id: "task_1",
        projectId: "proj_1",
        templateTaskId: null,
        phaseName: "Project Setup",
        name: "Gather brand assets from client",
        description: "Collect logos, color codes, fonts, and brand guidelines",
        status: "completed",
        assignedTo: "usr_1",
        estimatedHours: "2",
        actualHours: "1.5",
        isMilestone: false,
        clientVisible: true,
        clientLabel: "Brand Assets Collection",
        clientStatusOverride: null,
        tierApplicable: true,
        dependsOn: null,
        sortOrder: 0,
        completedAt: now,
        completedBy: "usr_1",
        notes: null,
        attachments: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "task_2",
        projectId: "proj_1",
        templateTaskId: null,
        phaseName: "Project Setup",
        name: "Set up Shopify development store",
        description: "Create development environment and configure base settings",
        status: "completed",
        assignedTo: "usr_3",
        estimatedHours: "3",
        actualHours: "2.5",
        isMilestone: false,
        clientVisible: false,
        clientLabel: null,
        clientStatusOverride: null,
        tierApplicable: true,
        dependsOn: null,
        sortOrder: 1,
        completedAt: now,
        completedBy: "usr_3",
        notes: null,
        attachments: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "task_3",
        projectId: "proj_1",
        templateTaskId: null,
        phaseName: "Project Setup",
        name: "Requirements document sign-off",
        description: null,
        status: "completed",
        assignedTo: "usr_1",
        estimatedHours: "1",
        actualHours: "1",
        isMilestone: true,
        clientVisible: true,
        clientLabel: "Requirements Approved",
        clientStatusOverride: null,
        tierApplicable: true,
        dependsOn: ["task_1"],
        sortOrder: 2,
        completedAt: now,
        completedBy: "usr_1",
        notes: "Client approved on March 15th",
        attachments: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    Design: [
      {
        id: "task_4",
        projectId: "proj_1",
        templateTaskId: null,
        phaseName: "Design",
        name: "Create homepage mockup",
        description: "Design desktop and mobile homepage layouts",
        status: "in_progress",
        assignedTo: "usr_4",
        estimatedHours: "8",
        actualHours: "4",
        isMilestone: false,
        clientVisible: true,
        clientLabel: "Homepage Design",
        clientStatusOverride: null,
        tierApplicable: true,
        dependsOn: ["task_1"],
        sortOrder: 0,
        completedAt: null,
        completedBy: null,
        notes: null,
        attachments: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "task_5",
        projectId: "proj_1",
        templateTaskId: null,
        phaseName: "Design",
        name: "Design product page template",
        description: "Create product detail page with variants support",
        status: "not_started",
        assignedTo: "usr_4",
        estimatedHours: "6",
        actualHours: "0",
        isMilestone: false,
        clientVisible: true,
        clientLabel: "Product Page Design",
        clientStatusOverride: null,
        tierApplicable: true,
        dependsOn: ["task_4"],
        sortOrder: 1,
        completedAt: null,
        completedBy: null,
        notes: null,
        attachments: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "task_6",
        projectId: "proj_1",
        templateTaskId: null,
        phaseName: "Design",
        name: "Design approval milestone",
        description: null,
        status: "not_started",
        assignedTo: null,
        estimatedHours: "0",
        actualHours: "0",
        isMilestone: true,
        clientVisible: true,
        clientLabel: "Design Approved",
        clientStatusOverride: null,
        tierApplicable: true,
        dependsOn: ["task_4", "task_5"],
        sortOrder: 2,
        completedAt: null,
        completedBy: null,
        notes: null,
        attachments: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    Development: [
      {
        id: "task_7",
        projectId: "proj_1",
        templateTaskId: null,
        phaseName: "Development",
        name: "Implement theme customization",
        description: "Build out the custom Shopify theme based on approved designs",
        status: "not_started",
        assignedTo: "usr_3",
        estimatedHours: "16",
        actualHours: "0",
        isMilestone: false,
        clientVisible: false,
        clientLabel: null,
        clientStatusOverride: null,
        tierApplicable: true,
        dependsOn: ["task_6"],
        sortOrder: 0,
        completedAt: null,
        completedBy: null,
        notes: null,
        attachments: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "task_8",
        projectId: "proj_1",
        templateTaskId: null,
        phaseName: "Development",
        name: "Configure payment gateway",
        description: "Set up Stripe / Shopify Payments",
        status: "blocked",
        assignedTo: "usr_3",
        estimatedHours: "4",
        actualHours: "0",
        isMilestone: false,
        clientVisible: false,
        clientLabel: null,
        clientStatusOverride: null,
        tierApplicable: true,
        dependsOn: null,
        sortOrder: 1,
        completedAt: null,
        completedBy: null,
        notes: "Waiting on client payment processor credentials",
        attachments: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    "Content & QA": [
      {
        id: "task_9",
        projectId: "proj_1",
        templateTaskId: null,
        phaseName: "Content & QA",
        name: "Upload product catalog",
        description: "Add all products with images, descriptions, and variants",
        status: "not_started",
        assignedTo: null,
        estimatedHours: "10",
        actualHours: "0",
        isMilestone: false,
        clientVisible: true,
        clientLabel: "Product Upload",
        clientStatusOverride: null,
        tierApplicable: true,
        dependsOn: ["task_7"],
        sortOrder: 0,
        completedAt: null,
        completedBy: null,
        notes: null,
        attachments: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "task_10",
        projectId: "proj_1",
        templateTaskId: null,
        phaseName: "Content & QA",
        name: "Final QA testing",
        description: "Full regression test across devices and browsers",
        status: "skipped",
        assignedTo: null,
        estimatedHours: "6",
        actualHours: "0",
        isMilestone: false,
        clientVisible: false,
        clientLabel: null,
        clientStatusOverride: null,
        tierApplicable: false,
        dependsOn: null,
        sortOrder: 1,
        completedAt: null,
        completedBy: null,
        notes: "Skipped - not applicable to Basic tier",
        attachments: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
  }
}
