import { cn } from "@/lib/utils";
import { TIER_CONFIG, type TierKey } from "@/lib/constants";

interface TierBadgeProps {
  tier: TierKey;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const config = TIER_CONFIG[tier];

  if (!config) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700",
          className
        )}
      >
        {tier}
      </span>
    );
  }

  const isEnterprise = tier === "enterprise";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        config.bgColor,
        config.textColor,
        isEnterprise && "bg-gradient-to-r from-purple-100 to-amber-50 text-purple-700",
        className
      )}
    >
      {isEnterprise && (
        <svg
          className="h-3 w-3 text-amber-500"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )}
      {config.label}
    </span>
  );
}
