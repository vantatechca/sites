"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Receipt,
  Download,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  CreditCard,
} from "lucide-react";
import type { InvoiceStatus, InvoiceLineItem } from "@/types";

// --- Types ---

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  description: string | null;
  lineItems: InvoiceLineItem[];
  dueDate: string;
  sentAt: string | null;
  viewedAt: string | null;
  paidAt: string | null;
  stripeInvoiceUrl: string | null;
  milestoneLabel?: string;
  pdfUrl?: string;
}

// --- Status config ---

const STATUS_CONFIG: Record<
  InvoiceStatus,
  {
    label: string;
    icon: typeof Clock;
    color: string;
    bgColor: string;
    textColor: string;
  }
> = {
  draft: {
    label: "Draft",
    icon: FileText,
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
  },
  sent: {
    label: "Sent",
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
  },
  viewed: {
    label: "Viewed",
    icon: Eye,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
  },
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
  },
  overdue: {
    label: "Overdue",
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-gray-400",
    bgColor: "bg-gray-100",
    textColor: "text-gray-500",
  },
};

// --- Helpers ---

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100); // amounts stored in cents
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(dueDate: string, status: InvoiceStatus): boolean {
  if (status === "paid" || status === "cancelled") return false;
  return new Date(dueDate) < new Date();
}

// --- Component ---

