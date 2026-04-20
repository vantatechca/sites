"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Clock,
  Star,
  Eye,
  Link2,
  Paperclip,
  History,
  Save,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { TaskData, TaskUpdatePayload } from "@/hooks/use-tasks"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamMember {
  id: string
  name: string
  avatarUrl: string | null
  department: string | null
}

interface TaskDetailSheetProps {
  task: TaskData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  teamMembers: TeamMember[]
  allTasks: TaskData[]
  onSave: (taskId: string, data: TaskUpdatePayload) => void
  isSaving?: boolean
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

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "skipped", label: "Skipped" },
  { value: "blocked", label: "Blocked" },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  teamMembers,
  allTasks,
  onSave,
  isSaving = false,
}: TaskDetailSheetProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("not_started")
  const [assignedTo, setAssignedTo] = useState<string>("unassigned")
  const [estimatedHours, setEstimatedHours] = useState("")
  const [actualHours, setActualHours] = useState("")
  const [clientVisible, setClientVisible] = useState(false)
  const [clientLabel, setClientLabel] = useState("")
  const [isMilestone, setIsMilestone] = useState(false)
  const [notes, setNotes] = useState("")

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setName(task.name)
      setDescription(task.description ?? "")
      setStatus(task.status)
      setAssignedTo(task.assignedTo ?? "unassigned")
      setEstimatedHours(task.estimatedHours ?? "")
      setActualHours(task.actualHours ?? "0")
      setClientVisible(task.clientVisible)
      setClientLabel(task.clientLabel ?? "")
      setIsMilestone(task.isMilestone)
      setNotes(task.notes ?? "")
    }
  }, [task])

  const handleSave = () => {
    if (!task) return

    const payload: TaskUpdatePayload = {}

    if (status !== task.status) payload.status = status
    if (assignedTo !== (task.assignedTo ?? "unassigned")) {
      payload.assigned_to = assignedTo === "unassigned" ? null : assignedTo
    }
    if (actualHours !== (task.actualHours ?? "0")) {
      payload.actual_hours = parseFloat(actualHours) || 0
    }
    if (notes !== (task.notes ?? "")) payload.notes = notes || null
    if (clientVisible !== task.clientVisible) payload.client_visible = clientVisible
    if (clientLabel !== (task.clientLabel ?? "")) {
      payload.client_label = clientLabel || null
    }
    if (name !== task.name) payload.name = name
    if (description !== (task.description ?? "")) {
      payload.description = description || null
    }

    onSave(task.id, payload)
  }

  if (!task) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full p-0">
        <SheetHeader className="p-4 pb-0">
          <SheetTitle>Edit Task</SheetTitle>
          <SheetDescription>
            {task.phaseName}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-160px)]">
          <div className="space-y-5 p-4">
            {/* Task name */}
            <div className="space-y-1.5">
              <Label htmlFor="task-name">Task Name</Label>
              <Input
                id="task-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Task name"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={3}
              />
            </div>

            <Separator />

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(val) => val && setStatus(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned to */}
            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <Select value={assignedTo} onValueChange={(val) => val && setAssignedTo(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          {member.avatarUrl && (
                            <AvatarImage
                              src={member.avatarUrl}
                              alt={member.name}
                            />
                          )}
                          <AvatarFallback>
                            {initials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hours */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="est-hours">
                  <Clock className="inline h-3 w-3 mr-1" />
                  Est. Hours
                </Label>
                <Input
                  id="est-hours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="0"
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="actual-hours">
                  <Clock className="inline h-3 w-3 mr-1" />
                  Actual Hours
                </Label>
                <Input
                  id="actual-hours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Phase (read-only) */}
            <div className="space-y-1.5">
              <Label>Phase</Label>
              <Input value={task.phaseName} disabled className="bg-muted" />
            </div>

            <Separator />

            {/* Dependencies */}
            {task.dependsOn && task.dependsOn.length > 0 && (
              <div className="space-y-1.5">
                <Label>
                  <Link2 className="inline h-3 w-3 mr-1" />
                  Dependencies
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {task.dependsOn.map((depId) => {
                    const depTask = allTasks.find((t) => t.id === depId)
                    return (
                      <span
                        key={depId}
                        className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {depTask?.name ?? depId}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Client visibility */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Client Visible</p>
                  <p className="text-xs text-muted-foreground">
                    Show this task in the client portal
                  </p>
                </div>
              </div>
              <Switch
                checked={clientVisible}
                onCheckedChange={setClientVisible}
              />
            </div>

            {/* Client label */}
            {clientVisible && (
              <div className="space-y-1.5">
                <Label htmlFor="client-label">Client Label</Label>
                <Input
                  id="client-label"
                  value={clientLabel}
                  onChange={(e) => setClientLabel(e.target.value)}
                  placeholder="Label shown to client (optional)"
                />
                <p className="text-xs text-muted-foreground">
                  If empty, the task name is shown to the client
                </p>
              </div>
            )}

            {/* Is milestone */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-sm font-medium">Milestone</p>
                  <p className="text-xs text-muted-foreground">
                    Mark as a major project milestone
                  </p>
                </div>
              </div>
              <Switch
                checked={isMilestone}
                onCheckedChange={setIsMilestone}
              />
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="task-notes">Notes</Label>
              <Textarea
                id="task-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes..."
                rows={3}
              />
            </div>

            {/* Attachments */}
            <div className="space-y-1.5">
              <Label>
                <Paperclip className="inline h-3 w-3 mr-1" />
                Attachments
              </Label>
              {task.attachments && task.attachments.length > 0 ? (
                <div className="space-y-1">
                  {task.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md bg-gray-50 border px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                      {att.name}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No attachments</p>
              )}
              <Button variant="outline" size="sm" disabled>
                <Paperclip className="h-3.5 w-3.5 mr-1" />
                Upload Attachment
              </Button>
            </div>

            <Separator />

            {/* Activity history */}
            <div className="space-y-1.5">
              <Label>
                <History className="inline h-3 w-3 mr-1" />
                Activity
              </Label>
              <div className="space-y-2">
                {task.completedAt && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>
                      Completed on{" "}
                      {new Date(task.completedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" />
                  <span>
                    Created on{" "}
                    {new Date(task.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-300 shrink-0" />
                  <span>
                    Last updated{" "}
                    {new Date(task.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
