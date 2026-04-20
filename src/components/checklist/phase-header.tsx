"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ListFilter,
  Users,
  LayoutList,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { TaskData } from "@/hooks/use-tasks"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhaseHeaderProps {
  phaseName: string
  tasks: TaskData[]
  isExpanded: boolean
  onToggle: () => void
  showIncompleteOnly: boolean
  onToggleFilter: () => void
  onMarkAllComplete: () => void
  onAssignAll: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPhaseIcon(phaseName: string): string {
  const lower = phaseName.toLowerCase()
  if (lower.includes("setup") || lower.includes("intake")) return "1"
  if (lower.includes("design")) return "2"
  if (lower.includes("develop")) return "3"
  if (lower.includes("content") || lower.includes("qa")) return "4"
  if (lower.includes("launch")) return "5"
  if (lower.includes("review")) return "6"
  return "#"
}

function getProgressColor(completed: number, total: number): string {
  if (total === 0) return "bg-gray-300"
  const pct = completed / total
  if (pct >= 1) return "bg-emerald-500"
  if (pct > 0) return "bg-[#2D5A8C]"
  return "bg-gray-300"
}

function getProgressBg(completed: number, total: number): string {
  if (total === 0) return "bg-gray-100"
  const pct = completed / total
  if (pct >= 1) return "bg-emerald-100"
  if (pct > 0) return "bg-blue-50"
  return "bg-gray-100"
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhaseHeader({
  phaseName,
  tasks,
  isExpanded,
  onToggle,
  showIncompleteOnly,
  onToggleFilter,
  onMarkAllComplete,
  onAssignAll,
}: PhaseHeaderProps) {
  const total = tasks.length
  const completed = tasks.filter(
    (t) => t.status === "completed" || t.status === "skipped"
  ).length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  const isComplete = completed === total && total > 0
  const inProgress = completed > 0 && !isComplete

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
        isComplete
          ? "border-emerald-200 bg-emerald-50/50"
          : inProgress
            ? "border-blue-100 bg-blue-50/30"
            : "border-gray-200 bg-white"
      )}
    >
      {/* Phase number badge */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          isComplete
            ? "bg-emerald-500 text-white"
            : inProgress
              ? "bg-[#2D5A8C] text-white"
              : "bg-gray-200 text-gray-500"
        )}
      >
        {isComplete ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          getPhaseIcon(phaseName)
        )}
      </div>

      {/* Phase name */}
      <button
        onClick={onToggle}
        className="flex flex-1 items-center gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#1A1A2E] truncate">
            {phaseName}
          </h3>
          <div className="mt-1.5 flex items-center gap-3">
            {/* Progress bar */}
            <div className={cn("h-1.5 flex-1 max-w-[200px] rounded-full", getProgressBg(completed, total))}>
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  getProgressColor(completed, total)
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {completed}/{total} tasks ({percent}%)
            </span>
          </div>
        </div>

        {/* Chevron */}
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Actions - only show when expanded */}
      {isExpanded && (
        <div className="flex items-center gap-1 shrink-0">
          {/* Filter toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleFilter}
            className={cn(
              showIncompleteOnly && "bg-blue-50 text-[#2D5A8C]"
            )}
            title={showIncompleteOnly ? "Show all tasks" : "Show incomplete only"}
          >
            <ListFilter className="h-3.5 w-3.5" />
          </Button>

          {/* Bulk actions */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" title="Bulk actions">
                  <LayoutList className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onMarkAllComplete}>
                <CheckCircle2 className="h-4 w-4" />
                Mark All Complete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onAssignAll}>
                <Users className="h-4 w-4" />
                Assign All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
