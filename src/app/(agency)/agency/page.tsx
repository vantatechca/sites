import { Suspense } from "react"
import Link from "next/link"
import {
  FolderKanban,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Mail,
  Users,
  DollarSign,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { ProjectStatus, ActivityLog, ProjectWithDetails } from "@/types"
import { PROJECT_STATUS_MAP } from "@/types"

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

interface DashboardData {
  activeProjects: number
  onSchedule: number
  atRisk: number
  clientReviewsPending: number
  unreadMessages: number
  teamCheckInsToday: { completed: number; total: number }
  revenueThisMonth: number
  overdueInvoices: { count: number; total: number }
  recentActivity: ActivityEntry[]
  atRiskProjects: AtRiskProject[]
  pipelineDistribution: { status: string; count: number }[]
  trends: {
    activeProjectsTrend: number
    onScheduleTrend: number
    atRiskTrend: number
    reviewsTrend: number
    messagesTrend: number
    checkinsTrend: number
    revenueTrend: number
    invoicesTrend: number
  }
}

interface ActivityEntry {
  id: string
  user: { name: string; avatarUrl: string | null }
  action: string
  target: string
  timestamp: string
}

interface AtRiskProject {
  id: string
  name: string
  client: string
  reason: string
  daysOverdue: number
}

async function getDashboardData(): Promise<DashboardData> {
  try {
    const [analyticsRes] = await Promise.allSettled([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/analytics`, {
        cache: "no-store",
      }),
    ])

    if (analyticsRes.status === "fulfilled" && analyticsRes.value.ok) {
      const contentType = analyticsRes.value.headers.get("content-type") || ""
      if (contentType.includes("application/json")) {
        try {
          return await analyticsRes.value.json()
        } catch {
          // Fall through to mock if JSON parse fails
        }
      }
    }
  } catch {
    // Fall through to mock data
  }

  return getMockDashboardData()
}

function getMockDashboardData(): DashboardData {
  return {
    activeProjects: 12,
    onSchedule: 8,
    atRisk: 3,
    clientReviewsPending: 4,
    unreadMessages: 7,
    teamCheckInsToday: { completed: 5, total: 6 },
    revenueThisMonth: 68500,
    overdueInvoices: { count: 2, total: 9800 },
    recentActivity: [
      { id: "a1", user: { name: "Alex Rivera", avatarUrl: null }, action: "moved project", target: "Artisan Candles to Design phase", timestamp: "2 min ago" },
      { id: "a2", user: { name: "Jordan Kim", avatarUrl: null }, action: "uploaded deliverable for", target: "FitGear Pro - Homepage mockup v2", timestamp: "15 min ago" },
      { id: "a3", user: { name: "Sam Torres", avatarUrl: null }, action: "completed task", target: "PetPals - Product photography upload", timestamp: "32 min ago" },
      { id: "a4", user: { name: "Chris Lee", avatarUrl: null }, action: "left comment on", target: "Urban Threads - Color palette review", timestamp: "1 hr ago" },
      { id: "a5", user: { name: "Taylor Morgan", avatarUrl: null }, action: "submitted check-in for", target: "Brew Masters Coffee", timestamp: "1 hr ago" },
      { id: "a6", user: { name: "Alex Rivera", avatarUrl: null }, action: "created invoice", target: "Green Earth Organics - Milestone 1", timestamp: "2 hr ago" },
      { id: "a7", user: { name: "Jordan Kim", avatarUrl: null }, action: "approved deliverable for", target: "FitGear Pro - Mobile wireframes", timestamp: "3 hr ago" },
      { id: "a8", user: { name: "Morgan Park", avatarUrl: null }, action: "updated project settings for", target: "Artisan Candles Store", timestamp: "3 hr ago" },
      { id: "a9", user: { name: "Sam Torres", avatarUrl: null }, action: "resolved blocker on", target: "PetPals - Shipping integration", timestamp: "4 hr ago" },
      { id: "a10", user: { name: "Chris Lee", avatarUrl: null }, action: "started task", target: "Urban Threads - Lookbook layout", timestamp: "5 hr ago" },
    ],
    atRiskProjects: [
      { id: "proj_2", name: "FitGear Pro Relaunch", client: "Marcus Chen", reason: "2 blocked tasks, 5 days past milestone", daysOverdue: 5 },
      { id: "proj_3", name: "PetPals Supplies", client: "Lisa Wong", reason: "Client unresponsive for 7 days", daysOverdue: 7 },
      { id: "proj_4", name: "Urban Threads Boutique", client: "David Park", reason: "Client review overdue by 3 days", daysOverdue: 3 },
    ],
    pipelineDistribution: [
      { status: "Intake", count: 2 },
      { status: "Requirements", count: 1 },
      { status: "Design", count: 3 },
      { status: "Development", count: 4 },
      { status: "Content", count: 2 },
      { status: "Client Review", count: 3 },
      { status: "Launch Prep", count: 2 },
      { status: "Completed", count: 5 },
    ],
    trends: {
      activeProjectsTrend: 8.3,
      onScheduleTrend: -4.2,
      atRiskTrend: 12.5,
      reviewsTrend: 25.0,
      messagesTrend: -14.3,
      checkinsTrend: 5.0,
      revenueTrend: 12.8,
      invoicesTrend: -33.3,
    },
  }
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  trend,
  badge,
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  value: string | number
  label: string
  trend?: number
  badge?: { text: string; variant: "danger" | "warning" | "success" }
}) {
  return (
    <Card className="group relative overflow-hidden border-white/60 bg-white/80 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex items-start gap-3 py-3">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="size-5" style={{ color: iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-[#1A1A2E] leading-none">
              {value}
            </span>
            {badge && (
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  badge.variant === "danger"
                    ? "bg-red-100 text-red-700"
                    : badge.variant === "warning"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                }`}
              >
                {badge.text}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-0.5 mt-1">
              {trend >= 0 ? (
                <TrendingUp className="size-3 text-emerald-500" />
              ) : (
                <TrendingDown className="size-3 text-red-500" />
              )}
              <span
                className={`text-[10px] font-medium ${
                  trend >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {trend >= 0 ? "+" : ""}
                {trend.toFixed(1)}%
              </span>
              <span className="text-[10px] text-muted-foreground ml-0.5">
                vs last month
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Initials helper
// ---------------------------------------------------------------------------

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// ---------------------------------------------------------------------------
// Client component wrappers for charts (loaded dynamically)
// ---------------------------------------------------------------------------

import {
  PipelineDistributionChart,
  TeamWorkloadChart,
} from "@/components/agency/dashboard-charts"

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AgencyDashboardPage() {
  const data = await getDashboardData()

  const checkInPercent =
    data.teamCheckInsToday.total > 0
      ? Math.round(
          (data.teamCheckInsToday.completed / data.teamCheckInsToday.total) * 100
        )
      : 0

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-200/40 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 shadow-lg">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 size-44 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            <TrendingUp className="h-3 w-3" />
            Agency Overview
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome back!
          </h1>
          <p className="mt-1 text-sm text-white/80">
            Here&apos;s what&apos;s happening with your projects today.
          </p>
        </div>
      </div>

      {/* Top row - 4 cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
          value={data.activeProjects}
          label="Active Projects"
          trend={data.trends.activeProjectsTrend}
        />
        <StatCard
          icon={CheckCircle}
          iconBg="#ECFDF5"
          iconColor="#10B981"
          value={data.onSchedule}
          label="On Schedule"
          trend={data.trends.onScheduleTrend}
        />
        <StatCard
          icon={AlertTriangle}
          iconBg={data.atRisk > 0 ? "#FEF2F2" : "#FFFBEB"}
          iconColor={data.atRisk > 0 ? "#EF4444" : "#F59E0B"}
          value={data.atRisk}
          label="At Risk"
          trend={data.trends.atRiskTrend}
          badge={
            data.atRisk > 0
              ? { text: "Needs attention", variant: "danger" }
              : undefined
          }
        />
        <StatCard
          icon={MessageSquare}
          iconBg="#FFF7ED"
          iconColor="#F97316"
          value={data.clientReviewsPending}
          label="Client Reviews Pending"
          trend={data.trends.reviewsTrend}
        />
      </div>

      {/* Second row - 4 cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Mail}
          iconBg={data.unreadMessages > 0 ? "#FEF2F2" : "#F1F5F9"}
          iconColor={data.unreadMessages > 0 ? "#EF4444" : "#64748B"}
          value={data.unreadMessages}
          label="Unread Client Messages"
          trend={data.trends.messagesTrend}
          badge={
            data.unreadMessages > 0
              ? { text: `${data.unreadMessages} new`, variant: "danger" }
              : undefined
          }
        />
        <StatCard
          icon={Users}
          iconBg={checkInPercent >= 80 ? "#ECFDF5" : checkInPercent < 50 ? "#FEF2F2" : "#FFFBEB"}
          iconColor={checkInPercent >= 80 ? "#10B981" : checkInPercent < 50 ? "#EF4444" : "#F59E0B"}
          value={`${data.teamCheckInsToday.completed}/${data.teamCheckInsToday.total}`}
          label="Team Check-Ins Today"
          trend={data.trends.checkinsTrend}
        />
        <StatCard
          icon={DollarSign}
          iconBg="#ECFDF5"
          iconColor="#10B981"
          value={`$${data.revenueThisMonth.toLocaleString()}`}
          label="Revenue This Month"
          trend={data.trends.revenueTrend}
        />
        <StatCard
          icon={AlertCircle}
          iconBg={data.overdueInvoices.count > 0 ? "#FEF2F2" : "#F1F5F9"}
          iconColor={data.overdueInvoices.count > 0 ? "#EF4444" : "#64748B"}
          value={data.overdueInvoices.count}
          label={`Overdue Invoices${data.overdueInvoices.count > 0 ? ` ($${data.overdueInvoices.total.toLocaleString()})` : ""}`}
          trend={data.trends.invoicesTrend}
          badge={
            data.overdueInvoices.count > 0
              ? { text: "Overdue", variant: "danger" }
              : undefined
          }
        />
      </div>

      {/* Middle section: Activity feed + At risk projects */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity - 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-[#4F46E5]" />
                <CardTitle className="text-sm font-semibold text-[#1A1A2E]">
                  Recent Activity
                </CardTitle>
              </div>
              <Link href="/agency/analytics">
                <Button variant="ghost" size="xs">
                  View All
                  <ArrowRight className="size-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50/50"
                >
                  <Avatar size="sm" className="mt-0.5">
                    <AvatarFallback>
                      {initials(entry.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed">
                      <span className="font-medium text-[#1A1A2E]">
                        {entry.user.name}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {entry.action}
                      </span>{" "}
                      <span className="font-medium text-[#4F46E5]">
                        {entry.target}
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {entry.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projects Needing Attention - 1/3 */}
        <Card>
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              <CardTitle className="text-sm font-semibold text-[#1A1A2E]">
                Projects Needing Attention
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.atRiskProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <CheckCircle className="size-8 text-green-300 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    All projects are on track!
                  </p>
                </div>
              ) : (
                data.atRiskProjects.map((project) => (
                  <div
                    key={project.id}
                    className="px-4 py-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/agency/projects/${project.id}`}
                          className="text-xs font-semibold text-[#1A1A2E] hover:text-[#4F46E5] transition-colors line-clamp-1"
                        >
                          {project.name}
                        </Link>
                        <p className="text-[10px] text-muted-foreground">
                          {project.client}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700 shrink-0">
                        <Clock className="size-2.5" />
                        {project.daysOverdue}d
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {project.reason}
                    </p>
                    <div className="flex gap-1.5">
                      <Link href={`/agency/projects/${project.id}`}>
                        <Button variant="outline" size="xs">
                          View Project
                        </Button>
                      </Link>
                      <Button variant="ghost" size="xs">
                        Send Reminder
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom section: Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PipelineDistributionChart data={data.pipelineDistribution} />
        <TeamWorkloadChart />
      </div>
    </div>
  )
}
