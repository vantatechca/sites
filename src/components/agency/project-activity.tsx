"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckCircle2,
  MessageSquare,
  Package,
  FileText,
  RefreshCw,
  ArrowRight,
  UserPlus,
  Settings,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MessageListSkeleton } from "@/components/shared/loading-skeleton"
import { EmptyState } from "@/components/shared/empty-state"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActivityEntry {
  id: string
  projectId: string | null
  userId: string
  action: string
  entityType: string
  entityId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  userName?: string
  userAvatarUrl?: string | null
}

interface ProjectActivityProps {
  projectId: string
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

function getActionIcon(action: string) {
  if (action.includes("task")) return <CheckCircle2 className="h-3.5 w-3.5" />
  if (action.includes("message")) return <MessageSquare className="h-3.5 w-3.5" />
  if (action.includes("deliverable")) return <Package className="h-3.5 w-3.5" />
  if (action.includes("invoice")) return <FileText className="h-3.5 w-3.5" />
  if (action.includes("status") || action.includes("updated"))
    return <RefreshCw className="h-3.5 w-3.5" />
  if (action.includes("member") || action.includes("assign"))
    return <UserPlus className="h-3.5 w-3.5" />
  return <Settings className="h-3.5 w-3.5" />
}

function getActionColor(action: string): string {
  if (action.includes("created")) return "bg-emerald-100 text-emerald-600"
  if (action.includes("updated") || action.includes("status"))
    return "bg-blue-100 text-blue-600"
  if (action.includes("deleted") || action.includes("archived"))
    return "bg-red-100 text-red-600"
  return "bg-gray-100 text-gray-600"
}

function formatActionDescription(entry: ActivityEntry): string {
  const meta = entry.metadata as Record<string, unknown> | null
  const name = entry.userName ?? "Someone"

  switch (entry.action) {
    case "task_created":
      return `${name} created task "${meta?.taskName ?? "unknown"}"`
    case "task_updated": {
      const changes = meta?.changes as Record<
        string,
        { from: unknown; to: unknown }
      > | null
      if (changes?.status) {
        return `${name} changed task "${meta?.taskName}" from ${changes.status.from} to ${changes.status.to}`
      }
      if (changes?.assigned_to) {
        return `${name} reassigned task "${meta?.taskName}"`
      }
      return `${name} updated task "${meta?.taskName ?? "unknown"}"`
    }
    case "project_updated": {
      const changes = meta?.changes as Record<
        string,
        { from: unknown; to: unknown }
      > | null
      if (changes?.status) {
        return `${name} changed project status from ${changes.status.from} to ${changes.status.to}`
      }
      return `${name} updated the project`
    }
    case "deliverable_created":
      return `${name} added deliverable "${meta?.deliverableName ?? "unknown"}"`
    case "deliverable_updated":
      return `${name} updated a deliverable`
    case "invoice_created":
      return `${name} created invoice ${meta?.invoiceNumber ?? ""} for $${meta?.amount ?? "0"}`
    case "team_member_created":
      return `${name} added ${meta?.memberName ?? "a team member"}`
    case "project_archived":
      return `${name} archived the project`
    default:
      return `${name} performed ${entry.action.replace(/_/g, " ")}`
  }
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (msgDate.getTime() >= today.getTime()) return "Today"
  if (msgDate.getTime() >= yesterday.getTime()) return "Yesterday"
  if (msgDate.getTime() >= weekAgo.getTime()) return "This Week"
  return "Earlier"
}

type FilterType = "all" | "status" | "tasks" | "messages" | "deliverables" | "invoices"

function matchesFilter(entry: ActivityEntry, filter: FilterType): boolean {
  if (filter === "all") return true
  if (filter === "status") return entry.action.includes("status") || entry.action === "project_updated"
  if (filter === "tasks") return entry.entityType === "task"
  if (filter === "messages") return entry.entityType === "message"
  if (filter === "deliverables") return entry.entityType === "deliverable"
  if (filter === "invoices") return entry.entityType === "invoice"
  return true
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectActivity({ projectId }: ProjectActivityProps) {
  const [filter, setFilter] = useState<FilterType>("all")

  const {
    data: activityData,
    isLoading,
    error,
  } = useQuery<{ activity: ActivityEntry[] }>({
    queryKey: ["activity", projectId],
    queryFn: async () => {
      return { activity: getMockActivity() }
    },
    enabled: !!projectId,
    staleTime: 30_000,
  })

  const filteredActivity = useMemo(() => {
    if (!activityData?.activity) return []
    return activityData.activity.filter((entry) =>
      matchesFilter(entry, filter)
    )
  }, [activityData?.activity, filter])

  const groupedActivity = useMemo(() => {
    const groups: { label: string; entries: ActivityEntry[] }[] = []
    let currentGroup = ""

    for (const entry of filteredActivity) {
      const group = getDateGroup(entry.createdAt)
      if (group !== currentGroup) {
        currentGroup = group
        groups.push({ label: group, entries: [] })
      }
      groups[groups.length - 1].entries.push(entry)
    }

    return groups
  }, [filteredActivity])

  if (isLoading) return <MessageListSkeleton rows={8} />

  if (error) {
    return (
      <EmptyState
        title="Failed to load activity"
        description="There was an error loading the activity log."
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    )
  }

  const FILTERS: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "status", label: "Status Changes" },
    { value: "tasks", label: "Tasks" },
    { value: "messages", label: "Messages" },
    { value: "deliverables", label: "Deliverables" },
    { value: "invoices", label: "Invoices" },
  ]

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Activity timeline */}
      {groupedActivity.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Activity will appear here as changes are made to this project."
        />
      ) : (
        <div className="space-y-6">
          {groupedActivity.map((group) => (
            <div key={group.label}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {group.label}
              </h4>

              <div className="relative space-y-0">
                {/* Timeline line */}
                <div className="absolute left-[15px] top-0 bottom-0 w-px bg-gray-200" />

                {group.entries.map((entry, i) => (
                  <div key={entry.id} className="relative flex gap-3 pb-4">
                    {/* Icon dot */}
                    <div
                      className={cn(
                        "relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full",
                        getActionColor(entry.action)
                      )}
                    >
                      {getActionIcon(entry.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm text-foreground">
                        {formatActionDescription(entry)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(entry.createdAt).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          }
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function getMockActivity(): ActivityEntry[] {
  const now = new Date()
  const makeDate = (hoursAgo: number) =>
    new Date(now.getTime() - hoursAgo * 3600000).toISOString()

  return [
    {
      id: "act_1",
      projectId: "proj_1",
      userId: "usr_1",
      action: "task_updated",
      entityType: "task",
      entityId: "task_4",
      metadata: {
        taskName: "Create homepage mockup",
        changes: { status: { from: "not_started", to: "in_progress" } },
      },
      createdAt: makeDate(2),
      userName: "Alex Rivera",
      userAvatarUrl: null,
    },
    {
      id: "act_2",
      projectId: "proj_1",
      userId: "usr_4",
      action: "deliverable_created",
      entityType: "deliverable",
      entityId: "del_3",
      metadata: { deliverableName: "Product Page Mockup", type: "screenshot" },
      createdAt: makeDate(6),
      userName: "Sam Chen",
      userAvatarUrl: null,
    },
    {
      id: "act_3",
      projectId: "proj_1",
      userId: "usr_1",
      action: "project_updated",
      entityType: "project",
      entityId: "proj_1",
      metadata: {
        changes: { status: { from: "requirements", to: "design" } },
      },
      createdAt: makeDate(24),
      userName: "Alex Rivera",
      userAvatarUrl: null,
    },
    {
      id: "act_4",
      projectId: "proj_1",
      userId: "usr_1",
      action: "invoice_created",
      entityType: "invoice",
      entityId: "inv_2",
      metadata: { invoiceNumber: "INV-2026-005", amount: "4000", currency: "CAD" },
      createdAt: makeDate(48),
      userName: "Alex Rivera",
      userAvatarUrl: null,
    },
    {
      id: "act_5",
      projectId: "proj_1",
      userId: "usr_3",
      action: "task_updated",
      entityType: "task",
      entityId: "task_2",
      metadata: {
        taskName: "Set up Shopify development store",
        changes: { status: { from: "in_progress", to: "completed" } },
      },
      createdAt: makeDate(72),
      userName: "Jamie Lopez",
      userAvatarUrl: null,
    },
    {
      id: "act_6",
      projectId: "proj_1",
      userId: "usr_1",
      action: "task_created",
      entityType: "task",
      entityId: "task_1",
      metadata: {
        taskName: "Gather brand assets from client",
        phaseName: "Project Setup",
      },
      createdAt: makeDate(168),
      userName: "Alex Rivera",
      userAvatarUrl: null,
    },
    {
      id: "act_7",
      projectId: "proj_1",
      userId: "usr_1",
      action: "invoice_created",
      entityType: "invoice",
      entityId: "inv_1",
      metadata: { invoiceNumber: "INV-2026-001", amount: "4000", currency: "CAD" },
      createdAt: makeDate(200),
      userName: "Alex Rivera",
      userAvatarUrl: null,
    },
  ]
}
