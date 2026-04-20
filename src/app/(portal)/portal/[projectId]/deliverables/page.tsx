"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DeliverableCard,
  type DeliverableCardData,
} from "@/components/portal/deliverable-card";
import {
  Image,
  ExternalLink,
  FileDown,
  Play,
  FileText,
  CheckCircle2,
  Send,
  Package,
  X,
} from "lucide-react";
import type { DeliverableType } from "@/types";

// --- Types ---

interface Comment {
  id: string;
  content: string;
  senderName: string;
  senderRole: "client" | "agency";
  createdAt: string;
}

interface DeliverableFull extends DeliverableCardData {
  comments: Comment[];
  fileUrl: string | null;
  previewUrl: string | null;
  version: number;
}

// --- Helpers ---

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

const TYPE_ICONS: Record<DeliverableType, typeof Image> = {
  screenshot: Image,
  live_preview_link: ExternalLink,
  file: FileDown,
  video: Play,
  text_update: FileText,
};

// --- Component ---

export default function DeliverablesPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [deliverables, setDeliverables] = useState<DeliverableFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selected = deliverables.find((d) => d.id === selectedId) || null;
  const feedbackDeliverable =
    deliverables.find((d) => d.id === feedbackId) || null;

  const fetchDeliverables = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/deliverables`);
      if (!res.ok) throw new Error("API unavailable");
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : data.deliverables || [];
      setDeliverables(list);
    } catch {
      // Demo mode: mock deliverables
      setDeliverables([
        {
          id: "del_1",
          title: "Homepage Design Mockup v1",
          description: "Initial homepage design concept based on brand guidelines.",
          type: "screenshot" as DeliverableType,
          isApproved: false,
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          comments: [
            { id: "c1", content: "Looking great! Love the color palette.", senderName: "Demo Client", senderRole: "client" as const, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
          ],
          fileUrl: null,
          previewUrl: null,
          version: 1,
        },
        {
          id: "del_2",
          title: "Brand Guidelines Document",
          description: "Complete brand identity guide with logos, colors, and typography.",
          type: "file" as DeliverableType,
          isApproved: true,
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          comments: [],
          fileUrl: null,
          previewUrl: null,
          version: 1,
        },
        {
          id: "del_3",
          title: "Development Preview Link",
          description: "Live preview of the store in development. Password: preview2024",
          type: "live_preview_link" as DeliverableType,
          isApproved: false,
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          comments: [],
          fileUrl: null,
          previewUrl: null,
          version: 1,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDeliverables();
  }, [fetchDeliverables]);

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || !feedbackId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/deliverables/${feedbackId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: feedbackText.trim() }),
        }
      );

      if (res.ok) {
        setFeedbackText("");
        await fetchDeliverables();
      }
    } catch {
      // Error submitting
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleView = (id: string) => {
    setSelectedId(id);
    setFeedbackId(null);
  };

  const handleFeedback = (id: string) => {
    setFeedbackId(id);
    setSelectedId(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Deliverables
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View your project files, previews, and updates. Leave feedback
          directly on any item.
        </p>
      </div>

      {/* Empty state */}
      {deliverables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Package className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-gray-600">
            No deliverables yet
          </h3>
          <p className="mt-1.5 max-w-xs text-sm text-gray-400">
            Your team will share files, screenshots, and previews here as they
            progress on your project.
          </p>
        </div>
      ) : (
        /* Deliverables grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deliverables.map((deliverable, index) => (
            <div
              key={deliverable.id}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500"
              style={{ animationDelay: `${index * 60}ms`, animationFillMode: "backwards" }}
            >
              <DeliverableCard
                deliverable={{
                  ...deliverable,
                  commentCount: deliverable.comments?.length || 0,
                }}
                onView={handleView}
                onFeedback={handleFeedback}
              />
            </div>
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            setFeedbackId(null);
            setFeedbackText("");
          }
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.title}</SheetTitle>
                {selected.description && (
                  <SheetDescription>{selected.description}</SheetDescription>
                )}
              </SheetHeader>

              <div className="space-y-6 px-4 pb-6">
                {/* Meta info */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Published {formatDate(selected.createdAt)}</span>
                  {selected.version > 1 && (
                    <Badge variant="outline" className="text-[10px]">
                      v{selected.version}
                    </Badge>
                  )}
                  {selected.isApproved && (
                    <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Approved
                    </Badge>
                  )}
                </div>

                {/* Content area */}
                <div className="overflow-hidden rounded-lg border border-gray-100">
                  {selected.type === "screenshot" && selected.previewUrl && (
                    <img
                      src={selected.previewUrl}
                      alt={selected.title}
                      className="w-full"
                    />
                  )}
                  {selected.type === "video" && selected.previewUrl && (
                    <div className="flex aspect-video items-center justify-center bg-gray-900">
                      <a
                        href={selected.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-lg transition-transform hover:scale-105"
                      >
                        <Play className="h-4 w-4" />
                        Watch Video
                      </a>
                    </div>
                  )}
                  {selected.type === "live_preview_link" &&
                    selected.previewUrl && (
                      <div className="flex flex-col items-center gap-3 bg-blue-50 p-8 text-center">
                        <ExternalLink className="h-8 w-8 text-blue-500" />
                        <a
                          href={selected.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-800"
                        >
                          Open Live Preview
                        </a>
                      </div>
                    )}
                  {selected.type === "file" && selected.fileUrl && (
                    <div className="flex flex-col items-center gap-3 bg-amber-50 p-8 text-center">
                      <FileDown className="h-8 w-8 text-amber-500" />
                      <a
                        href={selected.fileUrl}
                        download
                        className="text-sm font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-800"
                      >
                        Download File
                      </a>
                    </div>
                  )}
                  {selected.type === "text_update" && (
                    <div className="p-4">
                      <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                        {selected.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Comments / Feedback section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Feedback{" "}
                    {selected.comments?.length > 0 && (
                      <span className="font-normal text-gray-400">
                        ({selected.comments.length})
                      </span>
                    )}
                  </h3>

                  {/* Existing comments */}
                  {selected.comments?.length > 0 ? (
                    <div className="space-y-3">
                      {selected.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={cn(
                            "rounded-lg p-3",
                            comment.senderRole === "client"
                              ? "ml-6 bg-[var(--portal-primary,#4F46E5)]/5"
                              : "mr-6 bg-gray-50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-700">
                              {comment.senderRole === "client"
                                ? "You"
                                : "Your Team"}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatDate(comment.createdAt)},{" "}
                              {formatTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      No feedback yet. Be the first to share your thoughts.
                    </p>
                  )}

                  {/* Feedback form */}
                  <div className="space-y-2">
                    <Textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Share your thoughts on this deliverable..."
                      className="min-h-20 resize-none text-sm"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleSubmitFeedback}
                        disabled={!feedbackText.trim() || isSubmitting}
                        style={{
                          backgroundColor: "var(--portal-primary, #4F46E5)",
                        }}
                      >
                        <Send className="h-3.5 w-3.5" />
                        {isSubmitting ? "Sending..." : "Send Feedback"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
