"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { TierBadge } from "@/components/shared/tier-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { ChecklistView } from "@/components/checklist/checklist-view"
import { ProjectMessages } from "@/components/agency/project-messages"
import { ProjectTeam } from "@/components/agency/project-team"
import { ProjectDeliverables } from "@/components/agency/project-deliverables"
import { ProjectInvoices } from "@/components/agency/project-invoices"
import { ProjectActivity } from "@/components/agency/project-activity"
import { ClientPreview } from "@/components/agency/client-preview"
import { StatusChangeDialog } from "@/components/agency/status-change-dialog"
import { useProject, useUpdateProject } from "@/hooks/use-projects"
import { useTasks } from "@/hooks/use-tasks"
import {
  ArrowLeft,
  RefreshCw,
  Pencil,
  ExternalLink,
  CalendarDays,
  Clock,
  DollarSign,
  ListChecks,
  MessageSquare,
  Users,
  Package,
  FileText,
  Activity,
  Monitor,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProjectStatus } from "@/types"
import { PROJECT_STATUS_MAP, getClientStatusLabel } from "@/types"
import type { TierKey } from "@/lib/constants"

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

function daysInStage(updatedAt: string | Date): number {
  const updated = new Date(updatedAt)
  const now = new Date()
  return Math.max(0, Math.floor((now.getTime() - updated.getTime()) / 86400000))
}

function getPriorityLabel(priority: number): {
  label: string
  color: string
} {
  if (priority <= 2) return { label: "Critical", color: "text-red-600 bg-red-50" }
  if (priority <= 4) return { label: "High", color: "text-orange-600 bg-orange-50" }
  if (priority <= 6) return { label: "Medium", color: "text-amber-600 bg-amber-50" }
  return { label: "Low", color: "text-gray-600 bg-gray-50" }
}

