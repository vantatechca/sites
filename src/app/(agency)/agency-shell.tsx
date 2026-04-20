"use client";

import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";

interface AgencyShellProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  children: React.ReactNode;
}

export function AgencyShell({ user, children }: AgencyShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user ?? undefined} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
