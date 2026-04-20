"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PORTAL_NAV_ITEMS } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PortalHeaderProps {
  agencyLogoUrl?: string;
  agencyName?: string;
  projectName?: string;
  clientName?: string;
  clientAvatar?: string;
}

export function PortalHeader({
  agencyLogoUrl,
  agencyName = "Agency",
  projectName = "My Project",
  clientName = "Client",
  clientAvatar,
}: PortalHeaderProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/portal") return pathname === "/portal";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo + Project */}
        <div className="flex items-center gap-4">
          {agencyLogoUrl ? (
            <img
              src={agencyLogoUrl}
              alt={agencyName}
              className="h-8 w-auto"
            />
          ) : (
            <div className="flex h-8 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--portal-primary,#4F46E5)]">
                <span className="text-sm font-bold text-white">
                  {agencyName.charAt(0)}
                </span>
              </div>
              <span className="hidden text-sm font-semibold text-gray-900 sm:block">
                {agencyName}
              </span>
            </div>
          )}

          <div className="hidden h-6 w-px bg-gray-200 sm:block" />

          <span className="hidden text-sm font-medium text-gray-600 sm:block">
            {projectName}
          </span>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {PORTAL_NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--portal-primary,#4F46E5)]/10 text-[var(--portal-primary,#4F46E5)]"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Client avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100">
            <Avatar size="sm">
              {clientAvatar && (
                <AvatarImage src={clientAvatar} alt={clientName} />
              )}
              <AvatarFallback className="bg-[var(--portal-primary,#4F46E5)]/10 text-[10px] text-[var(--portal-primary,#4F46E5)]">
                {clientName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium text-gray-700 sm:block">
              {clientName}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuItem>
              <Link href="/portal/settings" className="flex w-full">
                Account Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
