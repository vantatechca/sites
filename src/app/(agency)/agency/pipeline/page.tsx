"use client"

import { useState, useCallback, useMemo } from "react"
import {
  DndContext,
  closestCenter,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { PipelineColumn } from "@/components/agency/pipeline-column"
import { PipelineCard } from "@/components/agency/pipeline-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Kanban, Filter as FilterIcon, RefreshCw } from "lucide-react"
import {
  usePipelineProjects,
  useUpdateProject,
  type PipelineGroup,
} from "@/hooks/use-projects"
import type { ProjectTier, ProjectStatus, ProjectWithDetails } from "@/types"

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const TIER_OPTIONS: { value: ProjectTier | "all"; label: string }[] = [
  { value: "all", label: "All Tiers" },
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
]

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-8 items-center rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// Pipeline stages to show (excluding completed + on_hold from kanban by default)
// ---------------------------------------------------------------------------

const PIPELINE_STAGES: { status: ProjectStatus; label: string }[] = [
  { status: "intake", label: "Intake" },
  { status: "requirements", label: "Requirements" },
  { status: "design", label: "Design" },
  { status: "development", label: "Development" },
  { status: "content", label: "Content" },
  { status: "review_internal", label: "Internal Review" },
  { status: "client_review", label: "Client Review" },
  { status: "revisions", label: "Revisions" },
  { status: "final_qa", label: "Final QA" },
  { status: "launch_prep", label: "Launch Prep" },
  { status: "launched", label: "Launched" },
  { status: "post_launch", label: "Post-Launch" },
  { status: "completed", label: "Completed" },
  { status: "on_hold", label: "On Hold" },
]

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="w-[280px] min-w-[280px] space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function PipelinePage() {
  const [tierFilter, setTierFilter] = useState<ProjectTier | "all">("all")
  const [managerFilter, setManagerFilter] = useState<string>("all")

  const { data: pipelineGroups, isLoading, isError, refetch } = usePipelineProjects({
    tier: tierFilter,
    managerId: managerFilter,
  })

  const updateProject = useUpdateProject()

  // Build a lookup of all projects from pipeline groups
  const allProjects = useMemo(() => {
    if (!pipelineGroups) return new Map<string, ProjectWithDetails>()
    const map = new Map<string, ProjectWithDetails>()
    pipelineGroups.forEach((group) => {
      group.projects.forEach((p) => map.set(p.id, p))
    })
    return map
  }, [pipelineGroups])

  // Derive unique managers from the projects
  const managerOptions = useMemo(() => {
    const seen = new Map<string, string>()
    allProjects.forEach((p) => {
      if (!seen.has(p.managerId)) {
        seen.set(p.managerId, p.manager.name)
      }
    })
    return [
      { value: "all", label: "All PMs" },
      ...Array.from(seen.entries()).map(([id, name]) => ({
        value: id,
        label: name,
      })),
    ]
  }, [allProjects])

  // Local state for optimistic drag updates
  const [localGroups, setLocalGroups] = useState<PipelineGroup[] | null>(null)
  const displayGroups = localGroups ?? pipelineGroups ?? []

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeProject = activeId ? allProjects.get(activeId) ?? null : null

  // Sensor config - require at least 8px of movement to start dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Build column data map from the display groups
  const columnData = useMemo(() => {
    const map = new Map<string, ProjectWithDetails[]>()
    PIPELINE_STAGES.forEach(({ status }) => {
      const group = displayGroups.find((g) => g.status === status)
      map.set(status, group?.projects ?? [])
    })
    return map
  }, [displayGroups])

  // ---------------------------------------------------------------------------
  // DnD handlers
  // ---------------------------------------------------------------------------

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over || !pipelineGroups) return

      const activeProjectId = active.id as string
      const overId = over.id as string

      // Find which column the active item is in
      let sourceStatus: string | null = null
      for (const group of (localGroups ?? pipelineGroups)) {
        if (group.projects.some((p) => p.id === activeProjectId)) {
          sourceStatus = group.status
          break
        }
      }

      // Determine target column
      let targetStatus: string | null = null
      // Check if the over ID is a column (status name)
      if (PIPELINE_STAGES.some((s) => s.status === overId)) {
        targetStatus = overId
      } else {
        // Over is a project card - find which column it belongs to
        for (const group of (localGroups ?? pipelineGroups)) {
          if (group.projects.some((p) => p.id === overId)) {
            targetStatus = group.status
            break
          }
        }
      }

      if (!sourceStatus || !targetStatus || sourceStatus === targetStatus) return

      // Optimistic: move project between columns
      setLocalGroups((prev) => {
        const groups = prev ?? pipelineGroups ?? []
        return groups.map((group) => {
          if (group.status === sourceStatus) {
            return {
              ...group,
              projects: group.projects.filter((p) => p.id !== activeProjectId),
            }
          }
          if (group.status === targetStatus) {
            const existingProject = allProjects.get(activeProjectId)
            if (!existingProject) return group
            if (group.projects.some((p) => p.id === activeProjectId)) return group
            return {
              ...group,
              projects: [...group.projects, { ...existingProject, status: targetStatus as ProjectStatus }],
            }
          }
          return group
        })
      })
    },
    [pipelineGroups, localGroups, allProjects]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (!over || !pipelineGroups) {
        setLocalGroups(null)
        return
      }

      const activeProjectId = active.id as string
      const overId = over.id as string

      // Find the target column
      let targetStatus: string | null = null
      if (PIPELINE_STAGES.some((s) => s.status === overId)) {
        targetStatus = overId
      } else {
        const currentGroups = localGroups ?? pipelineGroups
        for (const group of currentGroups) {
          if (group.projects.some((p) => p.id === overId) || group.status === overId) {
            targetStatus = group.status
            break
          }
        }
      }

      const project = allProjects.get(activeProjectId)
      if (!project || !targetStatus || project.status === targetStatus) {
        setLocalGroups(null)
        return
      }

      // Persist the status change
      updateProject.mutate(
        { id: activeProjectId, data: { status: targetStatus as ProjectStatus } },
        {
          onSettled: () => {
            setLocalGroups(null)
          },
        }
      )
    },
    [pipelineGroups, localGroups, allProjects, updateProject]
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setLocalGroups(null)
  }, [])

  // ---------------------------------------------------------------------------
  // Total active count
  // ---------------------------------------------------------------------------

  const totalActive = useMemo(() => {
    return displayGroups.reduce((sum, g) => sum + g.projects.length, 0)
  }, [displayGroups])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Kanban className="size-5 text-[#2D5A8C]" />
            <h1 className="text-xl font-bold text-[#1A1A2E]">Pipeline</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Drag projects between stages to update their status.{" "}
            <span className="font-medium">{totalActive} projects</span> in pipeline.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`size-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterIcon className="size-4 text-muted-foreground" />
        <FilterSelect
          value={tierFilter}
          onChange={(v) => setTierFilter(v as ProjectTier | "all")}
          options={TIER_OPTIONS}
        />
        <FilterSelect
          value={managerFilter}
          onChange={(v) => setManagerFilter(v)}
          options={managerOptions}
        />
        {(tierFilter !== "all" || managerFilter !== "all") && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setTierFilter("all")
              setManagerFilter("all")
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Kanban board */}
      {isLoading ? (
        <KanbanSkeleton />
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-red-600 mb-2">
              Failed to load pipeline
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Please try refreshing.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
        >
          <div className="overflow-x-auto pb-4 -mx-6 px-6">
            <div className="flex gap-4" style={{ minHeight: "calc(100vh - 320px)" }}>
              {PIPELINE_STAGES.map(({ status, label }) => {
                const projects = columnData.get(status) ?? []
                return (
                  <PipelineColumn
                    key={status}
                    status={status}
                    label={label}
                    projects={projects}
                  />
                )
              })}
            </div>
          </div>

          {/* Drag overlay - shows a floating card while dragging */}
          <DragOverlay dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
          }}>
            {activeProject ? (
              <div className="w-[260px] opacity-95 rotate-2 shadow-xl">
                <div className="rounded-lg border bg-white p-3 shadow-lg ring-2 ring-[#2D5A8C]/30">
                  <p className="text-[11px] text-muted-foreground truncate">
                    {activeProject.client.company ?? activeProject.client.name}
                  </p>
                  <h4 className="text-xs font-semibold text-[#1A1A2E] leading-tight line-clamp-2 mt-0.5">
                    {activeProject.name}
                  </h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {activeProject.tier}
                    </span>
                    <span className="text-[10px] font-semibold text-[#1A1A2E]">
                      {activeProject.progressPercent}%
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${activeProject.progressPercent}%`,
                        backgroundColor:
                          activeProject.progressPercent >= 80
                            ? "#10B981"
                            : activeProject.progressPercent >= 50
                              ? "#2D5A8C"
                              : "#F59E0B",
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
