"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface MilestoneItem {
  id: string;
  label: string;
  date?: string;
  subtitle?: string;
  status: "completed" | "current" | "upcoming";
}

interface MilestoneTimelineProps {
  milestones: MilestoneItem[];
  className?: string;
}

export function MilestoneTimeline({
  milestones,
  className,
}: MilestoneTimelineProps) {
  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <div className="h-3 w-3 rounded-full bg-gray-300" />
        </div>
        <p className="mt-4 text-sm font-medium text-gray-500">
          No milestones yet
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Milestones will appear here as your project progresses.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {milestones.map((milestone, index) => {
        const isLast = index === milestones.length - 1;
        const isCompleted = milestone.status === "completed";
        const isCurrent = milestone.status === "current";

        return (
          <div
            key={milestone.id}
            className={cn(
              "relative flex gap-4 pb-8",
              isLast && "pb-0",
              "animate-in fade-in slide-in-from-left-2 duration-300",
            )}
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: "backwards" }}
          >
            {/* Connector line + dot */}
            <div className="relative flex flex-col items-center">
              {/* Dot */}
              <div
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  isCompleted &&
                    "border-emerald-500 bg-emerald-500 text-white",
                  isCurrent &&
                    "border-[var(--portal-primary,#4F46E5)] bg-white",
                  milestone.status === "upcoming" &&
                    "border-gray-200 bg-white"
                )}
              >
                {isCompleted && <Check className="h-4 w-4" strokeWidth={3} />}
                {isCurrent && (
                  <>
                    <div className="h-3 w-3 rounded-full bg-[var(--portal-primary,#4F46E5)]" />
                    <div className="absolute inset-0 rounded-full border-2 border-[var(--portal-primary,#4F46E5)] animate-ping opacity-30" />
                  </>
                )}
                {milestone.status === "upcoming" && (
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                )}
              </div>

              {/* Line */}
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-[24px]",
                    isCompleted ? "bg-emerald-300" : "border-l-2 border-dashed border-gray-200"
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn("flex-1 pb-2 pt-1", isLast && "pb-0")}>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                <h3
                  className={cn(
                    "text-sm font-semibold",
                    isCompleted && "text-gray-900",
                    isCurrent && "text-[var(--portal-primary,#4F46E5)]",
                    milestone.status === "upcoming" && "text-gray-400"
                  )}
                >
                  {milestone.label}
                </h3>
                {milestone.date && (
                  <span
                    className={cn(
                      "text-xs",
                      isCompleted && "text-emerald-600",
                      isCurrent && "font-medium text-[var(--portal-primary,#4F46E5)]",
                      milestone.status === "upcoming" && "text-gray-400"
                    )}
                  >
                    {isCurrent
                      ? "In Progress"
                      : milestone.status === "upcoming"
                        ? "Upcoming"
                        : milestone.date}
                  </span>
                )}
              </div>
              {milestone.subtitle && (
                <p
                  className={cn(
                    "mt-1 text-sm",
                    milestone.status === "upcoming"
                      ? "text-gray-300"
                      : "text-gray-500"
                  )}
                >
                  {milestone.subtitle}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
