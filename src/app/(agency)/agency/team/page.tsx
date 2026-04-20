"use client"

import { useState, useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Users } from "lucide-react"
import { DEPARTMENT_LABELS } from "@/types"
import type { Department } from "@/types"
import { useTeam } from "@/hooks/use-team"
import type { TeamMemberStats } from "@/hooks/use-team"
import { TeamMemberCard } from "@/components/agency/team-member-card"
import { AddTeamMemberDialog } from "@/components/agency/add-team-member-dialog"

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

const DEPARTMENTS: (Department | "all")[] = [
  "all",
  "design",
  "development",
  "content",
  "qa",
  "project_management",
]

const DEPT_LABELS: Record<string, string> = {
  all: "All Departments",
  ...DEPARTMENT_LABELS,
}

// ---------------------------------------------------------------------------
// Custom tooltip for heatmap
// ---------------------------------------------------------------------------

function HeatmapTooltip({
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
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TeamPage() {
  const [search, setSearch] = useState("")
  const [department, setDepartment] = useState<Department | "all">("all")

  const { data: teamMembers = [], isLoading } = useTeam({
    search: search || undefined,
    department,
  })

  // Heatmap data
  const heatmapData = useMemo(() => {
    const grouped = new Map<string, TeamMemberStats[]>()

    for (const member of teamMembers) {
      const dept = member.department
        ? DEPARTMENT_LABELS[member.department]
        : "Unassigned"
      if (!grouped.has(dept)) grouped.set(dept, [])
      grouped.get(dept)!.push(member)
    }

    const result: {
      name: string
      current: number
      capacity: number
      department: string
    }[] = []

    for (const [dept, members] of Array.from(grouped.entries())) {
      for (const m of members) {
        result.push({
          name: m.name.split(" ")[0] + " " + m.name.split(" ")[1]?.[0] + ".",
          current: m.activeProjectCount,
          capacity: m.maxConcurrentProjects,
          department: dept,
        })
      }
    }

    return result
  }, [teamMembers])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A2E]">Team</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your agency team and monitor workload
          </p>
        </div>
        <AddTeamMemberDialog />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setDepartment(dept)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                department === dept
                  ? "bg-[#2D5A8C] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {DEPT_LABELS[dept]}
            </button>
          ))}
        </div>
      </div>

      {/* Workload Overview */}
      <div>
        <h2 className="text-sm font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
          <Users className="size-4" />
          Workload Overview
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-56" />
              </Card>
            ))}
          </div>
        ) : teamMembers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="size-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No team members found
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {teamMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                onViewProfile={(id) => {
                  /* router.push would go here */
                }}
                onReassign={(id) => {
                  /* reassign dialog would go here */
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Workload Heatmap */}
      {heatmapData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1A1A2E]">
              Workload Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={heatmapData}
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
                    label={{
                      value: "Projects",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: 11, fill: COLORS.muted },
                    }}
                  />
                  <Tooltip content={<HeatmapTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    dataKey="current"
                    name="Current Load"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  >
                    {heatmapData.map((entry, index) => {
                      const pct =
                        entry.capacity > 0
                          ? (entry.current / entry.capacity) * 100
                          : 0
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            pct > 90
                              ? COLORS.danger
                              : pct >= 70
                                ? COLORS.warning
                                : COLORS.success
                          }
                        />
                      )
                    })}
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
      )}
    </div>
  )
}
