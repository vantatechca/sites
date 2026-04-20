"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  MoreHorizontal,
  Send,
  CheckCircle2,
  Download,
  DollarSign,
  Clock,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { EmptyState } from "@/components/shared/empty-state"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InvoiceData {
  id: string
  projectId: string
  clientId: string
  invoiceNumber: string
  amount: string
  currency: string
  description: string | null
  milestoneName: string | null
  status: string
  dueDate: string | null
  paidAt: string | null
  paymentMethod: string | null
  pdfUrl: string | null
  visibleToClient: boolean
  createdAt: string
  updatedAt: string
}

interface ProjectInvoicesProps {
  projectId: string
}

// ---------------------------------------------------------------------------
// Status colors
// ---------------------------------------------------------------------------

const INVOICE_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  draft: { label: "Draft", bg: "bg-gray-100", text: "text-gray-600" },
  sent: { label: "Sent", bg: "bg-blue-100", text: "text-blue-700" },
  viewed: { label: "Viewed", bg: "bg-indigo-100", text: "text-indigo-700" },
  paid: { label: "Paid", bg: "bg-emerald-100", text: "text-emerald-700" },
  overdue: { label: "Overdue", bg: "bg-red-100", text: "text-red-700" },
  cancelled: {
    label: "Cancelled",
    bg: "bg-gray-100",
    text: "text-gray-500",
  },
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

