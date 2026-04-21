"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronRight, Search, Plus, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_TITLES: Record<string, string> = {
  "/agency": "Dashboard",
  "/agency/projects": "Projects",
  "/agency/pipeline": "Pipeline",
  "/agency/team": "Team",
  "/agency/checkins": "Check-ins",
  "/agency/analytics": "Analytics",
  "/agency/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  // Check exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Check prefix match for nested routes
  const segments = pathname.split("/").filter(Boolean);
  for (let i = segments.length; i >= 2; i--) {
    const partial = "/" + segments.slice(0, i).join("/");
    if (PAGE_TITLES[partial]) return PAGE_TITLES[partial];
  }
  return "Dashboard";
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  // Remove the route group segment "agency"
  const crumbs: { label: string; href: string }[] = [];
  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label =
      PAGE_TITLES[currentPath] ??
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    crumbs.push({ label, href: currentPath });
  }

  return crumbs;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  href?: string;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "New client message",
    message: "Sarah Mitchell sent a message on Artisan Candles Store.",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    isRead: false,
    href: "/agency/projects",
  },
  {
    id: "n2",
    title: "Deliverable pending review",
    message: "Homepage Design Mockup v2 is awaiting client approval.",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    isRead: false,
    href: "/agency/projects",
  },
  {
    id: "n3",
    title: "Check-in submitted",
    message: "Alex Rivera submitted today's daily check-in.",
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    isRead: false,
    href: "/agency/checkins",
  },
  {
    id: "n4",
    title: "Invoice paid",
    message: "INV-2024-001 was paid by Bloom Natural.",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    isRead: true,
  },
];

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface HeaderProps {
  notificationCount?: number;
}

export function Header({ notificationCount }: HeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const breadcrumbs = getBreadcrumbs(pathname);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    MOCK_NOTIFICATIONS
  );

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data.notifications) && data.notifications.length > 0) {
          setNotifications(data.notifications);
        }
      })
      .catch(() => {});
  }, []);

  const unreadCount =
    notificationCount ?? notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all_read: true }),
    }).catch(() => {});
  };

  const markOneAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_ids: [id] }),
    }).catch(() => {});
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
      {/* Left: Title + Breadcrumbs */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {breadcrumbs.length > 1 && (
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.href} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="h-3 w-3" />}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-foreground">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>

      {/* Right: Search, Notifications, Quick Actions */}
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-8 w-64 pl-8 text-sm"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  <Check className="h-3 w-3" />
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No notifications
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markOneAsRead(n.id)}
                    className={`flex w-full items-start gap-2 border-b px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-gray-50 ${
                      !n.isRead ? "bg-blue-50/40" : ""
                    }`}
                  >
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                    <div className={`min-w-0 flex-1 ${n.isRead ? "pl-4" : ""}`}>
                      <p className="text-xs font-medium text-gray-900">
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-600">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuItem>
              <Link href="/agency/projects" className="flex w-full">
                New Project
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/agency/team" className="flex w-full">
                Invite Team Member
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/agency/checkins" className="flex w-full">
                New Check-in
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
