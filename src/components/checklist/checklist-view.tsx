"use client"

import { useState, useMemo, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskListSkeleton } from "@/components/shared/loading-skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { PhaseHeader } from "@/components/checklist/phase-header"
import { TaskRow } from "@/components/checklist/task-row"
import { TaskDetailSheet } from "@/components/checklist/task-detail-sheet"
import {
  useTasks,
  useUpdateTask,
  useBulkUpdateTasks,
  type TaskData,
  type TasksByPhase,
  type TaskUpdatePayload,
} from "@/hooks/use-tasks"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamMember {
  id: string
  name: string
  avatarUrl: string | null
  department: string | null
}

interface ChecklistViewProps {
  projectId: string
  teamMembers: TeamMember[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChecklistView({ projectId, teamMembers }: ChecklistViewProps) {
  const { data: tasksByPhase, isLoading, error } = useTasks(projectId)
  const updateTask = useUpdateTask(projectId)
  const bulkUpdate = useBulkUpdateTasks(projectId)

  // UI state
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [incompleteFilters, setIncompleteFilters] = useState<Set<string>>(
    new Set()
  )
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Flatten all tasks for dependency lookup
  const allTasks = useMemo(() => {
    if (!tasksByPhase) return []
    return Object.values(tasksByPhase).flat()
  }, [tasksByPhase])

  // Phase names in order
  const phaseNames = useMemo(() => {
    if (!tasksByPhase) return []
    return Object.keys(tasksByPhase)
  }, [tasksByPhase])

  // Auto-expand the first phase with incomplete tasks on initial load
  useState(() => {
    if (tasksByPhase && expandedPhases.size === 0) {
      const firstIncomplete = phaseNames.find((phase) => {
        const tasks = tasksByPhase[phase]
        return tasks.some(
          (t) => t.status !== "completed" && t.status !== "skipped"
        )
      })
      if (firstIncomplete) {
        setExpandedPhases(new Set([firstIncomplete]))
      } else if (phaseNames.length > 0) {
        setExpandedPhases(new Set([phaseNames[0]]))
      }
    }
  })

  // Handlers
  const togglePhase = useCallback((phase: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(phase)) {
        next.delete(phase)
      } else {
        next.add(phase)
      }
      return next
    })
  }, [])

  const toggleIncompleteFilter = useCallback((phase: string) => {
    setIncompleteFilters((prev) => {
      const next = new Set(prev)
      if (next.has(phase)) {
        next.delete(phase)
      } else {
        next.add(phase)
      }
      return next
    })
  }, [])

  const handleToggleComplete = useCallback(
    (taskId: string, currentStatus: string) => {
      const newStatus =
        currentStatus === "completed" ? "not_started" : "completed"
      updateTask.mutate({ taskId, data: { status: newStatus } })
    },
    [updateTask]
  )

  const handleOpenDetail = useCallback((task: TaskData) => {
    setSelectedTask(task)
    setSheetOpen(true)
  }, [])

  const handleAssign = useCallback(
    (taskId: string, userId: string | null) => {
      updateTask.mutate({ taskId, data: { assigned_to: userId } })
    },
    [updateTask]
  )

  const handleMarkBlocked = useCallback(
    (taskId: string) => {
      updateTask.mutate({ taskId, data: { status: "blocked" } })
    },
    [updateTask]
  )

  const handleToggleClientVisibility = useCallback(
    (taskId: string, visible: boolean) => {
      updateTask.mutate({ taskId, data: { client_visible: visible } })
    },
    [updateTask]
  )

  const handleUpdateStatus = useCallback(
    (taskId: string, status: string) => {
      updateTask.mutate({ taskId, data: { status } })
    },
    [updateTask]
  )

  const handleInlineRename = useCallback(
    (taskId: string, name: string) => {
      updateTask.mutate({ taskId, data: { name } })
    },
    [updateTask]
  )

  const handleSaveDetail = useCallback(
    (taskId: string, data: TaskUpdatePayload) => {
      updateTask.mutate(
        { taskId, data },
        {
          onSuccess: () => {
            setSheetOpen(false)
            setSelectedTask(null)
          },
        }
      )
    },
    [updateTask]
  )

  const handleMarkAllComplete = useCallback(
    (phase: string) => {
      if (!tasksByPhase) return
      const tasks = tasksByPhase[phase]
      const updates = tasks
        .filter((t) => t.status !== "completed" && t.status !== "skipped")
        .map((t) => ({ id: t.id, status: "completed" as const }))
      if (updates.length > 0) {
        bulkUpdate.mutate(updates)
      }
    },
    [tasksByPhase, bulkUpdate]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent, phase: string) => {
      const { active, over } = event
      if (!over || active.id === over.id || !tasksByPhase) return

      const tasks = tasksByPhase[phase]
      const oldIndex = tasks.findIndex((t) => t.id === active.id)
      const newIndex = tasks.findIndex((t) => t.id === over.id)

      if (oldIndex === -1 || newIndex === -1) return

      // Build sort order updates
      const reordered = [...tasks]
      const [removed] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, removed)

      const updates = reordered.map((t, i) => ({
        id: t.id,
        sort_order: i,
      }))

      bulkUpdate.mutate(updates)
    },
    [tasksByPhase, bulkUpdate]
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-14 rounded-lg bg-gray-100 animate-pulse" />
            <TaskListSkeleton rows={3} />
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        title="Failed to load checklist"
        description="There was an error loading the project tasks. Please try again."
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    )
  }

  // Empty state
  if (!tasksByPhase || Object.keys(tasksByPhase).length === 0) {
    return (
      <EmptyState
        title="No tasks yet"
        description="This project doesn't have any tasks. Tasks are created from checklist templates when a project starts."
      />
    )
  }

  return (
    <div className="space-y-3">
      {phaseNames.map((phase) => {
        const tasks = tasksByPhase[phase]
        const isExpanded = expandedPhases.has(phase)
        const showIncompleteOnly = incompleteFilters.has(phase)

        const visibleTasks = showIncompleteOnly
          ? tasks.filter(
              (t) => t.status !== "completed" && t.status !== "skipped"
            )
          : tasks

        return (
          <div key={phase}>
            <PhaseHeader
              phaseName={phase}
              tasks={tasks}
              isExpanded={isExpanded}
              onToggle={() => togglePhase(phase)}
              showIncompleteOnly={showIncompleteOnly}
              onToggleFilter={() => toggleIncompleteFilter(phase)}
              onMarkAllComplete={() => handleMarkAllComplete(phase)}
              onAssignAll={() => {}}
            />

            {isExpanded && (
              <div className="mt-1 ml-4 space-y-1">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                  onDragEnd={(e) => handleDragEnd(e, phase)}
                >
                  <SortableContext
                    items={visibleTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {visibleTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        teamMembers={teamMembers}
                        onToggleComplete={handleToggleComplete}
                        onOpenDetail={handleOpenDetail}
                        onAssign={handleAssign}
                        onMarkBlocked={handleMarkBlocked}
                        onToggleClientVisibility={handleToggleClientVisibility}
                        onUpdateStatus={handleUpdateStatus}
                        onInlineRename={handleInlineRename}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {visibleTasks.length === 0 && showIncompleteOnly && (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    All tasks in this phase are complete.
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Task detail sheet */}
      <TaskDetailSheet
        task={selectedTask}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        teamMembers={teamMembers}
        allTasks={allTasks}
        onSave={handleSaveDetail}
        isSaving={updateTask.isPending}
      />
    </div>
  )
}
