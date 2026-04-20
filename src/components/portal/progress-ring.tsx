"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface PortalProgressRingProps {
  value: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  subtitle?: string;
  color?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: { outer: 120, stroke: 8, fontSize: "text-2xl", labelSize: "text-xs" },
  md: { outer: 200, stroke: 12, fontSize: "text-5xl", labelSize: "text-sm" },
  lg: { outer: 280, stroke: 14, fontSize: "text-6xl", labelSize: "text-base" },
};

export function PortalProgressRing({
  value,
  size = "md",
  label,
  subtitle,
  color,
  className,
}: PortalProgressRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const config = SIZE_MAP[size];
  const radius = (config.outer - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;
  const clampedValue = Math.min(100, Math.max(0, value));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const timeout = setTimeout(() => {
      setAnimatedValue(clampedValue);
    }, 100);
    return () => clearTimeout(timeout);
  }, [clampedValue, isVisible]);

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center gap-3",
        !isVisible && "opacity-0",
        isVisible && "animate-in fade-in duration-500",
        className
      )}
    >
      <div
        className="relative inline-flex items-center justify-center"
        style={{ width: config.outer, height: config.outer }}
      >
        <svg
          width={config.outer}
          height={config.outer}
          viewBox={`0 0 ${config.outer} ${config.outer}`}
          className="-rotate-90"
        >
          {/* Track */}
          <circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            strokeWidth={config.stroke}
            className="stroke-gray-100"
          />
          {/* Glow behind progress */}
          <circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            strokeWidth={config.stroke + 6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              stroke: color || "var(--portal-primary, #4F46E5)",
              opacity: 0.15,
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: "blur(4px)",
            }}
          />
          {/* Progress */}
          <circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              stroke: color || "var(--portal-primary, #4F46E5)",
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-bold tabular-nums tracking-tight text-gray-900",
              config.fontSize
            )}
          >
            {Math.round(animatedValue)}
            <span className="text-[0.5em] font-medium text-gray-400">%</span>
          </span>
          {label && (
            <span
              className={cn(
                "mt-0.5 font-medium text-gray-500",
                config.labelSize
              )}
            >
              {label}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="text-center text-sm text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}
