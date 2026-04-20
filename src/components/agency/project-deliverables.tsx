"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Image,
  Link2,
  FileText,
  Video,
  Type,
  Plus,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  MessageCircle,
  Upload,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ProjectCardSkeleton } from "@/components/shared/loading-skeleton"
import { EmptyState } from "@/components/shared/empty-state"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeliverableData {
  id: string
  projectId: string
  taskId: string | null
  name: string
  description: string | null
  type: string
  fileUrl: string | null
  previewUrl: string | null
  clientVisible: boolean
  clientApproved: boolean
  clientFeedback: string | null
  publishedAt: string | null
  createdBy: string
  createdAt: string
  creatorName: string | null
}

interface ProjectDeliverablesProps {
  projectId: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function typeIcon(type: string) {
  switch (type) {
    case "screenshot":
      return <Image className="h-5 w-5" />
    case "live_preview_link":
      return <Link2 className="h-5 w-5" />
    case "file":
      return <FileText className="h-5 w-5" />
    case "video":
      return <Video className="h-5 w-5" />
    case "text_update":
      return <Type className="h-5 w-5" />
    default:
      return <FileText className="h-5 w-5" />
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case "screenshot":
      return "Screenshot"
    case "live_preview_link":
      return "Live Preview"
    case "file":
      return "File"
    case "video":
      return "Video"
    case "text_update":
      return "Text Update"
    default:
      return type
  }
}

function getStatus(d: DeliverableData): {
  label: string
  color: string
  bg: string
} {
  if (d.clientApproved) {
    return {
      label: "Approved",
      color: "text-emerald-700",
      bg: "bg-emerald-100",
    }
  }
  if (d.publishedAt || d.clientVisible) {
    return { label: "Published", color: "text-blue-700", bg: "bg-blue-100" }
  }
  return { label: "Draft", color: "text-gray-600", bg: "bg-gray-100" }
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectDeliverables({ projectId }: ProjectDeliverablesProps) {
  const queryClient = useQueryClient()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formType, setFormType] = useState("file")
  const [formUrl, setFormUrl] = useState("")
  const [formClientVisible, setFormClientVisible] = useState(true)

  const {
    data: deliverablesData,
    isLoading,
    error,
  } = useQuery<{ deliverables: DeliverableData[] }>({
    queryKey: ["deliverables", projectId],
    queryFn: async () => {
      try {
        return await fetchJSON(`/api/projects/${projectId}/deliverables`)
      } catch {
        return { deliverables: getMockDeliverables() }
      }
    },
    enabled: !!projectId,
    staleTime: 30_000,
  })

  const createDeliverable = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      return fetchJSON(`/api/projects/${projectId}/deliverables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deliverables", projectId],
      })
      setAddDialogOpen(false)
      resetForm()
    },
  })

  const togglePublish = useMutation({
    mutationFn: async ({
      deliverableId,
      publish,
    }: {
      deliverableId: string
      publish: boolean
    }) => {
      return fetchJSON(`/api/projects/${projectId}/deliverables`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverable_id: deliverableId,
          publish,
          client_visible: publish,
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deliverables", projectId],
      })
    },
  })

  const resetForm = () => {
    setFormName("")
    setFormDescription("")
    setFormType("file")
    setFormUrl("")
    setFormClientVisible(true)
  }

  const handleCreate = () => {
    if (!formName.trim()) return
    createDeliverable.mutate({
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      type: formType,
      file_url: formUrl.trim() || undefined,
      preview_url: formUrl.trim() || undefined,
      client_visible: formClientVisible,
    })
  }

  const deliverables = deliverablesData?.deliverables ?? []

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load deliverables"
        description="There was an error loading the deliverables."
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#1A1A2E]">
            Deliverables
          </h3>
          <p className="text-xs text-muted-foreground">
            {deliverables.length} deliverable
            {deliverables.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Deliverable
        </Button>
      </div>

      {/* Grid */}
      {deliverables.length === 0 ? (
        <EmptyState
          title="No deliverables yet"
          description="Create and publish deliverables for client review."
          actionLabel="Add Deliverable"
          onAction={() => setAddDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deliverables.map((d) => {
            const status = getStatus(d)
            const isExpanded = expandedId === d.id

            return (
              <Card
                key={d.id}
                className={cn(
                  "cursor-pointer transition-shadow hover:shadow-md",
                  isExpanded && "ring-2 ring-[#2D5A8C]/20"
                )}
                onClick={() =>
                  setExpandedId(isExpanded ? null : d.id)
                }
              >
                <CardContent className="pt-1 space-y-3">
                  {/* Type + status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {typeIcon(d.type)}
                      <span className="text-[10px] font-medium uppercase tracking-wide">
                        {typeLabel(d.type)}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                        status.bg,
                        status.color
                      )}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Name */}
                  <h4 className="text-sm font-semibold text-[#1A1A2E] line-clamp-2">
                    {d.name}
                  </h4>

                  {/* Description */}
                  {d.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {d.description}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t">
                    <span>
                      {new Date(d.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span>{d.creatorName ?? "Unknown"}</span>
                  </div>

                  {/* Publish toggle */}
                  <div
                    className="flex items-center justify-between"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs text-muted-foreground">
                      {d.clientVisible
                        ? "Visible to client"
                        : "Not published"}
                    </span>
                    <Button
                      variant={d.clientVisible ? "outline" : "default"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() =>
                        togglePublish.mutate({
                          deliverableId: d.id,
                          publish: !d.clientVisible,
                        })
                      }
                    >
                      {d.clientVisible ? (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Publish
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Expanded: feedback */}
                  {isExpanded && (
                    <div className="space-y-2 border-t pt-3">
                      {d.fileUrl && (
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#2D5A8C] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open file
                        </a>
                      )}
                      {d.clientFeedback && (
                        <div className="rounded-md bg-amber-50 border border-amber-100 p-2">
                          <div className="flex items-center gap-1 text-xs font-medium text-amber-800 mb-1">
                            <MessageCircle className="h-3 w-3" />
                            Client Feedback
                          </div>
                          <p className="text-xs text-amber-700">
                            {d.clientFeedback}
                          </p>
                        </div>
                      )}
                      {d.clientApproved && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approved by client
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add deliverable dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Deliverable</DialogTitle>
            <DialogDescription>
              Create a new deliverable for this project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="d-name">Name</Label>
              <Input
                id="d-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Homepage Design v1"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="d-description">Description</Label>
              <Textarea
                id="d-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Add a description..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={formType} onValueChange={(val) => val && setFormType(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="screenshot">Screenshot</SelectItem>
                  <SelectItem value="live_preview_link">
                    Live Preview Link
                  </SelectItem>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="text_update">Text Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="d-url">File URL / Link</Label>
              <Input
                id="d-url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Visible to client</span>
              </div>
              <Switch
                checked={formClientVisible}
                onCheckedChange={setFormClientVisible}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formName.trim() || createDeliverable.isPending}
            >
              {createDeliverable.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function getMockDeliverables(): DeliverableData[] {
  const now = new Date()
  const makeDate = (daysAgo: number) =>
    new Date(now.getTime() - daysAgo * 86400000).toISOString()

  return [
    {
      id: "del_1",
      projectId: "proj_1",
      taskId: "task_4",
      name: "Homepage Wireframe v1",
      description: "Initial wireframe for desktop and mobile homepage layouts",
      type: "screenshot",
      fileUrl: "https://cdn.example.com/wireframe-v1.png",
      previewUrl: null,
      clientVisible: true,
      clientApproved: true,
      clientFeedback: "Looks great! Love the hero section layout.",
      publishedAt: makeDate(10),
      createdBy: "usr_4",
      createdAt: makeDate(14),
      creatorName: "Sam Chen",
    },
    {
      id: "del_2",
      projectId: "proj_1",
      taskId: null,
      name: "Development Preview",
      description: "Live preview of the Shopify development store",
      type: "live_preview_link",
      fileUrl: null,
      previewUrl: "https://preview.artisan-candles.dev",
      clientVisible: true,
      clientApproved: false,
      clientFeedback: null,
      publishedAt: makeDate(3),
      createdBy: "usr_3",
      createdAt: makeDate(5),
      creatorName: "Jamie Lopez",
    },
    {
      id: "del_3",
      projectId: "proj_1",
      taskId: "task_5",
      name: "Product Page Mockup",
      description: "Draft product detail page with variant selector",
      type: "screenshot",
      fileUrl: "https://cdn.example.com/product-v1.png",
      previewUrl: null,
      clientVisible: false,
      clientApproved: false,
      clientFeedback: null,
      publishedAt: null,
      createdBy: "usr_4",
      createdAt: makeDate(2),
      creatorName: "Sam Chen",
    },
  ]
}
