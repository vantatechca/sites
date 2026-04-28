"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, UserPlus, Search } from "lucide-react"
import { useCreateProject } from "@/hooks/use-projects"
import type { ProjectTier } from "@/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientOption {
  id: string
  name: string
  company: string | null
}

interface ManagerOption {
  id: string
  name: string
}

interface NewProjectDialogProps {
  clients?: ClientOption[]
  managers?: ManagerOption[]
  trigger?: React.ReactNode
}

// Mock options removed — dialog now fetches real data from /api/clients and /api/team

// ---------------------------------------------------------------------------
// Tier radio button
// ---------------------------------------------------------------------------

function TierRadio({
  tier,
  label,
  description,
  selected,
  onSelect,
  colorClass,
}: {
  tier: ProjectTier
  label: string
  description: string
  selected: boolean
  onSelect: (t: ProjectTier) => void
  colorClass: string
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tier)}
      className={`flex-1 rounded-lg border-2 p-3 text-left transition-all ${
        selected
          ? `${colorClass} ring-1 ring-offset-1`
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="block text-xs text-muted-foreground mt-0.5">
        {description}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function NewProjectDialog({
  clients: clientsProp,
  managers: managersProp,
  trigger,
}: NewProjectDialogProps) {
  const router = useRouter()
  const createProject = useCreateProject()

  const [fetchedClients, setFetchedClients] = useState<ClientOption[]>([])
  const [fetchedManagers, setFetchedManagers] = useState<ManagerOption[]>([])

  const clients = clientsProp ?? fetchedClients
  const managers = managersProp ?? fetchedManagers

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"existing" | "new">("new")

  // Fetch real clients and managers when dialog opens
  useEffect(() => {
    if (!open) return

    fetch("/api/clients")
      .then((res) => (res.ok ? res.json() : { clients: [] }))
      .then((data) => {
        const list = Array.isArray(data) ? data : data.clients ?? []
        setFetchedClients(
          list.map(
            (c: {
              id: string
              contactName?: string
              companyName?: string
              name?: string
              company?: string
            }) => ({
              id: c.id,
              name: c.contactName ?? c.name ?? "Unknown",
              company: c.companyName ?? c.company ?? null,
            })
          )
        )
      })
      .catch(() => setFetchedClients([]))

    fetch("/api/team")
      .then((res) => (res.ok ? res.json() : { team: [] }))
      .then((data) => {
        const list = Array.isArray(data) ? data : data.team ?? data.users ?? []
        setFetchedManagers(
          list
            .filter(
              (u: { role?: string }) =>
                u.role === "admin" || u.role === "manager" || u.role === "team_member"
            )
            .map((u: { id: string; name: string }) => ({
              id: u.id,
              name: u.name,
            }))
        )
      })
      .catch(() => setFetchedManagers([]))
  }, [open])

  // Form state
  const [clientId, setClientId] = useState("")
  const [clientSearch, setClientSearch] = useState("")
  const [newClientName, setNewClientName] = useState("")
  const [newClientEmail, setNewClientEmail] = useState("")
  const [newClientCompany, setNewClientCompany] = useState("")
  const [projectName, setProjectName] = useState("")
  const [storeUrl, setStoreUrl] = useState("")
  const [liveDomain, setLiveDomain] = useState("")
  const [tier, setTier] = useState<ProjectTier>("pro")
  const [startDate, setStartDate] = useState("")
  const [estCompletion, setEstCompletion] = useState("")
  const [managerId, setManagerId] = useState("")
  const [contractValue, setContractValue] = useState("")
  const [internalNotes, setInternalNotes] = useState("")

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.company ?? "").toLowerCase().includes(clientSearch.toLowerCase())
  )

  const resetForm = useCallback(() => {
    setClientId("")
    setClientSearch("")
    setNewClientName("")
    setNewClientEmail("")
    setNewClientCompany("")
    setProjectName("")
    setStoreUrl("")
    setLiveDomain("")
    setTier("pro")
    setStartDate("")
    setEstCompletion("")
    setManagerId("")
    setContractValue("")
    setInternalNotes("")
    setMode("existing")
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const resolvedClientId =
      mode === "existing"
        ? clientId
        : "new"

    try {
      const result = await createProject.mutateAsync({
        name: projectName,
        clientId: resolvedClientId,
        tier,
        storeUrl: storeUrl || undefined,
        previewUrl: liveDomain || undefined,
        managerId,
        estimatedLaunchDate: estCompletion || undefined,
        totalBudget: contractValue ? parseFloat(contractValue) : undefined,
        description: internalNotes || undefined,
        newClientName: mode === "new" ? newClientName : undefined,
        newClientEmail: mode === "new" ? newClientEmail : undefined,
        newClientCompany: mode === "new" ? newClientCompany : undefined,
      })

      setOpen(false)
      resetForm()
      router.push(`/agency/projects/${result.id}`)
    } catch {
      // Error handled by mutation state
    }
  }

  const canSubmit =
    projectName.trim() &&
    (mode === "existing" ? clientId : newClientName.trim() && newClientEmail.trim()) &&
    managerId &&
    !createProject.isPending

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
      <DialogTrigger
        render={
          trigger ? (
            <>{trigger}</>
          ) : (
            <Button>
              <Plus className="size-4 mr-1" />
              New Project
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new Shopify project for a client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Client selection toggle */}
          <div className="space-y-3">
            <Label>Client</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "existing" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("existing")}
              >
                <Search className="size-3 mr-1" />
                Existing Client
              </Button>
              <Button
                type="button"
                variant={mode === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("new")}
              >
                <UserPlus className="size-3 mr-1" />
                New Client
              </Button>
            </div>

            {mode === "existing" ? (
              <div className="space-y-2">
                <Input
                  placeholder="Search clients..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
                <div className="max-h-32 overflow-y-auto rounded-lg border divide-y">
                  {filteredClients.length === 0 && (
                    <p className="p-3 text-xs text-muted-foreground text-center">
                      No clients found
                    </p>
                  )}
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setClientId(c.id)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                        clientId === c.id
                          ? "bg-[#2D5A8C]/5 text-[#2D5A8C] font-medium"
                          : ""
                      }`}
                    >
                      <span className="block font-medium">{c.name}</span>
                      {c.company && (
                        <span className="block text-xs text-muted-foreground">
                          {c.company}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="Client name"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    required={mode === "new"}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    placeholder="client@example.com"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    required={mode === "new"}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Company</Label>
                  <Input
                    placeholder="Company name (optional)"
                    value={newClientCompany}
                    onChange={(e) => setNewClientCompany(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Project Name */}
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="e.g. Brand Store Redesign"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>

          {/* URLs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Shopify Store URL</Label>
              <Input
                placeholder="store.myshopify.com"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Live Domain</Label>
              <Input
                placeholder="www.example.com"
                value={liveDomain}
                onChange={(e) => setLiveDomain(e.target.value)}
              />
            </div>
          </div>

          {/* Tier */}
          <div className="space-y-2">
            <Label>Tier</Label>
            <div className="flex gap-2">
              <TierRadio
                tier="basic"
                label="Basic"
                description="Standard setup"
                selected={tier === "basic"}
                onSelect={setTier}
                colorClass="border-gray-500 bg-gray-50"
              />
              <TierRadio
                tier="pro"
                label="Pro"
                description="Custom design + SEO"
                selected={tier === "pro"}
                onSelect={setTier}
                colorClass="border-[#2D5A8C] bg-blue-50"
              />
              <TierRadio
                tier="enterprise"
                label="Enterprise"
                description="Full service"
                selected={tier === "enterprise"}
                onSelect={setTier}
                colorClass="border-amber-500 bg-amber-50"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Est. Completion</Label>
              <Input
                type="date"
                value={estCompletion}
                onChange={(e) => setEstCompletion(e.target.value)}
              />
            </div>
          </div>

          {/* PM + value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Project Manager</Label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                required
              >
                <option value="">Select PM...</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Contract Value ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
              />
            </div>
          </div>

          {/* Internal Notes */}
          <div className="space-y-1.5">
            <Label>Internal Notes</Label>
            <Textarea
              placeholder="Any internal notes about this project..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="min-h-20"
            />
          </div>

          {/* Error display */}
          {createProject.isError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
              Failed to create project. Please try again.
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {createProject.isPending ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="size-4 mr-1" />
                  Create Project
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
