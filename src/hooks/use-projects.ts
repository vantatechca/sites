"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  Project,
  ProjectWithDetails,
  ProjectStatus,
  ProjectTier,
  PROJECT_STATUS_ORDER,
} from "@/types"

// ---------------------------------------------------------------------------
// Filter / param types
// ---------------------------------------------------------------------------

export interface ProjectFilters {
  search?: string
  status?: ProjectStatus | "all"
  tier?: ProjectTier | "all"
  managerId?: string | "all"
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface PaginatedProjects {
  projects: ProjectWithDetails[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PipelineGroup {
  status: ProjectStatus
  label: string
  projects: ProjectWithDetails[]
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error")
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json()
}

function buildQueryString(filters: ProjectFilters): string {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.status && filters.status !== "all") params.set("status", filters.status)
  if (filters.tier && filters.tier !== "all") params.set("tier", filters.tier)
  if (filters.managerId && filters.managerId !== "all") params.set("managerId", filters.managerId)
  if (filters.page) params.set("page", String(filters.page))
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize))
  if (filters.sortBy) params.set("sortBy", filters.sortBy)
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder)
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: ProjectFilters) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  pipeline: () => [...projectKeys.all, "pipeline"] as const,
}

// ---------------------------------------------------------------------------
// useProjects – paginated project list with filters
// ---------------------------------------------------------------------------

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery<PaginatedProjects>({
    queryKey: projectKeys.list(filters),
    queryFn: async () => {
      try {
        return await fetchJSON<PaginatedProjects>(
          `/api/projects${buildQueryString(filters)}`
        )
      } catch {
        // Return placeholder data when the API isn't available yet
        return {
          projects: getMockProjects(),
          total: 6,
          page: filters.page ?? 1,
          pageSize: filters.pageSize ?? 10,
          totalPages: 1,
        }
      }
    },
    staleTime: 30_000,
  })
}

// ---------------------------------------------------------------------------
// useProject – single project detail
// ---------------------------------------------------------------------------

export function useProject(id: string) {
  return useQuery<ProjectWithDetails>({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      try {
        return await fetchJSON<ProjectWithDetails>(`/api/projects/${id}`)
      } catch {
        const mock = getMockProjects().find((p) => p.id === id)
        if (mock) return mock
        throw new Error("Project not found")
      }
    },
    enabled: !!id,
    staleTime: 30_000,
  })
}

// ---------------------------------------------------------------------------
// useUpdateProject – mutation for PATCH /api/projects/:id
// ---------------------------------------------------------------------------

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation<
    ProjectWithDetails,
    Error,
    { id: string; data: Partial<Project> }
  >({
    mutationFn: async ({ id, data }) => {
      return fetchJSON<ProjectWithDetails>(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.pipeline() })
    },
  })
}

// ---------------------------------------------------------------------------
// useCreateProject – mutation for POST /api/projects
// ---------------------------------------------------------------------------

export interface CreateProjectPayload {
  name: string
  clientId: string
  tier: ProjectTier
  storeUrl?: string
  previewUrl?: string
  managerId: string
  estimatedLaunchDate?: string
  totalBudget?: number
  description?: string
  newClientName?: string
  newClientEmail?: string
  newClientCompany?: string
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation<ProjectWithDetails, Error, CreateProjectPayload>({
    mutationFn: async (payload) => {
      // Transform camelCase to snake_case for API
      const apiPayload = {
        client_id: payload.clientId,
        project_name: payload.name,
        tier: payload.tier,
        project_manager_id: payload.managerId,
        estimated_completion_date: payload.estimatedLaunchDate,
        contract_value: payload.totalBudget,
        new_client_name: payload.newClientName,
        new_client_email: payload.newClientEmail,
        new_client_company: payload.newClientCompany,
      }
      const response = await fetchJSON<{ project: ProjectWithDetails } | ProjectWithDetails>(
        "/api/projects",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload),
        }
      )
      // API returns { project: {...}, tasksCreated: N } — unwrap it
      return "project" in response
        ? (response as { project: ProjectWithDetails }).project
        : (response as ProjectWithDetails)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.pipeline() })
    },
  })
}

// ---------------------------------------------------------------------------
// usePipelineProjects – projects grouped by status for the kanban board
// ---------------------------------------------------------------------------

