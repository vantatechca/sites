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
        <main className="relative flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/30 p-6">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />
            <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-violet-200/20 blur-3xl" />
          </div>
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