function formatCurrency(value: string | number | null | undefined): string {
  if (value == null) return "$0.00"
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return "$0.00"
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-7 w-60" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ProjectError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-red-50 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-[#1A1A2E]">
        Failed to load project
      </h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{message}</p>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        Try Again
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const {
    data: project,
    isLoading,
    error,
  } = useProject(projectId)

  const { data: tasksByPhase } = useTasks(projectId)
  const updateProject = useUpdateProject()

  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [localMembers, setLocalMembers] = useState<
    Array<{ userId: string; role: string; department?: string }> | null
  >(null)

  // Build team members array for checklist (from project data)
  const teamMembers = useMemo(() => {
    if (!project) return []
    const members = (project as unknown as Record<string, unknown>).teamMembers as
      | Array<{ userId: string; role: string; department?: string }>
      | undefined

    if (!members || !Array.isArray(members)) return []

    return members.map((m) => ({
      id: m.userId,
      name: m.userId, // Will be resolved by components that fetch team data
      avatarUrl: null,
      department: m.department ?? null,
    }))
  }, [project])

  // Handle status change
  const handleStatusChange = (newStatus: ProjectStatus, notes: string) => {
    updateProject.mutate(
      {
        id: projectId,
        data: {
          status: newStatus,
          ...(notes ? { internal_notes: notes } : {}),
        } as Record<string, unknown>,
      },
      {
        onSuccess: () => setStatusDialogOpen(false),
      }
    )
  }
const getCurrentMembers = () =>{
  if (localMembers !== null) return localMembers
  if (!project) return []
  return ((project as unknown as Record<string, unknown>)).teamMembers as Array<{
    userId: string
    role: string
    department?: string
  }> ?? []
}

const handleAddTeamMember = (userId: string, role: string) => {
  const current = getCurrentMembers()
  if (current.some((m) => m.userId === userId)) return 
  const updated =[...current, {userId, role}]
  setLocalMembers(updated)
  updateProject.mutate({
    id: projectId,
    data: { team_members: updated} as Record<string, unknown>,
  })
}
const handleRemoveTeamMember = (userId: string) => {
  const current = getCurrentMembers()
  const updated = current.filter((m) => m.userId !== userId)
  setLocalMembers(updated)
  updateProject.mutate({
    id: projectId,
    data: { team_members: updated} as Record<string, unknown>,
  })
}


  // Loading state
  if (isLoading) return <ProjectDetailSkeleton />

  // Error state
  if (error || !project) {
    return (
      <ProjectError
        message={
          error instanceof Error
            ? error.message
            : "The project could not be loaded."
        }
      />
    )
  }

  // Extract data (handle both schema shapes from types vs db)
  const proj = project as unknown as Record<string, unknown>
  const projectName =
    (proj.projectName as string) ?? (proj.name as string) ?? "Untitled"
  const clientData = proj.client as Record<string, unknown> | undefined
  const clientCompany =
    (clientData?.companyName as string) ??
    (clientData?.company as string) ??
    (clientData?.name as string) ??
    "Unknown Client"
  const status = (proj.status as ProjectStatus) ?? "intake"
  const tier = (proj.tier as TierKey) ?? "basic"
  const progressPercent = (proj.progressPercent as number) ?? 0
  const priority = (proj.priority as number) ?? 5
  const contractValue = proj.contractValue as string | null
  const estimatedCompletionDate = proj.estimatedCompletionDate as string | null
  const currentPhase = proj.currentPhase as string | null
  const updatedAt = (proj.updatedAt as string) ?? new Date().toISOString()
  const manager = proj.manager as Record<string, unknown> | undefined
  const managerName = (manager?.name as string) ?? "Unassigned"
  const managerAvatar = manager?.avatarUrl as string | null
  const projectMembers = localMembers !== null
    ? localMembers
    : (proj.teamMembers as Array<{
      userId: string
      role:string
      department?: string
    }>) ?? []

  const days = daysInStage(updatedAt)
  const priorityInfo = getPriorityLabel(priority)

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div>
        <Link
          href="/agency/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </div>

      {/* ================================================================== */}
      {/* HEADER SECTION                                                     */}
      {/* ================================================================== */}
      <div className="rounded-xl border bg-white p-6 space-y-4">
        {/* Top row: Name, badges, actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {clientCompany}
            </p>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">{projectName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <TierBadge tier={tier} />
              <StatusBadge status={status} />
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                  priorityInfo.color
                )}
              >
                {priorityInfo.label} Priority
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusDialogOpen(true)}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Change Status
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Pencil className="h-4 w-4 mr-1" />
              Edit Project
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(`/portal/${projectId}`, "_blank", "noopener,noreferrer")
              }
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View as Client
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Overall Progress
            </span>
            <span className="text-xs font-semibold text-[#1A1A2E]">
              {progressPercent}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPercent}%`,
                backgroundColor:
                  progressPercent >= 80
                    ? "#10B981"
                    : progressPercent >= 50
                      ? "#2D5A8C"
                      : "#F59E0B",
              }}
            />
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
          <div className="flex items-center gap-2 rounded-lg border bg-gray-50/50 p-3">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Days in Stage</p>
              <p className="text-sm font-semibold text-[#1A1A2E]">
                {days} day{days !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-gray-50/50 p-3">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">
                Est. Completion
              </p>
              <p className="text-sm font-semibold text-[#1A1A2E] truncate">
                {estimatedCompletionDate
                  ? new Date(estimatedCompletionDate).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    )
                  : "Not set"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-gray-50/50 p-3">
            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">
                Contract Value
              </p>
              <p className="text-sm font-semibold text-[#1A1A2E]">
                {formatCurrency(contractValue)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-gray-50/50 p-3">
            <Avatar size="sm" className="shrink-0">
              {managerAvatar && (
                <AvatarImage src={managerAvatar} alt={managerName} />
              )}
              <AvatarFallback>{initials(managerName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Manager</p>
              <p className="text-sm font-semibold text-[#1A1A2E] truncate">
                {managerName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* TABBED CONTENT                                                     */}
      {/* ================================================================== */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as number)}>
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value={0}>
            <ListChecks className="h-3.5 w-3.5 mr-1.5" />
            Checklist
          </TabsTrigger>
          <TabsTrigger value={1}>
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Messages
          </TabsTrigger>
          <TabsTrigger value={2}>
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Team
          </TabsTrigger>
          <TabsTrigger value={3}>
            <Package className="h-3.5 w-3.5 mr-1.5" />
            Deliverables
          </TabsTrigger>
          <TabsTrigger value={4}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value={5}>
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            Activity
          </TabsTrigger>
          <TabsTrigger value={6}>
            <Monitor className="h-3.5 w-3.5 mr-1.5" />
            Client Preview
          </TabsTrigger>
        </TabsList>

        {/* Checklist tab */}
        <TabsContent value={0} className="mt-4">
          <ChecklistView projectId={projectId} teamMembers={teamMembers} />
        </TabsContent>

        {/* Messages tab */}
        <TabsContent value={1} className="mt-4">
          <ProjectMessages projectId={projectId} />
        </TabsContent>

        {/* Team tab */}
        <TabsContent value={2} className="mt-4">
          <ProjectTeam
            projectId={projectId}
            teamMembers={projectMembers}
            onAddMember={handleAddTeamMember}
            onRemoveMember={handleRemoveTeamMember}
          />
        </TabsContent>

        {/* Deliverables tab */}
        <TabsContent value={3} className="mt-4">
          <ProjectDeliverables projectId={projectId} />
        </TabsContent>

        {/* Invoices tab */}
        <TabsContent value={4} className="mt-4">
          <ProjectInvoices projectId={projectId} />
        </TabsContent>

        {/* Activity tab */}
        <TabsContent value={5} className="mt-4">
          <ProjectActivity projectId={projectId} />
        </TabsContent>

        {/* Client Preview tab */}
        <TabsContent value={6} className="mt-4">
          <ClientPreview
            projectName={projectName}
            status={status}
            statusLabel={
              PROJECT_STATUS_MAP[status] ?? getClientStatusLabel(status)
            }
            progressPercent={progressPercent}
            currentPhase={currentPhase}
            estimatedCompletionDate={estimatedCompletionDate}
            tasksByPhase={tasksByPhase}
          />
        </TabsContent>
      </Tabs>

      {/* Status change dialog */}
      <StatusChangeDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        currentStatus={status}
        onConfirm={handleStatusChange}
        isPending={updateProject.isPending}
      />
    </div>
  )
}
