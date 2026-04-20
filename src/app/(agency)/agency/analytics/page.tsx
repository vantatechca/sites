"use client"

import { useState } from "react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
  LineChart as RechartsLineChart,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  FolderKanban,
  Clock,
  DollarSign,
  ThumbsUp,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Timer,
  CheckCircle2,
} from "lucide-react"
import { useAnalytics, DATE_RANGES } from "@/hooks/use-analytics"
import type { DateRange } from "@/hooks/use-analytics"
import { PipelineChart } from "@/components/analytics/pipeline-chart"
import { RevenueChart } from "@/components/analytics/revenue-chart"
import { TeamPerformanceTable } from "@/components/analytics/team-performance-table"
import { TierComparisonChart } from "@/components/analytics/tier-comparison-chart"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  primary: "#2D5A8C",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  grid: "#E2E8F0",
  muted: "#94A3B8",
}

// ---------------------------------------------------------------------------
// Stage Time Tooltip
// ---------------------------------------------------------------------------

function StageTimeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-[#1A1A2E] mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value} days
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  breakdown,
}: {
  label: string
  value: string | number
  change: number | null
  icon: React.ElementType
  breakdown?: { label: string; value: number }[]
}) {
  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold text-[#1A1A2E] mt-1">
              {value}
            </p>
            {change !== null && (
              <div className="flex items-center gap-1 mt-1">
                {change >= 0 ? (
                  <TrendingUp className="size-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="size-3 text-red-600" />
                )}
                <span
                  className={`text-[10px] font-medium ${
                    change >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {change >= 0 ? "+" : ""}
                  {change}% from last period
                </span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-blue-50 p-2">
            <Icon className="size-5 text-[#2D5A8C]" />
          </div>
        </div>
        {breakdown && breakdown.length > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-2 border-t">
            {breakdown.map((b) => (
              <div key={b.label} className="text-[10px]">
                <span className="text-muted-foreground">{b.label}:</span>{" "}
                <span className="font-medium text-[#1A1A2E]">
                  {typeof b.value === "number" && b.value >= 1000
                    ? `$${(b.value / 1000).toFixed(0)}K`
                    : b.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange["value"]>("30d")
  const { data: analytics, isLoading } = useAnalytics(dateRange)

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A2E]">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Agency performance insights and reports
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-28" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header + Date range filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A2E]">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Agency performance insights and reports
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {DATE_RANGES.map((range) => (
            <button
              key={range.value}
              type="button"
              onClick={() => setDateRange(range.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                dateRange === range.value
                  ? "bg-[#2D5A8C] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label={analytics.metrics.totalProjects.label}
          value={analytics.metrics.totalProjects.value}
          change={analytics.metrics.totalProjects.change}
          icon={FolderKanban}
          breakdown={analytics.metrics.totalProjects.breakdown}
        />
        <MetricCard
          label={analytics.metrics.avgBuildTime.label}
          value={analytics.metrics.avgBuildTime.value}
          change={analytics.metrics.avgBuildTime.change}
          icon={Clock}
          breakdown={analytics.metrics.avgBuildTime.breakdown}
        />
        <MetricCard
          label={analytics.metrics.revenue.label}
          value={analytics.metrics.revenue.value}
          change={analytics.metrics.revenue.change}
          icon={DollarSign}
          breakdown={analytics.metrics.revenue.breakdown}
        />
        <MetricCard
          label={analytics.metrics.clientSatisfaction.label}
          value={analytics.metrics.clientSatisfaction.value}
          change={analytics.metrics.clientSatisfaction.change}
          icon={ThumbsUp}
        />
      </div>

      {/* Pipeline Distribution */}
      <PipelineChart data={analytics.pipelineDistribution} />

      {/* Average Time Per Stage */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1A1A2E]">
            Average Time Per Stage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={analytics.stageTime}
                margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={COLORS.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 10, fill: COLORS.muted }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: COLORS.muted }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Days",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: COLORS.muted },
                  }}
                />
                <Tooltip content={<StageTimeTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="averageDays"
                  name="Average Days"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                  fill={COLORS.primary}
                >
                  {analytics.stageTime.map((entry, index) => {
                    const isBottleneck =
                      entry.averageDays > entry.targetDays * 1.5
                    const isSlightlyOver =
                      entry.averageDays > entry.targetDays
                    return (
                      <rect
                        key={`cell-${index}`}
                        fill={
                          isBottleneck
                            ? COLORS.danger
                            : isSlightlyOver
                              ? COLORS.warning
                              : COLORS.primary
                        }
                      />
                    )
                  })}
                </Bar>
                <Line
                  type="monotone"
                  dataKey="targetDays"
                  name="Target Days"
                  stroke={COLORS.success}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: COLORS.success }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <TeamPerformanceTable data={analytics.teamPerformance} />

      {/* Revenue */}
      <RevenueChart data={analytics.revenue} />

      {/* Revenue summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Total Collected</p>
            <p className="text-lg font-semibold text-emerald-600 mt-1">
              $
              {analytics.revenue
                .reduce((s, r) => s + r.collected, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">Total Outstanding</p>
            <p className="text-lg font-semibold text-amber-600 mt-1">
              $
              {analytics.revenue
                .reduce((s, r) => s + r.outstanding, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">
              Projected (Next 3 Months)
            </p>
            <p className="text-lg font-semibold text-[#2D5A8C] mt-1">
              $
              {analytics.revenue
                .reduce((s, r) => s + (r.projected ?? 0), 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Analysis */}
      <TierComparisonChart data={analytics.tierComparison} />

      {/* At Risk Projects */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2">
            <AlertTriangle className="size-4 text-red-500" />
            At Risk Projects
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 px-2 font-medium">Project</th>
                <th className="text-left py-2 px-2 font-medium">Client</th>
                <th className="text-right py-2 px-2 font-medium">
                  Days Behind
                </th>
                <th className="text-right py-2 px-2 font-medium">
                  Blocked Tasks
                </th>
                <th className="text-left py-2 px-2 font-medium">Reason</th>
                <th className="text-center py-2 px-2 font-medium">
                  Severity
                </th>
                <th className="text-right py-2 px-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {analytics.atRiskProjects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-2 px-2 font-medium text-[#1A1A2E]">
                    {project.name}
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">
                    {project.clientName}
                  </td>
                  <td
                    className={`text-right py-2 px-2 font-semibold ${
                      project.daysBehind > 7
                        ? "text-red-600"
                        : "text-amber-600"
                    }`}
                  >
                    {project.daysBehind}d
                  </td>
                  <td className="text-right py-2 px-2">
                    {project.blockedTasksCount > 0 ? (
                      <span className="text-red-600 font-medium">
                        {project.blockedTasksCount}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-muted-foreground max-w-[200px] truncate">
                    {project.reason}
                  </td>
                  <td className="text-center py-2 px-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        project.severity === "high"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {project.severity === "high" ? "High" : "Medium"}
                    </span>
                  </td>
                  <td className="text-right py-2 px-2">
                    <Link
                      href={`/agency/projects/${project.id}`}
                      className="inline-flex items-center gap-1 text-[#2D5A8C] hover:underline font-medium"
                    >
                      View
                      <ExternalLink className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {analytics.atRiskProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="size-8 text-emerald-500 mb-2" />
              <p className="text-sm text-muted-foreground">
                No at-risk projects
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Engagement */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1A1A2E]">
            Client Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Timer className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Avg Response Time
                </span>
              </div>
              <p className="text-lg font-semibold text-[#1A1A2E]">
                {analytics.clientEngagement.averageResponseTimeHours}h
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <ThumbsUp className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Approval Rate
                </span>
              </div>
              <p className="text-lg font-semibold text-[#1A1A2E]">
                {analytics.clientEngagement.approvalRatePercent}%
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Avg Messages/Week
                </span>
              </div>
              <p className="text-lg font-semibold text-[#1A1A2E]">
                {Math.round(
                  analytics.clientEngagement.communicationFrequency.reduce(
                    (s, w) => s + w.messages,
                    0
                  ) /
                    (analytics.clientEngagement.communicationFrequency.length ||
                      1)
                )}
              </p>
            </div>
          </div>

          {/* Communication frequency chart */}
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={analytics.clientEngagement.communicationFrequency}
                margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={COLORS.grid}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: COLORS.muted }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: COLORS.muted }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-lg border bg-white px-3 py-2 shadow-md">
                        <p className="text-xs font-medium text-[#1A1A2E]">
                          {label}
                        </p>
                        <p className="text-xs text-[#2D5A8C]">
                          {payload[0].value} messages
                        </p>
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="messages"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS.primary }}
                  activeDot={{ r: 5 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
