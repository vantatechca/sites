"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GripVertical, MoreHorizontal, ArrowRight, UserCog } from "lucide-react"
import type { ProjectWithDetails, ProjectTier } from "@/types"
import { TIER_CONFIG } from "@/types"
import { useState } from "react"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tierDotColor(tier: ProjectTier): string {
  switch (tier) {
    case "basic":
      return "bg-gray-400"
    case "pro":
      return "bg-[#2D5A8C]"
    case "enterprise":
      return "bg-amber-500"
  }
}

function healthColor(project: ProjectWithDetails): string {
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

interface PipelineCardProps {
  project: ProjectWithDetails
  onChangeStatus?: (projectId: string, status: string) => void
  onAssignPM?: (projectId: string) => void
}

export function PipelineCard({
  project,
  onChangeStatus,
  onAssignPM,
}: PipelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const [showActions, setShowActions] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const tier = TIER_CONFIG[project.tier]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border bg-white p-3 shadow-sm transition-all ${
        isDragging
          ? "shadow-lg ring-2 ring-[#2D5A8C]/30 opacity-90 z-50"
          : "hover:shadow-md"
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Drag handle + quick actions row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab rounded p-0.5 text-gray-300 transition-colors hover:text-gray-500 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-3.5" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground truncate">
            {project.client?.company ?? project.client?.name ?? "Unknown client"}
          </p>
          <h4 className="text-xs font-semibold text-[#1A1A2E] leading-tight line-clamp-2 mt-0.5">
            {project.name}
          </h4>
        </div>

        {/* Health indicator */}
        <span
          className={`mt-1 inline-block size-2 shrink-0 rounded-full ${healthColor(project)}`}
        />
      </div>

      {/* Tier + Progress row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="inline-flex items-center gap-1">
          <span className={`size-1.5 rounded-full ${tierDotColor(project.tier)}`} />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {tier.displayName}
          </span>
        </span>
        <span className="text-[10px] font-semibold text-[#1A1A2E]">
          {project.progressPercent}%
        </span>
      </div>

      {/* Thin progress bar */}
      <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-300"
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

      {/* PM avatar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Avatar size="sm">
            {project.manager?.avatarUrl && (
              <AvatarImage
                src={project.manager.avatarUrl}
                alt={project.manager?.name ?? "Manager"}
              />
            )}
            <AvatarFallback>{initials(project.manager?.name ?? "?")}</AvatarFallback>
          </Avatar>
          <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
            {project.manager?.name ?? "Unassigned"}
          </span>
        </div>

        {/* Quick actions (visible on hover) */}
        {showActions && (
          <div className="flex items-center gap-0.5">
            {onChangeStatus && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onChangeStatus(project.id, project.status)
                }}
                className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="Change status"
              >
                <ArrowRight className="size-3" />
              </button>
            )}
            {onAssignPM && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAssignPM(project.id)
                }}
                className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="Assign PM"
              >
                <UserCog className="size-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
