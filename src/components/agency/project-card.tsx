"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Clock,
  TrendingUp,
} from "lucide-react"
import type {
  ProjectWithDetails,
  ProjectTier,
  ProjectStatus,
} from "@/types"
import { TIER_CONFIG, PROJECT_STATUS_MAP } from "@/types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tierBadgeClasses(tier: ProjectTier): string {
  switch (tier) {
    case "basic":
      return "bg-gray-100 text-gray-700 border-gray-200"
    case "pro":
      return "bg-blue-50 text-[#2D5A8C] border-blue-200"
    case "enterprise":
      return "bg-amber-50 text-amber-700 border-amber-200"
  }
}

function statusColor(status: ProjectStatus): string {
  switch (status) {
    case "intake":
    case "requirements":
      return "bg-slate-100 text-slate-700"
    case "design":
      return "bg-purple-100 text-purple-700"
    case "development":
      return "bg-blue-100 text-blue-700"
    case "content":
      return "bg-cyan-100 text-cyan-700"
    case "review_internal":
    case "final_qa":
      return "bg-indigo-100 text-indigo-700"
    case "client_review":
    case "revisions":
      return "bg-orange-100 text-orange-700"
    case "launch_prep":
      return "bg-emerald-100 text-emerald-700"
    case "launched":
    case "post_launch":
    case "completed":
      return "bg-green-100 text-green-700"
    case "on_hold":
      return "bg-red-100 text-red-700"
  }
}

function healthDotColor(project: ProjectWithDetails): string {
  if (project.status === "on_hold") return "bg-red-500"
  if (
    project.estimatedLaunchDate &&
    new Date(project.estimatedLaunchDate) < new Date() &&
    !project.actualLaunchDate
  ) {
    return "bg-red-500"
  }
  if (project.progressPercent >= 70) return "bg-emerald-500"
  if (project.progressPercent >= 40) return "bg-amber-500"
  return "bg-red-500"
}

function daysInStage(project: ProjectWithDetails): number {
  const updated = new Date(project.updatedAt)
  const now = new Date()
  return Math.max(0, Math.floor((now.getTime() - updated.getTime()) / 86400000))
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProjectCardProps {
  project: ProjectWithDetails
}

export function ProjectCard({ project }: ProjectCardProps) {
  const tier = TIER_CONFIG[project.tier]
  const days = daysInStage(project)

  return (
    <Link href={`/agency/projects/${project.id}`} className="block group">
      <Card className="relative overflow-hidden transition-shadow duration-200 hover:shadow-lg hover:ring-2 hover:ring-[#2D5A8C]/20 cursor-pointer">
        {/* Priority health indicator */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-block size-2.5 rounded-full ${healthDotColor(project)}`}
          />
        </div>

        <CardContent className="space-y-3 pt-1">
          {/* Client name */}
          <p className="text-xs text-muted-foreground font-medium truncate pr-6">
            {project.client?.company ?? project.client?.name ?? "Unknown client"}
          </p>

          {/* Project name */}
          <h3 className="text-sm font-semibold text-[#1A1A2E] leading-snug line-clamp-2">
            {project.name}
          </h3>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tierBadgeClasses(project.tier)}`}
            >
              {tier.displayName}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(project.status)}`}
            >
              {PROJECT_STATUS_MAP[project.status]}
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Progress</span>
              <span className="text-[11px] font-medium text-[#1A1A2E]">
                {project.progressPercent}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${project.progressPercent}%`,
                  backgroundColor:
                    project.progressPercent >= 80
                      ? "#10B981"
                      : project.progressPercent >= 50
                        ? "#2D5A8C"
                        : "#F59E0B",
                }}
              />
            </div>
          </div>

          {/* Footer: PM + days in stage */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              <Avatar size="sm">
                {project.manager?.avatarUrl && (
                  <AvatarImage src={project.manager.avatarUrl} alt={project.manager?.name ?? "Manager"} />
                )}
                <AvatarFallback>{initials(project.manager?.name ?? "?")}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                {project.manager?.name ?? "Unassigned"}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>
                {days}d in stage
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
