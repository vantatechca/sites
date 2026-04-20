"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const COLORS = {
  primary: "#2D5A8C",
  secondary: "#1A1A2E",
  accent: "#E8491D",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  muted: "#94A3B8",
  grid: "#E2E8F0",
}

const STATUS_COLORS: Record<string, string> = {
  Intake: "#64748B",
  Requirements: "#64748B",
  Design: "#8B5CF6",
  Development: "#2D5A8C",
  Content: "#06B6D4",
  "Internal Review": "#6366F1",
  "Client Review": "#F59E0B",
  Revisions: "#F97316",
  "Final QA": "#6366F1",
  "Launch Prep": "#10B981",
  Launched: "#22C55E",
  "Post-Launch": "#22C55E",
  Completed: "#16A34A",
  "On Hold": "#EF4444",
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({
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
          {entry.name}: {typeof entry.value === "number" && entry.name.includes("Revenue")
            ? `$${entry.value.toLocaleString()}`
            : entry.value}
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PipelineDistributionChart
// ---------------------------------------------------------------------------

interface PipelineDistributionData {
  status: string
  count: number
}

const MOCK_PIPELINE_DATA: PipelineDistributionData[] = [
  { status: "Intake", count: 2 },
  { status: "Requirements", count: 1 },
  { status: "Design", count: 3 },
  { status: "Development", count: 4 },
  { status: "Content", count: 2 },
  { status: "Internal Review", count: 1 },
  { status: "Client Review", count: 3 },
  { status: "Revisions", count: 1 },
  { status: "Final QA", count: 1 },
  { status: "Launch Prep", count: 2 },
  { status: "Launched", count: 1 },
  { status: "Completed", count: 5 },
]

export function PipelineDistributionChart({
  data,
}: {
  data?: PipelineDistributionData[]
}) {
  const chartData = data ?? MOCK_PIPELINE_DATA

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A2E]">
          Pipeline Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: COLORS.muted }}
                axisLine={{ stroke: COLORS.grid }}
                tickLine={false}
              />
              <YAxis
                dataKey="status"
                type="category"
                width={100}
                tick={{ fontSize: 10, fill: COLORS.muted }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                name="Projects"
                radius={[0, 4, 4, 0]}
                barSize={18}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[entry.status] ?? COLORS.primary}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// RevenueChart
// ---------------------------------------------------------------------------

interface RevenueData {
  month: string
  collected: number
  outstanding: number
}

const MOCK_REVENUE_DATA: RevenueData[] = [
  { month: "Sep", collected: 42000, outstanding: 8000 },
  { month: "Oct", collected: 51000, outstanding: 12000 },
  { month: "Nov", collected: 48000, outstanding: 15000 },
  { month: "Dec", collected: 63000, outstanding: 9000 },
  { month: "Jan", collected: 55000, outstanding: 11000 },
  { month: "Feb", collected: 58000, outstanding: 14000 },
  { month: "Mar", collected: 72000, outstanding: 18000 },
  { month: "Apr", collected: 65000, outstanding: 10000 },
]

export function RevenueChart({ data }: { data?: RevenueData[] }) {
  const chartData = data ?? MOCK_REVENUE_DATA

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A2E]">
          Revenue (Collected vs Outstanding)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: COLORS.muted }}
                axisLine={{ stroke: COLORS.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: COLORS.muted }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                iconType="circle"
                iconSize={8}
              />
              <Line
                type="monotone"
                dataKey="collected"
                name="Collected Revenue"
                stroke={COLORS.success}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS.success }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="outstanding"
                name="Outstanding Revenue"
                stroke={COLORS.warning}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: COLORS.warning }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// TeamWorkloadChart
// ---------------------------------------------------------------------------

interface TeamWorkloadData {
  name: string
  projects: number
  capacity: number
}

const MOCK_WORKLOAD_DATA: TeamWorkloadData[] = [
  { name: "Alex R.", projects: 4, capacity: 5 },
  { name: "Jordan K.", projects: 3, capacity: 4 },
  { name: "Sam T.", projects: 5, capacity: 5 },
  { name: "Chris L.", projects: 2, capacity: 4 },
  { name: "Taylor M.", projects: 3, capacity: 3 },
  { name: "Morgan P.", projects: 1, capacity: 3 },
]

export function TeamWorkloadChart({ data }: { data?: TeamWorkloadData[] }) {
  const chartData = data ?? MOCK_WORKLOAD_DATA

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A2E]">
          Team Workload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: COLORS.muted }}
                axisLine={{ stroke: COLORS.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: COLORS.muted }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="projects"
                name="Active Projects"
                fill={COLORS.primary}
                radius={[4, 4, 0, 0]}
                barSize={20}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.projects >= entry.capacity
                        ? COLORS.danger
                        : entry.projects >= entry.capacity * 0.8
                          ? COLORS.warning
                          : COLORS.primary
                    }
                  />
                ))}
              </Bar>
              <Bar
                dataKey="capacity"
                name="Capacity"
                fill={COLORS.grid}
                radius={[4, 4, 0, 0]}
                barSize={20}
                opacity={0.5}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
