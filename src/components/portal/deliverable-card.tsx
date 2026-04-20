"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Image,
  ExternalLink,
  FileDown,
  Play,
  FileText,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import type { DeliverableType } from "@/types";

export interface DeliverableCardData {
  id: string;
  type: DeliverableType;
  title: string;
  description: string | null;
  fileUrl: string | null;
  previewUrl: string | null;
  isApproved: boolean;
  createdAt: string;
  commentCount?: number;
}

interface DeliverableCardProps {
  deliverable: DeliverableCardData;
  onView: (id: string) => void;
  onFeedback: (id: string) => void;
  className?: string;
}

const TYPE_CONFIG: Record<
  DeliverableType,
  { icon: typeof Image; label: string; bgColor: string; iconColor: string }
> = {
  screenshot: {
    icon: Image,
    label: "Screenshot",
    bgColor: "bg-violet-50",
    iconColor: "text-violet-500",
  },
  live_preview_link: {
    icon: ExternalLink,
    label: "Live Preview",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  file: {
    icon: FileDown,
    label: "File",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-500",
  },
  video: {
    icon: Play,
    label: "Video",
    bgColor: "bg-rose-50",
    iconColor: "text-rose-500",
  },
  text_update: {
    icon: FileText,
    label: "Update",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-500",
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DeliverableCard({
  deliverable,
  onView,
  onFeedback,
  className,
}: DeliverableCardProps) {
  const config = TYPE_CONFIG[deliverable.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white transition-all hover:shadow-md hover:border-gray-200",
        className
      )}
    >
      {/* Thumbnail / Icon area */}
      <button
        onClick={() => onView(deliverable.id)}
        className="relative flex h-40 w-full items-center justify-center overflow-hidden bg-gray-50 transition-colors group-hover:bg-gray-100/80"
      >
        {deliverable.type === "screenshot" && deliverable.previewUrl ? (
          <img
            src={deliverable.previewUrl}
            alt={deliverable.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : deliverable.type === "video" && deliverable.previewUrl ? (
          <div className="relative flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
              <Play className="ml-1 h-6 w-6 text-gray-900" />
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl transition-transform group-hover:scale-110",
              config.bgColor
            )}
          >
            <Icon className={cn("h-7 w-7", config.iconColor)} />
          </div>
        )}

        {/* Approved badge overlay */}
        {deliverable.isApproved && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              <CheckCircle2 className="h-3 w-3" />
              Approved
            </div>
          </div>
        )}

        {/* Type badge */}
        <div className="absolute bottom-3 left-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm",
              config.bgColor,
              config.iconColor
            )}
          >
            <Icon className="h-2.5 w-2.5" />
            {config.label}
          </span>
        </div>
      </button>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <button
          onClick={() => onView(deliverable.id)}
          className="text-left"
        >
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-[var(--portal-primary,#4F46E5)] transition-colors">
            {deliverable.title}
          </h3>
        </button>
        {deliverable.description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
            {deliverable.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
          <span className="text-[11px] text-gray-400">
            {formatDate(deliverable.createdAt)}
          </span>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onFeedback(deliverable.id)}
            className="gap-1 text-gray-500 hover:text-[var(--portal-primary,#4F46E5)]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Feedback</span>
            {deliverable.commentCount !== undefined &&
              deliverable.commentCount > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-4 min-w-4 px-1 text-[10px]">
                  {deliverable.commentCount}
                </Badge>
              )}
          </Button>
        </div>
      </div>
    </div>
  );
}
