"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Clock,
  FolderKanban,
  CheckCircle2,
  UserCog,
  ArrowRightLeft,
} from "lucide-react"
import { DEPARTMENT_LABELS } from "@/types"
import type { TeamMemberStats } from "@/hooks/use-team"

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

function capacityPercent(active: number, max: number): number {
  if (max <= 0) return 0
  return Math.round((active / max) * 100)
}

function capacityColor(percent: number): string {
  if (percent > 90) return "#EF4444"
  if (percent >= 70) return "#F59E0B"
  return "#10B981"
}

function capacityBg(percent: number): string {
  if (percent > 90) return "bg-red-50"
  if (percent >= 70) return "bg-amber-50"
  return "bg-emerald-50"
}

function departmentBadgeClass(dept: string | null): string {
  switch (dept) {
    case "design":
      return "bg-purple-100 text-purple-700 border-purple-200"
    case "development":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "content":
      return "bg-cyan-100 text-cyan-700 border-cyan-200"
    case "qa":
      return "bg-indigo-100 text-indigo-700 border-indigo-200"
    case "project_management":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

function formatLastCheckin(lastCheckinAt: string | null): {
  label: string
  isLate: boolean
} {
  if (!lastCheckinAt) {
    return { label: "Missed today", isLate: true }
  }

  const diff = Date.now() - new Date(lastCheckinAt).getTime()
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor(diff / 60000)

  if (minutes < 60) {
    return { label: `${minutes}m ago`, isLate: false }
  }
  if (hours < 24) {
    return { label: `${hours}h ago`, isLate: false }
  }

  const days = Math.floor(hours / 24)
  return { label: `${days}d ago`, isLate: days >= 1 }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TeamMemberCardProps {
  member: TeamMemberStats
  onViewProfile?: (id: string) => void
  onReassign?: (id: string) => void
}

export function TeamMemberCard({
  member,
  onViewProfile,
  onReassign,
}: TeamMemberCardProps) {
  const percent = capacityPercent(
    member.activeProjectCount,
    member.maxConcurrentProjects
  )
  const color = capacityColor(percent)
  const checkin = formatLastCheckin(member.lastCheckinAt)

  return (
    <Card className="relative overflow-hidden transition-shadow duration-200 hover:shadow-lg hover:ring-2 hover:ring-[#2D5A8C]/20 cursor-pointer group">
      <CardContent className="space-y-3 pt-1">
        {/* Header: Avatar + Name + Online indicator */}
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar size="lg">
              {member.avatarUrl && (
                <AvatarImage src={member.avatarUrl} alt={member.name} />
              )}
              <AvatarFallback>{initials(member.name)}</AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            {member.isActive && (
              <span className="absolute -bottom-0.5 -right-0.5 block size-3 rounded-full border-2 border-white bg-emerald-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#1A1A2E] truncate">
              {member.name}
            </h3>
            {member.specialization && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {member.specialization}
              </p>
            )}
          </div>
        </div>

        {/* Department badge */}
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${departmentBadgeClass(member.department)}`}
          >
            {member.department
              ? DEPARTMENT_LABELS[member.department]
              : "Unassigned"}
          </span>
        </div>

        {/* Capacity bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Capacity</span>
            <span className="text-[11px] font-medium text-[#1A1A2E]">
              {member.activeProjectCount}/{member.maxConcurrentProjects} projects
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(percent, 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`rounded-lg p-2 ${capacityBg(percent)}`}>
            <div className="flex items-center gap-1">
              <FolderKanban className="size-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Active</span>
            </div>
            <p className="text-sm font-semibold text-[#1A1A2E] mt-0.5">
              {member.activeProjectCount}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="size-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                This week
              </span>
            </div>
            <p className="text-sm font-semibold text-[#1A1A2E] mt-0.5">
              {member.tasksCompletedThisWeek} tasks
            </p>
          </div>
        </div>

        {/* Last check-in */}
        <div className="flex items-center gap-1.5">
          <Clock className="size-3 text-muted-foreground" />
          <span
            className={`text-xs ${
              checkin.isLate
                ? "text-red-600 font-medium"
                : "text-muted-foreground"
            }`}
          >
            Last check-in: {checkin.label}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
          <Button
            variant="outline"
            size="xs"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onViewProfile?.(member.id)
            }}
          >
            <UserCog className="size-3 mr-1" />
            View Profile
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onReassign?.(member.id)
            }}
          >
            <ArrowRightLeft className="size-3 mr-1" />
            Reassign
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
