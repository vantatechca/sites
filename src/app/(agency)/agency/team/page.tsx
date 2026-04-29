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
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Search, Users, Mail, Clock, Briefcase, Activity, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
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
  const [profileMember, setProfileMember] = useState<TeamMemberStats | null>(null)
  const [reassignMember, setReassignMember] = useState<TeamMemberStats | null>(null)
  const [reassignTarget, setReassignTarget] = useState<string>("")

  const { data: teamMembers = [], isLoading } = useTeam({
    search: search || undefined,
    department,
  })

  const handleViewProfile = (id: string) => {
    const member = teamMembers.find((m) => m.id === id)
    if (member) setProfileMember(member)
  }

  const handleReassign = (id: string) => {
    const member = teamMembers.find((m) => m.id === id)
    if (member) {
      setReassignMember(member)
      setReassignTarget("")
    }
  }

  const confirmReassign = () => {
    if (!reassignMember || !reassignTarget) return
    toast.success(
      `${reassignMember.name}'s workload will be reassigned to ${reassignTarget}`
    )
    setReassignMember(null)
    setReassignTarget("")
  }

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
        const parts = (m.name ?? "").trim().split(/\s+/).filter(Boolean)
        const first = parts[0] ?? "—"
        const lastInitial = parts[1]?.[0] ? ` ${parts[1][0]}.` : ""
        result.push({
          name: first + lastInitial,
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
                onViewProfile={handleViewProfile}
                onReassign={handleReassign}
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

      {/* View Profile Sheet */}
      <Sheet
        open={!!profileMember}
        onOpenChange={(open) => {
          if (!open) setProfileMember(null)
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Team Member Profile</SheetTitle>
          </SheetHeader>
          {profileMember && (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-[#2D5A8C]/10 text-base font-semibold text-[#2D5A8C]">
                  {profileMember.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {profileMember.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profileMember.specialization ||
                      (profileMember.department
                        ? DEPARTMENT_LABELS[profileMember.department]
                        : "—")}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border bg-gray-50/50 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-gray-900">
                    {profileMember.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium capitalize text-gray-900">
                    {profileMember.role.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Timezone:</span>
                  <span className="font-medium text-gray-900">
                    {profileMember.timezone || "—"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Activity className="size-3" />
                    Active Projects
                  </div>
                  <p className="mt-1 text-xl font-semibold text-gray-900">
                    {profileMember.activeProjectCount}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      / {profileMember.maxConcurrentProjects}
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <CheckCircle2 className="size-3" />
                    Completed
                  </div>
                  <p className="mt-1 text-xl font-semibold text-gray-900">
                    {profileMember.completedProjectCount}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Tasks This Week
                  </div>
                  <p className="mt-1 text-xl font-semibold text-gray-900">
                    {profileMember.tasksCompletedThisWeek}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Check-in Streak
                  </div>
                  <p className="mt-1 text-xl font-semibold text-gray-900">
                    {profileMember.checkinStreak}d
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setProfileMember(null)
                    handleReassign(profileMember.id)
                  }}
                >
                  Reassign Workload
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setProfileMember(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reassign Dialog */}
      <Dialog
        open={!!reassignMember}
        onOpenChange={(open) => {
          if (!open) setReassignMember(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign Workload</DialogTitle>
          </DialogHeader>
          {reassignMember && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Reassign <span className="font-medium text-gray-900">{reassignMember.name}</span>&apos;s
                {" "}{reassignMember.activeProjectCount} active project
                {reassignMember.activeProjectCount !== 1 ? "s" : ""} to another team member.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">
                  Reassign to
                </label>
                <select
                  value={reassignTarget}
                  onChange={(e) => setReassignTarget(e.target.value)}
                  className="flex h-9 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Select a team member...</option>
                  {teamMembers
                    .filter((m) => m.id !== reassignMember.id)
                    .map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.activeProjectCount}/{m.maxConcurrentProjects} projects)
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReassignMember(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={confirmReassign} disabled={!reassignTarget}>
              Confirm Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
