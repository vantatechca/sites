"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Alert } from "@/components/ui/alert"
import {
  ArrowRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProjectStatus } from "@/types"
import { PROJECT_STATUS_MAP, PROJECT_STATUS_ORDER } from "@/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatusChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStatus: ProjectStatus
  onConfirm: (newStatus: ProjectStatus, notes: string) => void
  isPending?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusColor(status: ProjectStatus): string {
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

function isSkippingStages(
  current: ProjectStatus,
  target: ProjectStatus
): boolean {
  const currentIdx = PROJECT_STATUS_ORDER.indexOf(current)
  const targetIdx = PROJECT_STATUS_ORDER.indexOf(target)

  // Moving backwards or to on_hold is always okay (not considered skipping)
  if (targetIdx <= currentIdx || target === "on_hold") return false

  // If jumping more than 1 step forward, it's a skip
  return targetIdx - currentIdx > 1
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StatusChangeDialog({
  open,
  onOpenChange,
  currentStatus,
  onConfirm,
  isPending = false,
}: StatusChangeDialogProps) {
  const [newStatus, setNewStatus] = useState<ProjectStatus>(currentStatus)
  const [notes, setNotes] = useState("")

  const showWarning = newStatus !== currentStatus && isSkippingStages(currentStatus, newStatus)
  const hasChange = newStatus !== currentStatus

  const handleConfirm = () => {
    if (!hasChange) return
    onConfirm(newStatus, notes)
    setNotes("")
  }

  // Filter out current status from available options
  const availableStatuses = PROJECT_STATUS_ORDER.filter(
    (s) => s !== currentStatus
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <RefreshCw className="inline h-4 w-4 mr-1.5" />
            Change Project Status
          </DialogTitle>
          <DialogDescription>
            Update the current project status. This will be logged in the
            activity history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current status */}
          <div className="space-y-1.5">
            <Label>Current Status</Label>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
                  getStatusColor(currentStatus)
                )}
              >
                {PROJECT_STATUS_MAP[currentStatus]}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* New status */}
          <div className="space-y-1.5">
            <Label>New Status</Label>
            <Select
              value={newStatus}
              onValueChange={(v) => setNewStatus(v as ProjectStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5"
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          getStatusColor(status).split(" ")[0].replace("bg-", "bg-")
                        )}
                      />
                      {PROJECT_STATUS_MAP[status]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skip warning */}
          {showWarning && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-amber-800">
                  Skipping stages
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  You are skipping one or more stages in the workflow. Make
                  sure this is intentional.
                </p>
              </div>
            </Alert>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="status-notes">
              Notes (optional)
            </Label>
            <Textarea
              id="status-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for status change..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!hasChange || isPending}
          >
            {isPending ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
