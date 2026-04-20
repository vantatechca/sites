"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  /** Percentage from 0 to 100 */
  value: number;
  /** Outer size in pixels */
  size?: number;
  /** Ring stroke width */
  strokeWidth?: number;
  /** Tailwind text color class for the ring */
  color?: string;
  /** Tailwind text color class for the track */
  trackColor?: string;
  /** Show the percentage text in the center */
  showValue?: boolean;
  /** Additional class names */
  className?: string;
}

export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 6,
  color = "text-indigo-500",
  trackColor = "text-gray-200",
  showValue = true,
  className,
}: ProgressRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    // Animate from 0 to the target value
    const timeout = setTimeout(() => {
      setAnimatedValue(Math.min(100, Math.max(0, value)));
    }, 50);
    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-current", trackColor)}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("stroke-current transition-all duration-700 ease-out", color)}
        />
      </svg>
      {showValue && (
        <span className="absolute text-center text-xs font-semibold tabular-nums text-foreground">
          {Math.round(animatedValue)}%
        </span>
      )}
    </div>
  );
}
