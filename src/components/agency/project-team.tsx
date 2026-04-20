"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  UserPlus,
  UserMinus,
  RefreshCw,
  Briefcase,
  Search,
  FolderKanban,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DEPARTMENT_LABELS } from "@/lib/constants"
import { ProjectCardSkeleton } from "@/components/shared/loading-skeleton"
import { EmptyState } from "@/components/shared/empty-state"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamMemberData {
  userId: string
  role: string
  department?: string
}

interface TeamMemberFull {
  id: string
  name: string
  email: string
  role: string
  avatarUrl: string | null
  department: string | null
  specialization: string | null
  maxConcurrentProjects: number | null
  currentProjectCount: number | null
  isActive: boolean
}

interface ProjectTeamProps {
  projectId: string
  teamMembers: TeamMemberData[]
  onAddMember: (userId: string, role: string) => void
  onRemoveMember: (userId: string) => void
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

export function ProjectTeam({
  projectId,
  teamMembers,
  onAddMember,
  onRemoveMember,
}: ProjectTeamProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch all agency team members
  const { data: allTeam, isLoading: teamLoading } = useQuery<{
    team: TeamMemberFull[]
  }>({
    queryKey: ["team"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/team")
        if (!res.ok) throw new Error("Failed to fetch team")
        return res.json()
      } catch {
        return { team: getMockTeam() }
      }
    },
    staleTime: 60_000,
  })

  const allTeamMembers = allTeam?.team ?? []

  // Map team member ids to full data
  const projectTeam = teamMembers
    .map((tm) => {
      const full = allTeamMembers.find((m) => m.id === tm.userId)
      return full
        ? { ...full, projectRole: tm.role, projectDepartment: tm.department }
        : null
    })
    .filter(Boolean) as (TeamMemberFull & {
    projectRole: string
    projectDepartment?: string
  })[]

  // Available members to add (not already on project)
  const existingIds = new Set(teamMembers.map((m) => m.userId))
  const availableMembers = allTeamMembers
    .filter((m) => !existingIds.has(m.id) && m.isActive)
    .filter(
      (m) =>
        !searchQuery ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.department &&
          m.department.toLowerCase().includes(searchQuery.toLowerCase()))
    )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#1A1A2E]">
            Project Team
          </h3>
          <p className="text-xs text-muted-foreground">
            {projectTeam.length} member{projectTeam.length !== 1 ? "s" : ""}{" "}
            assigned
          </p>
        </div>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-1" />
          Add Member
        </Button>
      </div>

      {/* Team grid */}
      {teamLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : projectTeam.length === 0 ? (
        <EmptyState
          title="No team members assigned"
          description="Add team members to this project to get started."
          actionLabel="Add Team Member"
          onAction={() => setAddDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projectTeam.map((member) => (
            <Card key={member.id} className="overflow-hidden">
              <CardContent className="pt-1">
                <div className="flex items-start gap-3">
                  <Avatar>
                    {member.avatarUrl && (
                      <AvatarImage
                        src={member.avatarUrl}
                        alt={member.name}
                      />
                    )}
                    <AvatarFallback>{initials(member.name)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[#1A1A2E] truncate">
                      {member.name}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email}
                    </p>
                  </div>
                </div>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {member.department && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-[#2D5A8C]">
                      {DEPARTMENT_LABELS[member.department] ??
                        member.department}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                    {member.projectRole}
                  </span>
                </div>

                {/* Workload */}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FolderKanban className="h-3.5 w-3.5" />
                  <span>
                    {member.currentProjectCount ?? 0}/
                    {member.maxConcurrentProjects ?? 5} projects
                  </span>
                  {(member.currentProjectCount ?? 0) >=
                    (member.maxConcurrentProjects ?? 5) && (
                    <span className="text-[10px] font-medium text-red-500">
                      At capacity
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2 border-t pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {}}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reassign
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onRemoveMember(member.id)}
                  >
                    <UserMinus className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add member dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Search and add a team member to this project.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or department..."
              className="pl-8"
            />
          </div>

          <ScrollArea className="max-h-[300px]">
            <div className="space-y-1">
              {availableMembers.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {searchQuery
                    ? "No matching team members found."
                    : "All team members are already assigned."}
                </p>
              ) : (
                availableMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      onAddMember(
                        member.id,
                        member.department ?? "team_member"
                      )
                      setAddDialogOpen(false)
                      setSearchQuery("")
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.department
                          ? DEPARTMENT_LABELS[member.department] ??
                            member.department
                          : "No department"}
                        {" -- "}
                        {member.currentProjectCount ?? 0}/
                        {member.maxConcurrentProjects ?? 5} projects
                      </p>
                    </div>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function getMockTeam(): TeamMemberFull[] {
  return [
    {
      id: "usr_1",
      name: "Alex Rivera",
      email: "alex@siteforge.dev",
      role: "manager",
      avatarUrl: null,
      department: "project_management",
      specialization: "Project Strategy",
      maxConcurrentProjects: 8,
      currentProjectCount: 3,
      isActive: true,
    },
    {
      id: "usr_2",
      name: "Jordan Kim",
      email: "jordan@siteforge.dev",
      role: "manager",
      avatarUrl: null,
      department: "project_management",
      specialization: "Client Relations",
      maxConcurrentProjects: 8,
      currentProjectCount: 3,
      isActive: true,
    },
    {
      id: "usr_3",
      name: "Jamie Lopez",
      email: "jamie@siteforge.dev",
      role: "team_member",
      avatarUrl: null,
      department: "development",
      specialization: "Shopify Theme Development",
      maxConcurrentProjects: 5,
      currentProjectCount: 2,
      isActive: true,
    },
    {
      id: "usr_4",
      name: "Sam Chen",
      email: "sam@siteforge.dev",
      role: "team_member",
      avatarUrl: null,
      department: "design",
      specialization: "UI/UX Design",
      maxConcurrentProjects: 5,
      currentProjectCount: 4,
      isActive: true,
    },
    {
      id: "usr_5",
      name: "Taylor Reed",
      email: "taylor@siteforge.dev",
      role: "team_member",
      avatarUrl: null,
      department: "content",
      specialization: "Content Strategy",
      maxConcurrentProjects: 6,
      currentProjectCount: 2,
      isActive: true,
    },
    {
      id: "usr_6",
      name: "Casey Morgan",
      email: "casey@siteforge.dev",
      role: "team_member",
      avatarUrl: null,
      department: "qa",
      specialization: "Testing & QA",
      maxConcurrentProjects: 4,
      currentProjectCount: 1,
      isActive: true,
    },
  ]
}
