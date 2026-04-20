"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ProgressRing } from "@/components/shared/progress-ring"
import {
  Monitor,
  CheckCircle2,
  ListChecks,
  Clock,
  Star,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { TaskData, TasksByPhase } from "@/hooks/use-tasks"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientPreviewProps {
  projectName: string
  status: string
  statusLabel: string
  progressPercent: number
  currentPhase: string | null
  estimatedCompletionDate: string | null
  tasksByPhase: TasksByPhase | undefined
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClientVisibleTasks(tasksByPhase: TasksByPhase): TasksByPhase {
  const result: TasksByPhase = {}
  for (const [phase, tasks] of Object.entries(tasksByPhase)) {
    const visible = tasks.filter((t) => t.clientVisible)
    if (visible.length > 0) {
      result[phase] = visible
    }
  }
  return result
}

function getMilestones(tasksByPhase: TasksByPhase): TaskData[] {
  return Object.values(tasksByPhase)
    .flat()
    .filter((t) => t.isMilestone && t.clientVisible)
}

function getPhaseProgress(
  tasks: TaskData[]
): { completed: number; total: number } {
  const total = tasks.length
  const completed = tasks.filter(
    (t) => t.status === "completed" || t.status === "skipped"
  ).length
  return { completed, total }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClientPreview({
  projectName,
  status,
  statusLabel,
  progressPercent,
  currentPhase,
  estimatedCompletionDate,
  tasksByPhase,
}: ClientPreviewProps) {
  const [activeView, setActiveView] = useState(0)

  const clientTasks = tasksByPhase
    ? getClientVisibleTasks(tasksByPhase)
    : {}
  const milestones = tasksByPhase ? getMilestones(tasksByPhase) : []

  return (
    <div className="space-y-4">
      {/* Header banner */}
      <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/50 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
          <Monitor className="h-4 w-4" />
          This is what your client currently sees in their portal
        </div>
      </div>

      {/* Browser mockup frame */}
      <div className="rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 bg-gray-100 px-4 py-2.5 border-b">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 mx-4">
            <div className="rounded-md bg-white border px-3 py-1 text-xs text-muted-foreground text-center">
              portal.siteforge.dev/projects/{projectName.toLowerCase().replace(/\s+/g, "-")}
            </div>
          </div>
        </div>

        {/* Portal content */}
        <div className="bg-white p-6 min-h-[500px]">
          {/* Portal header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-[#1A1A2E]">{projectName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {statusLabel}
            </p>
          </div>

          {/* Client view tabs */}
          <Tabs value={activeView} onValueChange={(val) => setActiveView(val as number)}>
            <TabsList variant="line">
              <TabsTrigger value={0}>Progress</TabsTrigger>
              <TabsTrigger value={1}>Milestones</TabsTrigger>
              <TabsTrigger value={2}>Details</TabsTrigger>
              <TabsTrigger value={3}>Timeline</TabsTrigger>
            </TabsList>

            {/* Progress view */}
            <TabsContent value={0} className="mt-6">
              <div className="flex flex-col items-center text-center">
                <ProgressRing
                  value={progressPercent}
                  size={120}
                  strokeWidth={10}
                  color={
                    progressPercent >= 80
                      ? "text-emerald-500"
                      : progressPercent >= 50
                        ? "text-[#2D5A8C]"
                        : "text-amber-500"
                  }
                />
                <h2 className="mt-4 text-2xl font-bold text-[#1A1A2E]">
                  {progressPercent}% Complete
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentPhase
                    ? `Currently in: ${currentPhase}`
                    : "Project in progress"}
                </p>
                {estimatedCompletionDate && (
                  <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Estimated completion:{" "}
                    {new Date(estimatedCompletionDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </div>
                )}
              </div>

              {/* Phase overview */}
              <div className="mt-8 space-y-3">
                {Object.entries(clientTasks).map(([phase, tasks]) => {
                  const { completed, total } = getPhaseProgress(tasks)
                  const pct =
                    total > 0 ? Math.round((completed / total) * 100) : 0
                  const isComplete = completed === total && total > 0

                  return (
                    <div
                      key={phase}
                      className={cn(
                        "rounded-lg border p-4",
                        isComplete ? "bg-emerald-50/50 border-emerald-200" : ""
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isComplete ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <ListChecks className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium">{phase}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {completed}/{total}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isComplete
                              ? "bg-emerald-500"
                              : "bg-[#2D5A8C]"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* Milestones view */}
            <TabsContent value={1} className="mt-6">
              {milestones.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No milestones to display yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {milestones.map((ms) => {
                    const isComplete = ms.status === "completed"
                    return (
                      <div
                        key={ms.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-4",
                          isComplete
                            ? "bg-emerald-50/50 border-emerald-200"
                            : ""
                        )}
                      >
                        <Star
                          className={cn(
                            "h-5 w-5 shrink-0",
                            isComplete
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-300"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              isComplete
                                ? "text-emerald-700"
                                : "text-[#1A1A2E]"
                            )}
                          >
                            {ms.clientLabel ?? ms.name}
                          </p>
                          {isComplete && ms.completedAt && (
                            <p className="text-xs text-muted-foreground">
                              Completed{" "}
                              {new Date(
                                ms.completedAt
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                        {isComplete && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Details view */}
            <TabsContent value={2} className="mt-6">
              <div className="space-y-4">
                {Object.entries(clientTasks).map(([phase, tasks]) => (
                  <div key={phase}>
                    <h3 className="text-sm font-semibold text-[#1A1A2E] mb-2">
                      {phase}
                    </h3>
                    <div className="space-y-1">
                      {tasks.map((task) => {
                        const isComplete = task.status === "completed"
                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50"
                          >
                            {isComplete ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-gray-300 shrink-0" />
                            )}
                            <span
                              className={cn(
                                "text-sm",
                                isComplete
                                  ? "text-muted-foreground line-through"
                                  : "text-foreground"
                              )}
                            >
                              {task.clientLabel ?? task.name}
                            </span>
                            {task.isMilestone && (
                              <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Timeline view */}
            <TabsContent value={3} className="mt-6">
              <div className="relative space-y-0">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />

                {Object.entries(clientTasks).map(([phase, tasks], phaseIdx) => {
                  const { completed, total } = getPhaseProgress(tasks)
                  const isComplete = completed === total && total > 0
                  const isActive =
                    !isComplete && completed > 0

                  return (
                    <div key={phase} className="relative flex gap-4 pb-6">
                      <div
                        className={cn(
                          "relative z-10 mt-0.5 h-[22px] w-[22px] shrink-0 rounded-full border-2 flex items-center justify-center",
                          isComplete
                            ? "border-emerald-500 bg-emerald-500"
                            : isActive
                              ? "border-[#2D5A8C] bg-white"
                              : "border-gray-300 bg-white"
                        )}
                      >
                        {isComplete && (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        )}
                        {isActive && (
                          <div className="h-2 w-2 rounded-full bg-[#2D5A8C]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={cn(
                              "text-sm font-medium",
                              isComplete
                                ? "text-emerald-700"
                                : "text-[#1A1A2E]"
                            )}
                          >
                            {phase}
                          </h4>
                          <span className="text-[10px] text-muted-foreground">
                            {completed}/{total}
                          </span>
                        </div>
                        {isActive && (
                          <p className="text-xs text-[#2D5A8C] font-medium mt-0.5">
                            In progress
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
