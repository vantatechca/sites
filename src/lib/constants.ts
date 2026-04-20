import {
  LayoutDashboard,
  FolderKanban,
  Columns3,
  Users,
  MessageSquareText,
  BarChart3,
  Settings,
  Home,
  Package,
  MessageCircle,
  Receipt,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Project & task status
// ---------------------------------------------------------------------------

export const PROJECT_STATUS = {
  DISCOVERY: "discovery",
  PROPOSAL_SENT: "proposal_sent",
  IN_PROGRESS: "in_progress",
  REVIEW: "review",
  REVISION: "revision",
  COMPLETED: "completed",
  ON_HOLD: "on_hold",
  CANCELLED: "cancelled",
} as const;

export type ProjectStatus =
  (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

/** Maps internal status keys to client-friendly labels */
export const PROJECT_STATUS_MAP: Record<ProjectStatus, string> = {
  discovery: "Discovery",
  proposal_sent: "Proposal Sent",
  in_progress: "In Progress",
  review: "Under Review",
  revision: "Revision Requested",
  completed: "Completed",
  on_hold: "On Hold",
  cancelled: "Cancelled",
};

export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  DONE: "done",
  BLOCKED: "blocked",
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const TASK_STATUS_MAP: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
};

// ---------------------------------------------------------------------------
// Status colors  (Tailwind class tokens)
// ---------------------------------------------------------------------------

export type StatusColorConfig = {
  bg: string;
  text: string;
  dot: string;
};

export const STATUS_COLORS: Record<string, StatusColorConfig> = {
  // project statuses
  discovery: { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
  proposal_sent: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  review: { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  revision: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  completed: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  on_hold: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  cancelled: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  // task statuses
  todo: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" },
  in_review: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  done: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  blocked: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  // generic
  active: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  inactive: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  pending: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  overdue: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

// ---------------------------------------------------------------------------
// Tiers
// ---------------------------------------------------------------------------

export type TierKey = "basic" | "pro" | "enterprise";

export interface TierConfig {
  key: TierKey;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  maxProducts: number;
  maxRevisions: number;
}

export const TIER_CONFIG: Record<TierKey, TierConfig> = {
  basic: {
    key: "basic",
    label: "Basic",
    color: "bg-gray-500",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
    maxProducts: 3,
    maxRevisions: 2,
  },
  pro: {
    key: "pro",
    label: "Pro",
    color: "bg-blue-500",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    maxProducts: 10,
    maxRevisions: 5,
  },
  enterprise: {
    key: "enterprise",
    label: "Enterprise",
    color: "bg-purple-500",
    bgColor: "bg-amber-50",
    textColor: "text-purple-700",
    maxProducts: -1, // unlimited
    maxRevisions: -1,
  },
};

// ---------------------------------------------------------------------------
// Department labels
// ---------------------------------------------------------------------------

export const DEPARTMENT_LABELS: Record<string, string> = {
  design: "Design",
  development: "Development",
  marketing: "Marketing",
  content: "Content",
  strategy: "Strategy",
  project_management: "Project Management",
  qa: "Quality Assurance",
};

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/agency", icon: LayoutDashboard },
  { label: "Projects", href: "/agency/projects", icon: FolderKanban },
  { label: "Pipeline", href: "/agency/pipeline", icon: Columns3 },
  { label: "Team", href: "/agency/team", icon: Users },
  { label: "Check-ins", href: "/agency/checkins", icon: MessageSquareText },
  { label: "Analytics", href: "/agency/analytics", icon: BarChart3 },
  { label: "Settings", href: "/agency/settings", icon: Settings },
];

export interface PortalNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const PORTAL_NAV_ITEMS: PortalNavItem[] = [
  { label: "Dashboard", href: "/portal", icon: Home },
  { label: "Deliverables", href: "/portal/deliverables", icon: Package },
  { label: "Chat", href: "/portal/chat", icon: MessageCircle },
  { label: "Invoices", href: "/portal/invoices", icon: Receipt },
];
