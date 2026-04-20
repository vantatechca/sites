"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PROJECT_STATUS_MAP } from "@/types";
import type { ProjectStatus } from "@/types";
import { ArrowRight, FolderOpen } from "lucide-react";

interface ClientProject {
  id: string;
  name: string;
  status: ProjectStatus;
  progressPercent: number;
  description: string | null;
  estimatedLaunchDate: string | null;
}

function getStatusColor(status: ProjectStatus): string {
  const map: Record<string, string> = {
    intake: "bg-gray-100 text-gray-600",
    requirements: "bg-amber-100 text-amber-700",
    design: "bg-violet-100 text-violet-700",
    development: "bg-blue-100 text-blue-700",
    content: "bg-cyan-100 text-cyan-700",
    review_internal: "bg-indigo-100 text-indigo-700",
    client_review: "bg-orange-100 text-orange-700",
    revisions: "bg-orange-100 text-orange-700",
    final_qa: "bg-purple-100 text-purple-700",
    launch_prep: "bg-emerald-100 text-emerald-700",
    launched: "bg-emerald-100 text-emerald-700",
    post_launch: "bg-teal-100 text-teal-700",
    completed: "bg-emerald-100 text-emerald-700",
    on_hold: "bg-gray-100 text-gray-600",
  };
  return map[status] || "bg-gray-100 text-gray-600";
}

export default function PortalPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("API unavailable");
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.projects || [];
        setProjects(list);

        // If client has exactly one project, redirect immediately
        if (list.length === 1) {
          router.replace(`/portal/${list[0].id}`);
          return;
        }
      } catch {
        // In demo mode, provide mock projects
        setProjects([
          {
            id: "proj_1",
            name: "Artisan Candles Store",
            status: "design" as ProjectStatus,
            progressPercent: 35,
            description: "Full redesign of e-commerce storefront",
            estimatedLaunchDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          },
          {
            id: "proj_2",
            name: "FitGear Pro Relaunch",
            status: "development" as ProjectStatus,
            progressPercent: 62,
            description: "Complete platform migration and redesign",
            estimatedLaunchDate: new Date(Date.now() + 14 * 86400000).toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-5 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <FolderOpen className="h-7 w-7 text-gray-400" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-gray-900">
          No projects yet
        </h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Your projects will appear here once they get started. Reach out to
          your team if you have any questions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Your Projects
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Select a project to view its progress and details.
        </p>
      </div>

      {/* Project grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <Link
            key={project.id}
            href={`/portal/${project.id}`}
            className={cn(
              "group animate-in fade-in slide-in-from-bottom-3 duration-500"
            )}
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: "backwards" }}
          >
            <Card className="h-full transition-all hover:shadow-lg hover:border-[var(--portal-primary,#4F46E5)]/20 hover:-translate-y-0.5">
              <CardContent className="flex h-full flex-col">
                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      getStatusColor(project.status)
                    )}
                  >
                    {PROJECT_STATUS_MAP[project.status]}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-[var(--portal-primary,#4F46E5)]" />
                </div>

                {/* Name */}
                <h3 className="mt-3 text-base font-semibold text-gray-900 group-hover:text-[var(--portal-primary,#4F46E5)] transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Progress */}
                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-semibold tabular-nums text-gray-900">
                      {project.progressPercent}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${project.progressPercent}%`,
                        backgroundColor:
                          project.progressPercent === 100
                            ? "#10B981"
                            : "var(--portal-primary, #4F46E5)",
                      }}
                    />
                  </div>
                </div>

                {/* Est. launch */}
                {project.estimatedLaunchDate && (
                  <p className="mt-2 text-[11px] text-gray-400">
                    Est. completion:{" "}
                    {new Date(project.estimatedLaunchDate).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" }
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
