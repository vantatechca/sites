import { cn } from "@/lib/utils";
import { STATUS_COLORS, PROJECT_STATUS_MAP, TASK_STATUS_MAP } from "@/lib/constants";

interface StatusBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

function getLabel(status: string): string {
  if (status in PROJECT_STATUS_MAP) {
    return PROJECT_STATUS_MAP[status as keyof typeof PROJECT_STATUS_MAP];
  }
  if (status in TASK_STATUS_MAP) {
    return TASK_STATUS_MAP[status as keyof typeof TASK_STATUS_MAP];
  }
  // Fallback: capitalize and replace underscores
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors.bg,
        colors.text,
        className
      )}
    >
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      )}
      {getLabel(status)}
    </span>
  );
}
