"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ProjectCard } from "@/components/agency/project-card"
import { NewProjectDialog } from "@/components/agency/new-project-dialog"
import { useProjects, type ProjectFilters } from "@/hooks/use-projects"
import type { ProjectStatus, ProjectTier, ProjectWithDetails } from "@/types"
import { TIER_CONFIG, PROJECT_STATUS_MAP } from "@/types"

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "intake", label: "Intake" },
  { value: "requirements", label: "Requirements" },
  { value: "design", label: "Design" },
  { value: "development", label: "Development" },
  { value: "content", label: "Content" },
  { value: "review_internal", label: "Internal Review" },
  { value: "client_review", label: "Client Review" },
  { value: "revisions", label: "Revisions" },
  { value: "final_qa", label: "Final QA" },
  { value: "launch_prep", label: "Launch Prep" },
  { value: "launched", label: "Launched" },
  { value: "post_launch", label: "Post-Launch" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
]

const TIER_OPTIONS: { value: ProjectTier | "all"; label: string }[] = [
  { value: "all", label: "All Tiers" },
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tierBadgeClasses(tier: ProjectTier): string {
  switch (tier) {
    case "basic":
      return "bg-gray-100 text-gray-700"
    case "pro":
      return "bg-blue-50 text-[#2D5A8C]"
    case "enterprise":
      return "bg-amber-50 text-amber-700"
  }
}

function statusBadgeClasses(status: ProjectStatus): string {
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

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(d: Date | string | null): string {
  if (!d) return "--"
  const date = new Date(d)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ---------------------------------------------------------------------------
// Select wrapper (native, styled to match)
// ---------------------------------------------------------------------------

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
// Loading skeleton
// ---------------------------------------------------------------------------

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 pt-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-14 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sort header helper
// ---------------------------------------------------------------------------

function SortableHeader({
  label,
  column,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string
  column: string
  currentSort: string
  currentOrder: "asc" | "desc"
  onSort: (col: string) => void
}) {
  const isActive = currentSort === column
  return (
    <button
      onClick={() => onSort(column)}
      className="inline-flex items-center gap-1 text-xs font-medium hover:text-[#2D5A8C] transition-colors"
    >
      {label}
      {isActive ? (
        currentOrder === "asc" ? (
          <ArrowUp className="size-3" />
        ) : (
          <ArrowDown className="size-3" />
        )
      ) : (
        <ArrowUpDown className="size-3 opacity-40" />
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function ProjectsPage() {
  const router = useRouter()

  // View state
  const [view, setView] = useState<"grid" | "list">("grid")

  // Filter state
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all")
  const [tierFilter, setTierFilter] = useState<ProjectTier | "all">("all")
  const [managerFilter, setManagerFilter] = useState<string>("all")

  // Pagination
  const [page, setPage] = useState(1)
  const pageSize = view === "grid" ? 12 : 10

  // Sort
  const [sortBy, setSortBy] = useState("updatedAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const handleSort = useCallback(
    (col: string) => {
      if (sortBy === col) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
      } else {
        setSortBy(col)
        setSortOrder("asc")
      }
    },
    [sortBy]
  )

  const filters: ProjectFilters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter,
      tier: tierFilter,
      managerId: managerFilter,
      page,
      pageSize,
      sortBy,
      sortOrder,
    }),
    [search, statusFilter, tierFilter, managerFilter, page, pageSize, sortBy, sortOrder]
  )

  const { data, isLoading, isError } = useProjects(filters)

  const projects = data?.projects ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  // Derive unique managers for PM filter from fetched projects
  const managerOptions = useMemo(() => {
    const seen = new Map<string, string>()
    projects.forEach((p) => {
      if (!p.managerId || !p.manager?.name) return
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
  }, [projects])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A2E]">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track all agency projects.
          </p>
        </div>
        <NewProjectDialog />
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>

          {/* Status */}
          <FilterSelect
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v as ProjectStatus | "all")
              setPage(1)
            }}
            options={STATUS_OPTIONS}
          />

          {/* Tier */}
          <FilterSelect
            value={tierFilter}
            onChange={(v) => {
              setTierFilter(v as ProjectTier | "all")
              setPage(1)
            }}
            options={TIER_OPTIONS}
          />

          {/* PM */}
          <FilterSelect
            value={managerFilter}
            onChange={(v) => {
              setManagerFilter(v)
              setPage(1)
            }}
            options={managerOptions}
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border p-0.5 bg-white shrink-0">
          <button
            onClick={() => setView("grid")}
            className={`rounded-md p-1.5 transition-colors ${
              view === "grid"
                ? "bg-[#2D5A8C] text-white"
                : "text-muted-foreground hover:text-[#1A1A2E]"
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-md p-1.5 transition-colors ${
              view === "list"
                ? "bg-[#2D5A8C] text-white"
                : "text-muted-foreground hover:text-[#1A1A2E]"
            }`}
            aria-label="List view"
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing {projects.length} of {total} projects
      </p>

      {/* Content */}
      {isLoading ? (
        view === "grid" ? (
          <GridSkeleton />
        ) : (
          <TableSkeleton />
        )
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-red-600 mb-2">
              Failed to load projects
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Please try refreshing the page.
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Filter className="size-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-[#1A1A2E] mb-1">
              No projects found
            </p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your filters or create a new project.
            </p>
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        /* ============ GRID VIEW ============ */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        /* ============ LIST VIEW ============ */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader
                    label="Project"
                    column="name"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="Client"
                    column="client"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>
                  <SortableHeader
                    label="Status"
                    column="status"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="Progress"
                    column="progressPercent"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead>PM</TableHead>
                <TableHead>
                  <SortableHeader
                    label="Start Date"
                    column="createdAt"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="Est. Completion"
                    column="estimatedLaunchDate"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/agency/projects/${project.id}`)
                  }
                >
                  <TableCell>
                    <span className="font-medium text-[#1A1A2E]">
                      {project.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {project.client.company ?? project.client.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tierBadgeClasses(project.tier)}`}
                    >
                      {TIER_CONFIG[project.tier].displayName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClasses(project.status)}`}
                    >
                      {PROJECT_STATUS_MAP[project.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${project.progressPercent}%`,
                            backgroundColor:
                              project.progressPercent >= 80
                                ? "#10B981"
                                : project.progressPercent >= 50
                                  ? "#2D5A8C"
                                  : "#F59E0B",
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[#1A1A2E] w-8 text-right">
                        {project.progressPercent}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Avatar size="sm">
                        {project.manager.avatarUrl && (
                          <AvatarImage
                            src={project.manager.avatarUrl}
                            alt={project.manager.name}
                          />
                        )}
                        <AvatarFallback>
                          {initials(project.manager.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {project.manager.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(project.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(project.estimatedLaunchDate)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="xs"
                  onClick={() => setPage(pageNum)}
                  className="min-w-[28px]"
                >
                  {pageNum}
                </Button>
              )
            })}
            {totalPages > 5 && (
              <span className="text-xs text-muted-foreground px-1">...</span>
            )}
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