export function ProjectInvoices({ projectId }: ProjectInvoicesProps) {
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(
    null
  )

  // Form state
  const [formAmount, setFormAmount] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formMilestone, setFormMilestone] = useState("")
  const [formDueDate, setFormDueDate] = useState("")

  const {
    data: invoicesData,
    isLoading,
    error,
  } = useQuery<{ invoices: InvoiceData[] }>({
    queryKey: ["invoices", projectId],
    queryFn: async () => {
      try {
        return await fetchJSON(`/api/projects/${projectId}/invoices`)
      } catch {
        return { invoices: getMockInvoices() }
      }
    },
    enabled: !!projectId,
    staleTime: 30_000,
  })

  const createInvoice = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      return fetchJSON(`/api/projects/${projectId}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", projectId] })
      setCreateDialogOpen(false)
      resetForm()
    },
  })

  const resetForm = () => {
    setFormAmount("")
    setFormDescription("")
    setFormMilestone("")
    setFormDueDate("")
  }

  const handleCreate = () => {
    const amount = parseFloat(formAmount)
    if (isNaN(amount) || amount <= 0) return

    createInvoice.mutate({
      amount,
      description: formDescription.trim() || undefined,
      milestone_name: formMilestone.trim() || undefined,
      due_date: formDueDate || undefined,
    })
  }

  const invoices = invoicesData?.invoices ?? []
  const totalInvoiced = invoices.reduce(
    (sum, inv) => sum + parseFloat(inv.amount),
    0
  )
  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0)

  if (isLoading) return <TableSkeleton rows={4} cols={5} />

  if (error) {
    return (
      <EmptyState
        title="Failed to load invoices"
        description="There was an error loading the invoices."
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            Total Invoiced
          </div>
          <p className="mt-1 text-lg font-semibold text-[#1A1A2E]">
            ${totalInvoiced.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Total Paid
          </div>
          <p className="mt-1 text-lg font-semibold text-emerald-600">
            ${totalPaid.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Outstanding
          </div>
          <p className="mt-1 text-lg font-semibold text-amber-600">
            ${(totalInvoiced - totalPaid).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1A1A2E]">
          Invoices ({invoices.length})
        </h3>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Create Invoice
        </Button>
      </div>

      {/* Table */}
      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create invoices for project milestones and payments."
          actionLabel="Create Invoice"
          onAction={() => setCreateDialogOpen(true)}
        />
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Invoice #</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => {
                const statusConfig =
                  INVOICE_STATUS_CONFIG[inv.status] ??
                  INVOICE_STATUS_CONFIG.draft

                return (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <TableCell className="font-mono text-xs font-medium">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {inv.description ?? inv.milestoneName ?? "--"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${parseFloat(inv.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      <span className="text-xs text-muted-foreground">
                        {inv.currency}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                          statusConfig.bg,
                          statusConfig.text
                        )}
                      >
                        {statusConfig.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {inv.dueDate
                        ? new Date(inv.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "--"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {inv.paidAt
                        ? new Date(inv.paidAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "--"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Send className="h-4 w-4" />
                            Send to Client
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle2 className="h-4 w-4" />
                            Mark Paid
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Download className="h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Invoice detail sheet */}
      <Sheet
        open={!!selectedInvoice}
        onOpenChange={(open) => {
          if (!open) setSelectedInvoice(null)
        }}
      >
        <SheetContent side="right" className="sm:max-w-md">
          {selectedInvoice && (
            <>
              <SheetHeader className="p-4">
                <SheetTitle>
                  <FileText className="inline h-4 w-4 mr-1" />
                  {selectedInvoice.invoiceNumber}
                </SheetTitle>
                <SheetDescription>
                  Invoice details
                </SheetDescription>
              </SheetHeader>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-lg font-semibold">
                      $
                      {parseFloat(selectedInvoice.amount).toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2 }
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1",
                        INVOICE_STATUS_CONFIG[selectedInvoice.status]?.bg,
                        INVOICE_STATUS_CONFIG[selectedInvoice.status]?.text
                      )}
                    >
                      {INVOICE_STATUS_CONFIG[selectedInvoice.status]?.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="text-sm">
                      {selectedInvoice.dueDate
                        ? new Date(
                            selectedInvoice.dueDate
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "No due date"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Currency</p>
                    <p className="text-sm">{selectedInvoice.currency}</p>
                  </div>
                </div>
                {selectedInvoice.description && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Description
                    </p>
                    <p className="text-sm mt-1">
                      {selectedInvoice.description}
                    </p>
                  </div>
                )}
                {selectedInvoice.milestoneName && (
                  <div>
                    <p className="text-xs text-muted-foreground">Milestone</p>
                    <p className="text-sm mt-1">
                      {selectedInvoice.milestoneName}
                    </p>
                  </div>
                )}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Send className="h-4 w-4 mr-1" />
                    Send to Client
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="h-4 w-4 mr-1" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create invoice dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice for this project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-amount">Amount ($)</Label>
              <Input
                id="inv-amount"
                type="number"
                step="0.01"
                min="0"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-description">Description</Label>
              <Textarea
                id="inv-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Description..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-milestone">Milestone Name (optional)</Label>
              <Input
                id="inv-milestone"
                value={formMilestone}
                onChange={(e) => setFormMilestone(e.target.value)}
                placeholder="e.g. Design Phase Complete"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-due">Due Date</Label>
              <Input
                id="inv-due"
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formAmount || createInvoice.isPending}
            >
              {createInvoice.isPending ? "Creating..." : "Create Invoice"}
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

function getMockInvoices(): InvoiceData[] {
  const now = new Date()
  const makeDate = (daysAgo: number) =>
    new Date(now.getTime() - daysAgo * 86400000).toISOString()

  return [
    {
      id: "inv_1",
      projectId: "proj_1",
      clientId: "cli_1",
      invoiceNumber: "INV-2026-001",
      amount: "4000.00",
      currency: "CAD",
      description: "Project deposit - 33% upfront",
      milestoneName: "Project Kickoff",
      status: "paid",
      dueDate: makeDate(30),
      paidAt: makeDate(28),
      paymentMethod: "Stripe",
      pdfUrl: null,
      visibleToClient: true,
      createdAt: makeDate(35),
      updatedAt: makeDate(28),
    },
    {
      id: "inv_2",
      projectId: "proj_1",
      clientId: "cli_1",
      invoiceNumber: "INV-2026-005",
      amount: "4000.00",
      currency: "CAD",
      description: "Design phase completion",
      milestoneName: "Design Approved",
      status: "sent",
      dueDate: makeDate(-5),
      paidAt: null,
      paymentMethod: null,
      pdfUrl: null,
      visibleToClient: true,
      createdAt: makeDate(10),
      updatedAt: makeDate(10),
    },
    {
      id: "inv_3",
      projectId: "proj_1",
      clientId: "cli_1",
      invoiceNumber: "INV-2026-012",
      amount: "4000.00",
      currency: "CAD",
      description: "Final payment on launch",
      milestoneName: "Project Launch",
      status: "draft",
      dueDate: null,
      paidAt: null,
      paymentMethod: null,
      pdfUrl: null,
      visibleToClient: false,
      createdAt: makeDate(2),
      updatedAt: makeDate(2),
    },
  ]
}
