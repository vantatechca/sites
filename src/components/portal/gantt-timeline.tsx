"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface GanttPhase {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  color?: string;
  progress?: number;
}

interface GanttTimelineProps {
  phases: GanttPhase[];
  projectStart?: string;
  projectEnd?: string;
  className?: string;
}

const PHASE_COLORS = [
  "#4F46E5",
  "#7C3AED",
  "#2563EB",
  "#0891B2",
  "#059669",
  "#D97706",
  "#DC2626",
  "#DB2777",
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function GanttTimeline({
  phases,
  projectStart,
  projectEnd,
  className,
}: GanttTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { timelineStart, timelineEnd, totalDays, todayOffset, monthMarkers } =
    useMemo(() => {
      if (phases.length === 0) {
        const now = new Date();
        return {
          timelineStart: now,
          timelineEnd: now,
          totalDays: 1,
          todayOffset: 50,
          monthMarkers: [],
        };
      }

      const allStarts = phases.map((p) => new Date(p.startDate).getTime());
      const allEnds = phases.map((p) => new Date(p.endDate).getTime());

      const start = projectStart
        ? new Date(projectStart)
        : new Date(Math.min(...allStarts));
      const end = projectEnd
        ? new Date(projectEnd)
        : new Date(Math.max(...allEnds));

      const days =
        Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      const now = new Date();
      const todayPos =
        ((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) / days) *
        100;

      // Generate month markers
      const markers: { label: string; offset: number }[] = [];
      const current = new Date(start);
      current.setDate(1);
      current.setMonth(current.getMonth() + 1);

      while (current <= end) {
        const offset =
          ((current.getTime() - start.getTime()) /
            (1000 * 60 * 60 * 24) /
            days) *
          100;
        if (offset > 0 && offset < 100) {
          markers.push({ label: formatMonthYear(current.toISOString()), offset });
        }
        current.setMonth(current.getMonth() + 1);
      }

      return {
        timelineStart: start,
        timelineEnd: end,
        totalDays: days,
        todayOffset: todayPos,
        monthMarkers: markers,
      };
    }, [phases, projectStart, projectEnd]);

  if (phases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-gray-500">
          Timeline not available yet
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Your project timeline will appear here once phases are scheduled.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("space-y-4", className)}>
      {/* Date range header */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="font-medium">
          {formatDate(timelineStart.toISOString())}
        </span>
        <span className="font-medium">
          {formatDate(timelineEnd.toISOString())}
        </span>
      </div>

      {/* Timeline container */}
      <div className="relative overflow-x-auto rounded-xl border border-gray-100 bg-white">
        <div className="min-w-[480px] p-4 sm:p-6">
          {/* Month markers */}
          <div className="relative mb-6 h-6">
            {monthMarkers.map((marker, i) => (
              <div
                key={i}
                className="absolute top-0 flex flex-col items-center"
                style={{ left: `${marker.offset}%` }}
              >
                <span className="text-[10px] font-medium text-gray-400">
                  {marker.label}
                </span>
                <div className="mt-1 h-2 w-px bg-gray-200" />
              </div>
            ))}
          </div>

          {/* Phase bars */}
          <div className="space-y-3">
            {phases.map((phase, index) => {
              const startOffset =
                ((new Date(phase.startDate).getTime() -
                  timelineStart.getTime()) /
                  (1000 * 60 * 60 * 24) /
                  totalDays) *
                100;
              const width =
                ((new Date(phase.endDate).getTime() -
                  new Date(phase.startDate).getTime()) /
                  (1000 * 60 * 60 * 24) /
                  totalDays) *
                100;
              const color = phase.color || PHASE_COLORS[index % PHASE_COLORS.length];
              const isHovered = hoveredPhase === phase.key;

              return (
                <div key={phase.key} className="group relative">
                  {/* Label */}
                  <div className="mb-1.5 flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-medium text-gray-700">
                      {phase.label}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatDate(phase.startDate)} -{" "}
                      {formatDate(phase.endDate)}
                    </span>
                  </div>

                  {/* Bar track */}
                  <div className="relative h-8 w-full rounded-full bg-gray-50">
                    {/* Bar */}
                    <div
                      className={cn(
                        "absolute top-0 h-full rounded-full transition-all duration-700 ease-out",
                        isHovered && "shadow-md"
                      )}
                      style={{
                        left: `${Math.max(0, startOffset)}%`,
                        width: isVisible ? `${Math.min(width, 100 - startOffset)}%` : "0%",
                        backgroundColor: color,
                        opacity: isHovered ? 1 : 0.85,
                        transitionDelay: `${index * 100}ms`,
                      }}
                      onMouseEnter={() => setHoveredPhase(phase.key)}
                      onMouseLeave={() => setHoveredPhase(null)}
                    >
                      {/* Phase progress fill inside bar */}
                      {phase.progress !== undefined && phase.progress < 100 && (
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            width: `${phase.progress}%`,
                            backgroundColor: "rgba(255,255,255,0.25)",
                          }}
                        />
                      )}
                      {/* Label inside bar (if wide enough) */}
                      {width > 12 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white">
                          {phase.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div
                      className="absolute -top-10 z-20 rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg"
                      style={{
                        left: `${Math.max(0, startOffset + width / 2)}%`,
                        transform: "translateX(-50%)",
                      }}
                    >
                      {phase.label}: {formatDate(phase.startDate)} -{" "}
                      {formatDate(phase.endDate)}
                      {phase.progress !== undefined && (
                        <span className="ml-1.5 text-gray-300">
                          ({phase.progress}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Today marker */}
          {todayOffset >= 0 && todayOffset <= 100 && (
            <div
              className="absolute top-0 bottom-0 z-10 flex flex-col items-center"
              style={{ left: `calc(${todayOffset}% + 16px)` }}
            >
              <div className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                Today
              </div>
              <div className="w-px flex-1 bg-red-400/40" style={{ marginTop: 4 }} />
            </div>
          )}
        </div>
      </div>

      {/* Legend for mobile */}
      <div className="flex flex-wrap items-center gap-3 sm:hidden">
        {phases.map((phase, index) => (
          <div key={phase.key} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor:
                  phase.color || PHASE_COLORS[index % PHASE_COLORS.length],
              }}
            />
            <span className="text-[11px] text-gray-600">{phase.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
