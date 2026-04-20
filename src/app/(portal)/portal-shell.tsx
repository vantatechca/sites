"use client";

import { PortalHeader } from "@/components/shared/portal-header";

interface PortalShellProps {
  clientName?: string;
  clientAvatar?: string;
  children: React.ReactNode;
}

export function PortalShell({
  clientName,
  clientAvatar,
  children,
}: PortalShellProps) {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={
        {
          "--portal-primary": "#4F46E5",
          "--portal-primary-light": "#EEF2FF",
        } as React.CSSProperties
      }
    >
      <PortalHeader
        agencyName="SiteForge"
        projectName="My Project"
        clientName={clientName}
        clientAvatar={clientAvatar}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t bg-gray-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500">
            Powered by{" "}
            <span className="font-medium text-gray-700">SiteForge</span>
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-sm text-gray-500 transition-colors hover:text-gray-700"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-sm text-gray-500 transition-colors hover:text-gray-700"
            >
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
