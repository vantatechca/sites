"use client"

import { useQuery } from "@tanstack/react-query"
import type { ProjectStatus, ProjectTier, Department } from "@/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DateRange {
  label: string
  value: "7d" | "30d" | "90d" | "all"
  days: number | null
}

export const DATE_RANGES: DateRange[] = [
  { label: "Last 7 Days", value: "7d", days: 7 },
  { label: "Last 30 Days", value: "30d", days: 30 },
  { label: "Last 90 Days", value: "90d", days: 90 },
  { label: "All Time", value: "all", days: null },
]

export interface PipelineStageData {
  status: ProjectStatus
  label: string
  count: number
  color: string
}

export interface StageTimeData {
  stage: string
  averageDays: number
  targetDays: number
}

export interface TeamPerformanceEntry {
  id: string
  name: string
  department: Department | null
  avatarUrl: string | null
  projectsCompleted: number
  tasksCompleted: number
  avgHoursPerProject: number
  checkinStreak: number
  activityLast30Days: number[]
}

export interface RevenueDataPoint {
  month: string
  collected: number
  outstanding: number
  projected: number | null
}

export interface TierComparisonData {
  metric: string
  basic: number
  pro: number
  enterprise: number
}

export interface AtRiskProject {
  id: string
  name: string
  clientName: string
  daysBehind: number
  blockedTasksCount: number
  reason: string
  severity: "high" | "medium"
}

export interface ClientEngagementData {
  averageResponseTimeHours: number
  approvalRatePercent: number
  communicationFrequency: { week: string; messages: number }[]
}

export interface MetricCard {
  label: string
  value: string | number
  change: number | null
  breakdown?: { label: string; value: number }[]
}

