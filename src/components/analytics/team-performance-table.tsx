"use client"

import { useState, useMemo } from "react"
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowUp, ArrowDown, Flame } from "lucide-react"
import { DEPARTMENT_LABELS } from "@/types"
import type { TeamPerformanceEntry } from "@/hooks/use-analytics"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function departmentBadgeClass(dept: string | null): string {
  switch (dept) {
    case "design":
      return "bg-purple-100 text-purple-700"
    case "development":
      return "bg-blue-100 text-blue-700"
    case "content":
      return "bg-cyan-100 text-cyan-700"
    case "qa":
      return "bg-indigo-100 text-indigo-700"
    case "project_management":
      return "bg-emerald-100 text-emerald-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

function performanceColor(value: number, avg: number): string {
  if (value >= avg * 1.2) return "text-emerald-600"
  if (value <= avg * 0.8) return "text-red-600"
  return "text-[#1A1A2E]"
}

// ---------------------------------------------------------------------------
// Sparkline
// ---------------------------------------------------------------------------

function Sparkline({ data }: { data: number[] }) {
  const chartData = data.map((value, index) => ({ index, value }))
  const max = Math.max(...data)
  const trend = data[data.length - 1] - data[0]

  return (
    <div className="w-24 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={trend >= 0 ? "#10B981" : "#EF4444"}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sort types
// ---------------------------------------------------------------------------

type SortField =
  | "name"
  | "projectsCompleted"
  | "tasksCompleted"
  | "avgHoursPerProject"
  | "checkinStreak"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TeamPerformanceTableProps {
  data: TeamPerformanceEntry[]
}

export function TeamPerformanceTable({ data }: TeamPerformanceTableProps) {
  const [sortField, setSortField] = useState<SortField>("tasksCompleted")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const sorted = useMemo(() => {
    const arr = [...data]
    arr.sort((a, b) => {
      let aVal: number | string
      let bVal: number | string

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          return sortDir === "asc"
            ? aVal < bVal ? -1 : 1
            : aVal > bVal ? -1 : 1
        case "projectsCompleted":
          aVal = a.projectsCompleted
          bVal = b.projectsCompleted
          break
        case "tasksCompleted":
          aVal = a.tasksCompleted
          bVal = b.tasksCompleted
          break
        case "avgHoursPerProject":
          aVal = a.avgHoursPerProject
          bVal = b.avgHoursPerProject
          break
        case "checkinStreak":
          aVal = a.checkinStreak
          bVal = b.checkinStreak
          break
        default:
          return 0
      }

      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
    return arr
  }, [data, sortField, sortDir])

  // Averages for color coding
  const avgTasks =
    data.reduce((s, e) => s + e.tasksCompleted, 0) / (data.length || 1)
  const avgProjects =
    data.reduce((s, e) => s + e.projectsCompleted, 0) / (data.length || 1)

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDir === "asc" ? (
      <ArrowUp className="size-3 inline ml-0.5" />
    ) : (
      <ArrowDown className="size-3 inline ml-0.5" />
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A2E]">
          Team Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th
                className="text-left py-2 px-2 font-medium cursor-pointer hover:text-[#1A1A2E] select-none"
                onClick={() => handleSort("name")}
              >
                Member
                <SortIcon field="name" />
              </th>
              <th className="text-left py-2 px-2 font-medium">Department</th>
              <th
                className="text-right py-2 px-2 font-medium cursor-pointer hover:text-[#1A1A2E] select-none"
                onClick={() => handleSort("projectsCompleted")}
              >
                Projects
                <SortIcon field="projectsCompleted" />
              </th>
              <th
                className="text-right py-2 px-2 font-medium cursor-pointer hover:text-[#1A1A2E] select-none"
                onClick={() => handleSort("tasksCompleted")}
              >
                Tasks
                <SortIcon field="tasksCompleted" />
              </th>
              <th
                className="text-right py-2 px-2 font-medium cursor-pointer hover:text-[#1A1A2E] select-none"
                onClick={() => handleSort("avgHoursPerProject")}
              >
                Avg Hours/Project
                <SortIcon field="avgHoursPerProject" />
              </th>
              <th
                className="text-right py-2 px-2 font-medium cursor-pointer hover:text-[#1A1A2E] select-none"
                onClick={() => handleSort("checkinStreak")}
              >
                Streak
                <SortIcon field="checkinStreak" />
              </th>
              <th className="text-center py-2 px-2 font-medium">
                Activity (30d)
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((member) => (
              <tr
                key={member.id}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      {member.avatarUrl && (
                        <AvatarImage
                          src={member.avatarUrl}
                          alt={member.name}
                        />
                      )}
                      <AvatarFallback>
                        {initials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-[#1A1A2E]">
                      {member.name}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-2">
                  {member.department && (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${departmentBadgeClass(member.department)}`}
                    >
                      {DEPARTMENT_LABELS[member.department]}
                    </span>
                  )}
                </td>
                <td
                  className={`text-right py-2 px-2 font-semibold ${performanceColor(member.projectsCompleted, avgProjects)}`}
                >
                  {member.projectsCompleted}
                </td>
                <td
                  className={`text-right py-2 px-2 font-semibold ${performanceColor(member.tasksCompleted, avgTasks)}`}
                >
                  {member.tasksCompleted}
                </td>
                <td className="text-right py-2 px-2 text-[#1A1A2E]">
                  {member.avgHoursPerProject}h
                </td>
                <td className="text-right py-2 px-2">
                  <span className="inline-flex items-center gap-1">
                    {member.checkinStreak >= 7 && (
                      <Flame className="size-3 text-orange-500" />
                    )}
                    <span
                      className={
                        member.checkinStreak >= 7
                          ? "font-semibold text-orange-600"
                          : member.checkinStreak === 0
                            ? "text-red-500"
                            : "text-[#1A1A2E]"
                      }
                    >
                      {member.checkinStreak}d
                    </span>
                  </span>
                </td>
                <td className="py-2 px-2 flex justify-center">
                  <Sparkline data={member.activityLast30Days} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
