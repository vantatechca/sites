"use client";

import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Check, Circle, Loader2 } from "lucide-react";

export interface PhaseTask {
  id: string;
  label: string;
  status: "completed" | "in_progress" | "not_started";
}

export interface Phase {
  key: string;
  label: string;
  tasks: PhaseTask[];
}

interface PhaseAccordionProps {
  phases: Phase[];
  className?: string;
}

function getPhaseProgress(tasks: PhaseTask[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === "completed").length;
  return Math.round((completed / tasks.length) * 100);
}

function TaskStatusIcon({ status }: { status: PhaseTask["status"] }) {
  switch (status) {
    case "completed":
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
        </div>
      );
    case "in_progress":
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100">
          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
        </div>
      );
    case "not_started":
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100">
          <Circle className="h-3 w-3 text-gray-300" />
        </div>
      );
  }
}

export function PhaseAccordion({ phases, className }: PhaseAccordionProps) {
  if (phases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-gray-500">
          No phase details available yet
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Phase information will appear here once your project kicks off.
        </p>
      </div>
    );
  }

  return (
    <Accordion className={cn("space-y-2", className)}>
      {phases.map((phase, index) => {
        const progress = getPhaseProgress(phase.tasks);
        const completedCount = phase.tasks.filter(
          (t) => t.status === "completed"
        ).length;

        return (
          <AccordionItem
            key={phase.key}
            value={phase.key}
            className={cn(
              "rounded-xl border border-gray-100 bg-white px-4 transition-shadow hover:shadow-sm",
              "animate-in fade-in slide-in-from-bottom-1 duration-300"
            )}
            style={{ animationDelay: `${index * 60}ms`, animationFillMode: "backwards" }}
          >
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex flex-1 flex-col gap-2.5 pr-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {phase.label}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {completedCount}/{phase.tasks.length} tasks
                  </span>
                </div>
                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${progress}%`,
                        backgroundColor:
                          progress === 100
                            ? "#10B981"
                            : "var(--portal-primary, #4F46E5)",
                      }}
                    />
                  </div>
                  <span className="w-9 text-right text-xs font-medium tabular-nums text-gray-500">
                    {progress}%
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-1 pt-1">
                {phase.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                      task.status === "in_progress" && "bg-blue-50/50",
                      task.status === "completed" && "bg-emerald-50/30"
                    )}
                  >
                    <TaskStatusIcon status={task.status} />
                    <span
                      className={cn(
                        "text-sm",
                        task.status === "completed" &&
                          "text-gray-500 line-through decoration-gray-300",
                        task.status === "in_progress" &&
                          "font-medium text-gray-900",
                        task.status === "not_started" && "text-gray-500"
                      )}
                    >
                      {task.label}
                    </span>
                    {task.status === "in_progress" && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                        In Progress
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