export interface AnalyticsData {
  metrics: {
    totalProjects: MetricCard
    avgBuildTime: MetricCard
    revenue: MetricCard
    clientSatisfaction: MetricCard
  }
  pipelineDistribution: PipelineStageData[]
  stageTime: StageTimeData[]
  teamPerformance: TeamPerformanceEntry[]
  revenue: RevenueDataPoint[]
  tierComparison: TierComparisonData[]
  atRiskProjects: AtRiskProject[]
  clientEngagement: ClientEngagementData
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

export const analyticsKeys = {
  all: ["analytics"] as const,
  data: (range: string) => [...analyticsKeys.all, range] as const,
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function getMockAnalytics(dateRange: string = "30d"): AnalyticsData {
  // Scale mock values based on date range so the UI visibly responds to filter changes
  const scale =
    dateRange === "7d" ? 0.25 : dateRange === "90d" ? 3 : dateRange === "all" ? 8 : 1;
  const change =
    dateRange === "7d" ? 5 : dateRange === "90d" ? 18 : dateRange === "all" ? 22 : 12;

  const totalProjects = Math.max(1, Math.round(24 * scale));
  const activeProjects = Math.max(1, Math.round(14 * scale));
  const completedProjects = Math.max(0, Math.round(8 * scale));
  const onHoldProjects = Math.max(0, Math.round(2 * scale));
  const revenueCollected = Math.round(389000 * scale);
  const revenueOutstanding = Math.round(65000 * scale);
  const revenueTotal = revenueCollected + revenueOutstanding;
  const avgBuildDays =
    dateRange === "7d" ? 14 : dateRange === "90d" ? 20 : dateRange === "all" ? 22 : 18;
  const satisfaction =
    dateRange === "7d" ? 96 : dateRange === "90d" ? 92 : dateRange === "all" ? 90 : 94;

  return {
    metrics: {
      totalProjects: {
        label: "Total Projects",
        value: totalProjects,
        change,
        breakdown: [
          { label: "Active", value: activeProjects },
          { label: "Completed", value: completedProjects },
          { label: "On Hold", value: onHoldProjects },
        ],
      },
      avgBuildTime: {
        label: "Avg Build Time",
        value: `${avgBuildDays} days`,
        change: -change / 2,
        breakdown: [
          { label: "Basic", value: Math.round(avgBuildDays * 0.55) },
          { label: "Pro", value: avgBuildDays },
          { label: "Enterprise", value: Math.round(avgBuildDays * 1.75) },
        ],
      },
      revenue: {
        label: "Revenue",
        value: `$${Math.round(revenueTotal / 1000)}K`,
        change,
        breakdown: [
          { label: "Collected", value: revenueCollected },
          { label: "Outstanding", value: revenueOutstanding },
        ],
      },
      clientSatisfaction: {
        label: "Client Satisfaction",
        value: `${satisfaction}%`,
        change: change / 4,
      },
    },
    pipelineDistribution: [
      { status: "intake", label: "Intake", count: Math.max(0, Math.round(2 * scale)), color: "#64748B" },
      { status: "requirements", label: "Requirements", count: Math.max(0, Math.round(1 * scale)), color: "#64748B" },
      { status: "design", label: "Design", count: Math.max(0, Math.round(3 * scale)), color: "#8B5CF6" },
      { status: "development", label: "Development", count: Math.max(0, Math.round(4 * scale)), color: "#2D5A8C" },
      { status: "content", label: "Content", count: Math.max(0, Math.round(2 * scale)), color: "#06B6D4" },
      { status: "review_internal", label: "Internal Review", count: Math.max(0, Math.round(1 * scale)), color: "#6366F1" },
      { status: "client_review", label: "Client Review", count: Math.max(0, Math.round(3 * scale)), color: "#F59E0B" },
      { status: "revisions", label: "Revisions", count: Math.max(0, Math.round(1 * scale)), color: "#F97316" },
      { status: "final_qa", label: "Final QA", count: Math.max(0, Math.round(1 * scale)), color: "#6366F1" },
      { status: "launch_prep", label: "Launch Prep", count: Math.max(0, Math.round(2 * scale)), color: "#10B981" },
      { status: "launched", label: "Launched", count: Math.max(0, Math.round(1 * scale)), color: "#22C55E" },
      { status: "completed", label: "Completed", count: Math.max(0, Math.round(5 * scale)), color: "#16A34A" },
    ],
    stageTime: [
      { stage: "Intake", averageDays: 2, targetDays: 2 },
      { stage: "Requirements", averageDays: 4, targetDays: 3 },
      { stage: "Design", averageDays: 8, targetDays: 7 },
      { stage: "Development", averageDays: 14, targetDays: 10 },
      { stage: "Content", averageDays: 5, targetDays: 5 },
      { stage: "Internal Review", averageDays: 3, targetDays: 2 },
      { stage: "Client Review", averageDays: 6, targetDays: 3 },
      { stage: "Revisions", averageDays: 4, targetDays: 3 },
      { stage: "Final QA", averageDays: 2, targetDays: 2 },
      { stage: "Launch Prep", averageDays: 2, targetDays: 1 },
    ],
    teamPerformance: [
      {
        id: "usr_1",
        name: "Alex Rivera",
        department: "project_management",
        avatarUrl: null,
        projectsCompleted: 23,
        tasksCompleted: 187,
        avgHoursPerProject: 42,
        checkinStreak: 14,
        activityLast30Days: [3, 5, 4, 6, 2, 0, 0, 4, 5, 3, 6, 4, 5, 3, 2, 0, 0, 5, 6, 4, 3, 5, 4, 6, 3, 0, 0, 4, 5, 3],
      },
      {
        id: "usr_2",
        name: "Jordan Kim",
        department: "project_management",
        avatarUrl: null,
        projectsCompleted: 18,
        tasksCompleted: 142,
        avgHoursPerProject: 38,
        checkinStreak: 22,
        activityLast30Days: [4, 3, 5, 4, 3, 0, 0, 5, 4, 6, 3, 5, 4, 3, 2, 0, 0, 4, 5, 3, 6, 4, 5, 3, 4, 0, 0, 5, 4, 3],
      },
      {
        id: "usr_3",
        name: "Sam Torres",
        department: "development",
        avatarUrl: null,
        projectsCompleted: 31,
        tasksCompleted: 298,
        avgHoursPerProject: 56,
        checkinStreak: 30,
        activityLast30Days: [6, 7, 5, 8, 4, 0, 0, 7, 6, 8, 5, 7, 6, 5, 3, 0, 0, 7, 8, 6, 5, 7, 6, 8, 5, 0, 0, 7, 6, 5],
      },
      {
        id: "usr_4",
        name: "Chris Lee",
        department: "design",
        avatarUrl: null,
        projectsCompleted: 15,
        tasksCompleted: 89,
        avgHoursPerProject: 32,
        checkinStreak: 0,
        activityLast30Days: [2, 3, 4, 2, 1, 0, 0, 3, 2, 4, 3, 2, 3, 2, 1, 0, 0, 3, 2, 4, 2, 3, 2, 3, 2, 0, 0, 1, 0, 0],
      },
      {
        id: "usr_5",
        name: "Taylor Morgan",
        department: "content",
        avatarUrl: null,
        projectsCompleted: 27,
        tasksCompleted: 215,
        avgHoursPerProject: 28,
        checkinStreak: 5,
        activityLast30Days: [4, 5, 3, 4, 3, 0, 0, 4, 5, 3, 4, 5, 3, 4, 2, 0, 0, 5, 4, 3, 5, 4, 3, 4, 3, 0, 0, 4, 5, 3],
      },
      {
        id: "usr_6",
        name: "Morgan Park",
        department: "qa",
        avatarUrl: null,
        projectsCompleted: 40,
        tasksCompleted: 324,
        avgHoursPerProject: 18,
        checkinStreak: 8,
        activityLast30Days: [5, 4, 6, 5, 4, 0, 0, 6, 5, 4, 6, 5, 4, 5, 3, 0, 0, 5, 6, 4, 5, 6, 4, 5, 4, 0, 0, 5, 4, 6],
      },
      {
        id: "usr_7",
        name: "Jamie Reyes",
        department: "development",
        avatarUrl: null,
        projectsCompleted: 20,
        tasksCompleted: 178,
        avgHoursPerProject: 48,
        checkinStreak: 12,
        activityLast30Days: [5, 4, 6, 5, 3, 0, 0, 5, 6, 4, 5, 6, 4, 5, 2, 0, 0, 6, 5, 4, 6, 5, 4, 6, 3, 0, 0, 5, 6, 4],
      },
    ],
    revenue: (() => {
      const allMonths = [
        { month: "Sep", collected: 42000, outstanding: 8000, projected: null },
        { month: "Oct", collected: 51000, outstanding: 12000, projected: null },
        { month: "Nov", collected: 48000, outstanding: 15000, projected: null },
        { month: "Dec", collected: 63000, outstanding: 9000, projected: null },
        { month: "Jan", collected: 55000, outstanding: 11000, projected: null },
        { month: "Feb", collected: 58000, outstanding: 14000, projected: null },
        { month: "Mar", collected: 72000, outstanding: 18000, projected: null },
        { month: "Apr", collected: 65000, outstanding: 10000, projected: 70000 },
        { month: "May", collected: 0, outstanding: 0, projected: 75000 },
        { month: "Jun", collected: 0, outstanding: 0, projected: 80000 },
      ] as RevenueDataPoint[];
      if (dateRange === "7d") return allMonths.slice(-2);
      if (dateRange === "30d") return allMonths.slice(-4);
      if (dateRange === "90d") return allMonths.slice(-7);
      return allMonths;
    })(),
    tierComparison: [
      { metric: "Avg Build Time (days)", basic: 10, pro: 18, enterprise: 32 },
      { metric: "Avg Cost ($K)", basic: 4.5, pro: 15, enterprise: 30 },
      { metric: "Avg Revisions", basic: 1.5, pro: 3.2, enterprise: 4.8 },
      { metric: "Completion Rate (%)", basic: 95, pro: 88, enterprise: 82 },
    ],
    atRiskProjects: [
      {
        id: "proj_1",
        name: "Artisan Candles Store",
        clientName: "Sarah Mitchell",
        daysBehind: 12,
        blockedTasksCount: 2,
        reason: "Waiting on brand assets from client",
        severity: "high",
      },
      {
        id: "proj_2",
        name: "FitGear Pro Relaunch",
        clientName: "Marcus Chen",
        daysBehind: 5,
        blockedTasksCount: 1,
        reason: "API integration complexity underestimated",
        severity: "medium",
      },
      {
        id: "proj_4",
        name: "Urban Threads Boutique",
        clientName: "David Park",
        daysBehind: 3,
        blockedTasksCount: 0,
        reason: "Client review pending for 6+ days",
        severity: "medium",
      },
    ],
    clientEngagement: {
      averageResponseTimeHours: 18.5,
      approvalRatePercent: 76,
      communicationFrequency: [
        { week: "W1", messages: 42 },
        { week: "W2", messages: 38 },
        { week: "W3", messages: 55 },
        { week: "W4", messages: 47 },
        { week: "W5", messages: 51 },
        { week: "W6", messages: 44 },
        { week: "W7", messages: 60 },
        { week: "W8", messages: 52 },
      ],
    },
  }
}

// ---------------------------------------------------------------------------
// useAnalytics - fetch all analytics data
// ---------------------------------------------------------------------------

export function useAnalytics(dateRange: string = "30d") {
  return useQuery<AnalyticsData>({
    queryKey: analyticsKeys.data(dateRange),
    queryFn: async () => {
      try {
        return await fetchJSON<AnalyticsData>(
          `/api/analytics?range=${dateRange}`
        )
      } catch {
        return getMockAnalytics(dateRange)
      }
    },
    staleTime: 60_000,
  })
}