export function usePipelineProjects(filters?: {
  tier?: ProjectTier | "all"
  managerId?: string | "all"
}) {
  return useQuery<PipelineGroup[]>({
    queryKey: [...projectKeys.pipeline(), filters],
    queryFn: async () => {
      try {
        const qs = new URLSearchParams()
        if (filters?.tier && filters.tier !== "all") qs.set("tier", filters.tier)
        if (filters?.managerId && filters.managerId !== "all")
          qs.set("managerId", filters.managerId)
        const qsStr = qs.toString()
        const data = await fetchJSON<
          PipelineGroup[] | { groups?: PipelineGroup[] }
        >(`/api/projects/pipeline${qsStr ? `?${qsStr}` : ""}`)
        if (Array.isArray(data)) return data
        return data.groups ?? []
      } catch {
        // No mock fallback — return empty pipeline
        return []
      }
    },
    staleTime: 15_000,
  })
}

// ---------------------------------------------------------------------------
// Mock data used when API is unavailable
// ---------------------------------------------------------------------------

function getMockProjects(): ProjectWithDetails[] {
  const now = new Date()
  const makeDate = (daysAgo: number) =>
    new Date(now.getTime() - daysAgo * 86400000)

  return [
    {
      id: "proj_1",
      name: "Artisan Candles Store",
      slug: "artisan-candles",
      tier: "pro" as const,
      status: "design" as const,
      clientId: "cli_1",
      managerId: "usr_1",
      description: "Full redesign of e-commerce storefront",
      storeUrl: "https://artisan-candles.myshopify.com",
      previewUrl: null,
      estimatedLaunchDate: makeDate(-30),
      actualLaunchDate: null,
      totalBudget: 12000,
      currentPhase: "design",
      progressPercent: 35,
      brandingConfigId: null,
      createdAt: makeDate(45),
      updatedAt: makeDate(1),
      client: { id: "cli_1", name: "Sarah Mitchell", email: "sarah@artisancandles.com", phone: null, company: "Artisan Candles Co.", avatarUrl: null, notes: null, userId: "usr_c1", createdAt: makeDate(60), updatedAt: makeDate(1) },
      manager: { id: "usr_1", name: "Alex Rivera", email: "alex@siteforge.dev", passwordHash: null, role: "manager", department: "project_management", avatarUrl: null, isActive: true, createdAt: makeDate(200), updatedAt: makeDate(1) },
      tasks: [],
      brandingConfig: null,
    },
    {
      id: "proj_2",
      name: "FitGear Pro Relaunch",
      slug: "fitgear-pro",
      tier: "enterprise" as const,
      status: "development" as const,
      clientId: "cli_2",
      managerId: "usr_2",
      description: "Complete platform migration and redesign",
      storeUrl: "https://fitgear-pro.myshopify.com",
      previewUrl: "https://preview.fitgear-pro.dev",
      estimatedLaunchDate: makeDate(-14),
      actualLaunchDate: null,
      totalBudget: 28000,
      currentPhase: "development",
      progressPercent: 62,
      brandingConfigId: null,
      createdAt: makeDate(90),
      updatedAt: makeDate(0),
      client: { id: "cli_2", name: "Marcus Chen", email: "marcus@fitgearpro.com", phone: null, company: "FitGear Pro Inc.", avatarUrl: null, notes: null, userId: "usr_c2", createdAt: makeDate(95), updatedAt: makeDate(1) },
      manager: { id: "usr_2", name: "Jordan Kim", email: "jordan@siteforge.dev", passwordHash: null, role: "manager", department: "project_management", avatarUrl: null, isActive: true, createdAt: makeDate(180), updatedAt: makeDate(1) },
      tasks: [],
      brandingConfig: null,
    },
    {
      id: "proj_3",
      name: "PetPals Supplies",
      slug: "petpals-supplies",
      tier: "basic" as const,
      status: "content" as const,
      clientId: "cli_3",
      managerId: "usr_1",
      description: "Basic Shopify store setup",
      storeUrl: "https://petpals.myshopify.com",
      previewUrl: null,
      estimatedLaunchDate: makeDate(-7),
      actualLaunchDate: null,
      totalBudget: 4500,
      currentPhase: "content",
      progressPercent: 50,
      brandingConfigId: null,
      createdAt: makeDate(30),
      updatedAt: makeDate(2),
      client: { id: "cli_3", name: "Lisa Wong", email: "lisa@petpals.com", phone: null, company: "PetPals LLC", avatarUrl: null, notes: null, userId: "usr_c3", createdAt: makeDate(35), updatedAt: makeDate(2) },
      manager: { id: "usr_1", name: "Alex Rivera", email: "alex@siteforge.dev", passwordHash: null, role: "manager", department: "project_management", avatarUrl: null, isActive: true, createdAt: makeDate(200), updatedAt: makeDate(1) },
      tasks: [],
      brandingConfig: null,
    },
    {
      id: "proj_4",
      name: "Urban Threads Boutique",
      slug: "urban-threads",
      tier: "pro" as const,
      status: "client_review" as const,
      clientId: "cli_4",
      managerId: "usr_2",
      description: "Fashion e-commerce with lookbook features",
      storeUrl: "https://urban-threads.myshopify.com",
      previewUrl: "https://preview.urban-threads.dev",
      estimatedLaunchDate: makeDate(-3),
      actualLaunchDate: null,
      totalBudget: 15000,
      currentPhase: "client_review",
      progressPercent: 78,
      brandingConfigId: null,
      createdAt: makeDate(60),
      updatedAt: makeDate(0),
      client: { id: "cli_4", name: "David Park", email: "david@urbanthreads.co", phone: null, company: "Urban Threads", avatarUrl: null, notes: null, userId: "usr_c4", createdAt: makeDate(65), updatedAt: makeDate(0) },
      manager: { id: "usr_2", name: "Jordan Kim", email: "jordan@siteforge.dev", passwordHash: null, role: "manager", department: "project_management", avatarUrl: null, isActive: true, createdAt: makeDate(180), updatedAt: makeDate(1) },
      tasks: [],
      brandingConfig: null,
    },
    {
      id: "proj_5",
      name: "Brew Masters Coffee",
      slug: "brew-masters",
      tier: "enterprise" as const,
      status: "launch_prep" as const,
      clientId: "cli_5",
      managerId: "usr_1",
      description: "Subscription-based coffee e-commerce",
      storeUrl: "https://brew-masters.myshopify.com",
      previewUrl: "https://preview.brew-masters.dev",
      estimatedLaunchDate: makeDate(3),
      actualLaunchDate: null,
      totalBudget: 35000,
      currentPhase: "launch_prep",
      progressPercent: 92,
      brandingConfigId: null,
      createdAt: makeDate(120),
      updatedAt: makeDate(0),
      client: { id: "cli_5", name: "Emma Johnson", email: "emma@brewmasters.com", phone: null, company: "Brew Masters Inc.", avatarUrl: null, notes: null, userId: "usr_c5", createdAt: makeDate(125), updatedAt: makeDate(0) },
      manager: { id: "usr_1", name: "Alex Rivera", email: "alex@siteforge.dev", passwordHash: null, role: "manager", department: "project_management", avatarUrl: null, isActive: true, createdAt: makeDate(200), updatedAt: makeDate(1) },
      tasks: [],
      brandingConfig: null,
    },
    {
      id: "proj_6",
      name: "Green Earth Organics",
      slug: "green-earth",
      tier: "pro" as const,
      status: "intake" as const,
      clientId: "cli_6",
      managerId: "usr_2",
      description: "Organic grocery delivery platform",
      storeUrl: null,
      previewUrl: null,
      estimatedLaunchDate: makeDate(-60),
      actualLaunchDate: null,
      totalBudget: 18000,
      currentPhase: "intake",
      progressPercent: 5,
      brandingConfigId: null,
      createdAt: makeDate(3),
      updatedAt: makeDate(0),
      client: { id: "cli_6", name: "Tom Baker", email: "tom@greenearth.org", phone: null, company: "Green Earth Organics", avatarUrl: null, notes: null, userId: "usr_c6", createdAt: makeDate(5), updatedAt: makeDate(0) },
      manager: { id: "usr_2", name: "Jordan Kim", email: "jordan@siteforge.dev", passwordHash: null, role: "manager", department: "project_management", avatarUrl: null, isActive: true, createdAt: makeDate(180), updatedAt: makeDate(1) },
      tasks: [],
      brandingConfig: null,
    },
  ]
}

function getMockPipelineGroups(): PipelineGroup[] {
  const projects = getMockProjects()
  const statusOrder: ProjectStatus[] = [
    "intake",
    "requirements",
    "design",
    "development",
    "content",
    "review_internal",
    "client_review",
    "revisions",
    "final_qa",
    "launch_prep",
    "launched",
    "post_launch",
    "completed",
    "on_hold",
  ]
  const statusLabels: Record<string, string> = {
    intake: "Intake",
    requirements: "Requirements",
    design: "Design",
    development: "Development",
    content: "Content",
    review_internal: "Internal Review",
    client_review: "Client Review",
    revisions: "Revisions",
    final_qa: "Final QA",
    launch_prep: "Launch Prep",
    launched: "Launched",
    post_launch: "Post-Launch",
    completed: "Completed",
    on_hold: "On Hold",
  }

  return statusOrder.map((status) => ({
    status,
    label: statusLabels[status] ?? status,
    projects: projects.filter((p) => p.status === status),
  }))
}