export default function InvoicesPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = invoices.find((inv) => inv.id === selectedId) || null;

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch(`/api/projects/${projectId}/invoices`);
        if (!res.ok) throw new Error("API unavailable");
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : data.invoices || [];
        setInvoices(list);
      } catch {
        // No mock fallback — show empty invoices
        setInvoices([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvoices();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Summary stats
  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalOutstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled" && i.status !== "draft")
    .reduce((sum, i) => sum + i.amount, 0);
  const overdueCount = invoices.filter(
    (i) => isOverdue(i.dueDate, i.status)
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Invoices
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View your invoices, payment status, and download receipts.
        </p>
      </div>

      {/* Summary cards */}
      {invoices.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total Paid",
              value: formatCurrency(totalPaid, invoices[0]?.currency),
              icon: CheckCircle2,
              color: "text-emerald-500",
              bg: "bg-emerald-50",
            },
            {
              label: "Outstanding",
              value: formatCurrency(totalOutstanding, invoices[0]?.currency),
              icon: Clock,
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
            {
              label: "Overdue",
              value: overdueCount > 0 ? `${overdueCount} invoice${overdueCount > 1 ? "s" : ""}` : "None",
              icon: AlertCircle,
              color: overdueCount > 0 ? "text-red-500" : "text-gray-400",
              bg: overdueCount > 0 ? "bg-red-50" : "bg-gray-50",
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4",
                "animate-in fade-in slide-in-from-bottom-3 duration-500"
              )}
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  stat.bg
                )}
              >
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-sm font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Receipt className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-gray-600">
            No invoices yet
          </h3>
          <p className="mt-1.5 max-w-xs text-sm text-gray-400">
            Invoices will appear here as your project reaches billing milestones.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice, index) => {
            const statusConfig = STATUS_CONFIG[invoice.status];
            const StatusIcon = statusConfig.icon;
            const overdue = isOverdue(invoice.dueDate, invoice.status);

            return (
              <button
                key={invoice.id}
                onClick={() => setSelectedId(invoice.id)}
                className={cn(
                  "group flex w-full items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 text-left transition-all hover:border-gray-200 hover:shadow-sm",
                  "animate-in fade-in slide-in-from-bottom-2 duration-500",
                  invoice.status === "cancelled" && "opacity-60"
                )}
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
              >
                {/* Status icon */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    statusConfig.bgColor
                  )}
                >
                  <StatusIcon
                    className={cn("h-5 w-5", statusConfig.color)}
                  />
                </div>

                {/* Invoice info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-semibold text-gray-900",
                        invoice.status === "cancelled" && "line-through"
                      )}
                    >
                      {invoice.invoiceNumber}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        statusConfig.bgColor,
                        statusConfig.textColor
                      )}
                    >
                      {overdue ? "Overdue" : statusConfig.label}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {invoice.description || "Invoice"}
                  </p>
                </div>

                {/* Amount + due date */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-gray-900">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </p>
                  <p
                    className={cn(
                      "text-[11px]",
                      overdue ? "font-medium text-red-500" : "text-gray-400"
                    )}
                  >
                    {invoice.status === "paid"
                      ? `Paid ${invoice.paidAt ? formatDate(invoice.paidAt) : ""}`
                      : `Due ${formatDate(invoice.dueDate)}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Invoice Detail Sheet */}
      <Sheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Invoice {selected.invoiceNumber}</SheetTitle>
                <SheetDescription>
                  {selected.description || "Invoice details"}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-6">
                {/* Status + amount header */}
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-2xl font-bold tabular-nums text-gray-900">
                      {formatCurrency(selected.amount, selected.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                        STATUS_CONFIG[selected.status].bgColor,
                        STATUS_CONFIG[selected.status].textColor
                      )}
                    >
                      {(() => {
                        const Icon = STATUS_CONFIG[selected.status].icon;
                        return <Icon className="h-3.5 w-3.5" />;
                      })()}
                      {isOverdue(selected.dueDate, selected.status)
                        ? "Overdue"
                        : STATUS_CONFIG[selected.status].label}
                    </span>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Due Date</p>
                    <p className="mt-0.5 text-sm font-medium text-gray-900">
                      {formatDate(selected.dueDate)}
                    </p>
                  </div>
                  {selected.paidAt && (
                    <div>
                      <p className="text-xs text-gray-500">Paid On</p>
                      <p className="mt-0.5 text-sm font-medium text-emerald-700">
                        {formatDate(selected.paidAt)}
                      </p>
                    </div>
                  )}
                  {selected.milestoneLabel && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">
                        Linked Milestone
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-gray-900">
                        {selected.milestoneLabel}
                      </p>
                    </div>
                  )}
                </div>

                {/* Line items */}
                {selected.lineItems && selected.lineItems.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                      Breakdown
                    </h3>
                    <div className="overflow-hidden rounded-lg border border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50 text-xs text-gray-500">
                            <th className="px-3 py-2 text-left font-medium">
                              Description
                            </th>
                            <th className="px-3 py-2 text-right font-medium">
                              Qty
                            </th>
                            <th className="px-3 py-2 text-right font-medium">
                              Price
                            </th>
                            <th className="px-3 py-2 text-right font-medium">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.lineItems.map((item, i) => (
                            <tr
                              key={`${selected.id}-${i}-${item.description}`}
                              className="border-b border-gray-50 last:border-0"
                            >
                              <td className="px-3 py-2.5 text-gray-700">
                                {item.description}
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">
                                {item.quantity}
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">
                                {formatCurrency(
                                  item.unitPrice,
                                  selected.currency
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums font-medium text-gray-900">
                                {formatCurrency(item.total, selected.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t bg-gray-50">
                            <td
                              colSpan={3}
                              className="px-3 py-2.5 text-right text-xs font-semibold text-gray-700"
                            >
                              Total
                            </td>
                            <td className="px-3 py-2.5 text-right text-sm font-bold tabular-nums text-gray-900">
                              {formatCurrency(
                                selected.amount,
                                selected.currency
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Payment instructions */}
                {selected.status !== "paid" &&
                  selected.status !== "cancelled" &&
                  selected.status !== "draft" && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                      <div className="flex items-start gap-3">
                        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                        <div>
                          <h4 className="text-sm font-semibold text-blue-900">
                            Payment Instructions
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-blue-700">
                            {selected.stripeInvoiceUrl
                              ? "Click the button below to pay securely online."
                              : "Please contact your project manager for payment details."}
                          </p>
                          {selected.stripeInvoiceUrl && (
                            <a
                              href={selected.stripeInvoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              Pay Now
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Download PDF */}
                {(selected.pdfUrl || selected.stripeInvoiceUrl) && (
                  <div className="flex gap-2 border-t border-gray-100 pt-4">
                    {selected.pdfUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        render={
                          <a
                            href={selected.pdfUrl}
                            download
                          />
                        }
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download PDF
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
