"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronRight, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

interface HeaderProps {
  notificationCount?: number;
}

export function Header({ notificationCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const breadcrumbs = getBreadcrumbs(pathname);

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

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuItem>
              <Link href="/agency/projects/new" className="flex w-full">
                New Project
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/agency/team/invite" className="flex w-full">
                Invite Team Member
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/agency/checkins/new" className="flex w-full">
                New Check-in
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
