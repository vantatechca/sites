"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { PipelineCard } from "./pipeline-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Inbox } from "lucide-react"
import type { ProjectWithDetails, ProjectStatus } from "@/types"

// ---------------------------------------------------------------------------
// Column color by status type
// ---------------------------------------------------------------------------

function columnHeaderColor(status: ProjectStatus): string {
  switch (status) {
    case "intake":
    case "requirements":
      return "bg-slate-500"
    case "design":
      return "bg-purple-500"
    case "development":
      return "bg-blue-500"
    case "content":
      return "bg-cyan-500"
    case "review_internal":
    case "final_qa":
      return "bg-indigo-500"
    case "client_review":
    case "revisions":
      return "bg-orange-500"
    case "launch_prep":
      return "bg-emerald-500"
    case "launched":
    case "post_launch":
    case "completed":
      return "bg-green-500"
    case "on_hold":
      return "bg-red-500"
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PipelineColumnProps {
  status: ProjectStatus
  label: string
  projects: ProjectWithDetails[]
  onChangeStatus?: (projectId: string, status: string) => void
  onAssignPM?: (projectId: string) => void
}

export function PipelineColumn({
  status,
  label,
  projects,
  onChangeStatus,
  onAssignPM,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  const projectIds = projects.map((p) => p.id)

  return (
    <div
      className={`flex h-full w-[220px] min-w-[220px] flex-col rounded-xl border bg-gray-50/80 transition-colors ${
        isOver ? "bg-[#2D5A8C]/5 border-[#2D5A8C]/30 ring-1 ring-[#2D5A8C]/20" : ""
      }`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-white rounded-t-xl">
        <span
          className={`inline-block size-2 rounded-full ${columnHeaderColor(status)}`}
        />
        <h3 className="text-xs font-semibold text-[#1A1A2E] truncate flex-1">
          {label}
        </h3>
        <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 min-w-[20px] text-center">
          {projects.length}
        </span>
      </div>

      {/* Droppable area */}
      <div ref={setNodeRef} className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <SortableContext
            items={projectIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 p-2">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Inbox className="size-8 text-gray-300 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No projects in this stage
                  </p>
                </div>
              ) : (
                projects.map((project) => (
                  <PipelineCard
                    key={project.id}
                    project={project}
                    onChangeStatus={onChangeStatus}
                    onAssignPM={onAssignPM}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
    </div>
  )
}
