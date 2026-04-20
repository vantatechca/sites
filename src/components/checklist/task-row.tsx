"use client"

import { useState, useCallback } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical,
  Eye,
  EyeOff,
  Star,
  StickyNote,
  MoreHorizontal,
  Pencil,
  UserPlus,
  Ban,
  ChevronDown,
  ChevronRight,
  Link2,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import type { TaskData } from "@/hooks/use-tasks"

// ---------------------------------------------------------------------------
// Status color mappings for task badges
// ---------------------------------------------------------------------------

const TASK_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  not_started: { bg: "bg-slate-100", text: "text-slate-600" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-700" },
  completed: { bg: "bg-emerald-100", text: "text-emerald-700" },
  skipped: { bg: "bg-gray-100", text: "text-gray-500" },
  blocked: { bg: "bg-red-100", text: "text-red-700" },
}

const TASK_STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  skipped: "Skipped",
  blocked: "Blocked",
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamMember {
  id: string
  name: string
  avatarUrl: string | null
  department: string | null
}

interface TaskRowProps {
  task: TaskData
  teamMembers: TeamMember[]
  onToggleComplete: (taskId: string, currentStatus: string) => void
  onOpenDetail: (task: TaskData) => void
  onAssign: (taskId: string, userId: string | null) => void
  onMarkBlocked: (taskId: string) => void
  onToggleClientVisibility: (taskId: string, visible: boolean) => void
  onUpdateStatus: (taskId: string, status: string) => void
  onInlineRename: (taskId: string, name: string) => void
}

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TaskRow({
  task,
  teamMembers,
  onToggleComplete,
  onOpenDetail,
  onAssign,
  onMarkBlocked,
  onToggleClientVisibility,
  onUpdateStatus,
  onInlineRename,
}: TaskRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(task.name)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isCompleted = task.status === "completed"
  const isSkipped = task.status === "skipped"
  const isBlocked = task.status === "blocked"
  const isDimmed = isSkipped

  const assignee = task.assignedTo
    ? teamMembers.find((m) => m.id === task.assignedTo)
    : null

  const handleCheckboxToggle = useCallback(() => {
    onToggleComplete(task.id, task.status)
  }, [task.id, task.status, onToggleComplete])

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
    setEditName(task.name)
  }, [task.name])

  const handleRenameSubmit = useCallback(() => {
    setIsEditing(false)
    if (editName.trim() && editName.trim() !== task.name) {
      onInlineRename(task.id, editName.trim())
    }
  }, [editName, task.id, task.name, onInlineRename])

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleRenameSubmit()
      } else if (e.key === "Escape") {
        setIsEditing(false)
        setEditName(task.name)
      }
    },
    [handleRenameSubmit, task.name]
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border bg-white transition-all",
        isDragging && "z-50 shadow-lg ring-2 ring-[#2D5A8C]/20 opacity-90",
        isBlocked && "border-red-200 bg-red-50/30",
        isDimmed && "opacity-60"
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Drag handle */}
        <button
          className="shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Checkbox */}
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleCheckboxToggle}
          disabled={isSkipped}
          className="shrink-0"
        />

        {/* Expand toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Task name */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKeyDown}
              autoFocus
              className="w-full bg-transparent text-sm font-medium outline-none ring-1 ring-[#2D5A8C]/30 rounded px-1 py-0.5"
            />
          ) : (
            <span
              onDoubleClick={handleDoubleClick}
              className={cn(
                "text-sm font-medium text-[#1A1A2E] truncate block cursor-text",
                isCompleted && "line-through text-muted-foreground",
                isSkipped && "line-through text-muted-foreground"
              )}
            >
              {task.name}
            </span>
          )}
        </div>

        {/* Status badge */}
        <span
          className={cn(
            "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
            TASK_STATUS_COLORS[task.status]?.bg ?? "bg-gray-100",
            TASK_STATUS_COLORS[task.status]?.text ?? "text-gray-600"
          )}
        >
          {TASK_STATUS_LABELS[task.status] ?? task.status}
        </span>

        {/* Assignee */}
        <div className="shrink-0">
          {assignee ? (
            <div className="flex items-center gap-1.5" title={assignee.name}>
              <Avatar size="sm">
                {assignee.avatarUrl && (
                  <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                )}
                <AvatarFallback>{initials(assignee.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-xs text-muted-foreground max-w-[80px] truncate">
                {assignee.name.split(" ")[0]}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground italic">
              Unassigned
            </span>
          )}
        </div>

        {/* Hours */}
        <div className="shrink-0 hidden md:flex items-center gap-1 text-[10px] text-muted-foreground min-w-[60px]">
          <Clock className="h-3 w-3" />
          <span>
            {task.actualHours || "0"}
            {task.estimatedHours ? `/${task.estimatedHours}` : ""}h
          </span>
        </div>

        {/* Indicator icons */}
        <div className="shrink-0 flex items-center gap-1">
          {task.clientVisible && (
            <span title="Visible to client">
              <Eye className="h-3.5 w-3.5 text-blue-400" />
            </span>
          )}
          {task.isMilestone && (
            <span title="Milestone">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            </span>
          )}
          {task.notes && (
            <span title="Has notes">
              <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
          )}
          {!task.tierApplicable && (
            <span
              className="inline-flex items-center rounded bg-gray-100 px-1 text-[9px] font-medium text-gray-500"
              title="Not applicable to this tier"
            >
              N/A
            </span>
          )}
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onOpenDetail(task)}>
              <Pencil className="h-4 w-4" />
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAssign(task.id, null)}>
              <UserPlus className="h-4 w-4" />
              Assign
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!isBlocked && (
              <DropdownMenuItem onClick={() => onMarkBlocked(task.id)}>
                <Ban className="h-4 w-4" />
                Mark Blocked
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() =>
                onToggleClientVisibility(task.id, !task.clientVisible)
              }
            >
              {task.clientVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {task.clientVisible ? "Hide from Client" : "Show to Client"}
            </DropdownMenuItem>
            {task.dependsOn && task.dependsOn.length > 0 && (
              <DropdownMenuItem disabled>
                <Link2 className="h-4 w-4" />
                {task.dependsOn.length} {task.dependsOn.length === 1 ? "dependency" : "dependencies"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t px-3 py-3 pl-[52px] space-y-2">
          {task.description && (
            <p className="text-xs text-muted-foreground">{task.description}</p>
          )}
          {task.notes && (
            <div className="rounded-md bg-amber-50 border border-amber-100 p-2">
              <p className="text-xs text-amber-800">
                <span className="font-medium">Notes: </span>
                {task.notes}
              </p>
            </div>
          )}
          {task.dependsOn && task.dependsOn.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Link2 className="h-3 w-3" />
              <span>
                Depends on: {task.dependsOn.join(", ")}
              </span>
            </div>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {task.attachments.map((att, i) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {att.name}
                </a>
              ))}
            </div>
          )}
          {isBlocked && task.notes && (
            <div className="rounded-md bg-red-50 border border-red-100 p-2">
              <p className="text-xs text-red-700 font-medium">
                Blocked: {task.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
