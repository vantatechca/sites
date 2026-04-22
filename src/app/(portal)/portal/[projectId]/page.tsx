"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalProgressRing } from "@/components/portal/progress-ring";
import {
  MilestoneTimeline,
  type MilestoneItem,
} from "@/components/portal/milestone-timeline";
import {
  PhaseAccordion,
  type Phase,
  type PhaseTask,
} from "@/components/portal/phase-accordion";
import {
  GanttTimeline,
  type GanttPhase,
} from "@/components/portal/gantt-timeline";
import { ProjectChatbot } from "@/components/portal/project-chatbot";
import {
  PROJECT_STATUS_MAP,
  PROJECT_STATUS_ORDER,
  type ProjectStatus,
  type TaskStatus,
} from "@/types";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Flag,
  CalendarClock,
  TrendingUp,
  ListChecks,
  Clock,
  GanttChart,
  ArrowRight,
  MessageSquare,
  Package,
  Receipt,
  Sparkles,
} from "lucide-react";

// --- Types for API data ---

interface ProjectData {
  id: string;
  name: string;
  status: ProjectStatus;
  progressPercent: number;
  estimatedLaunchDate: string | null;
  currentPhase: string | null;
  createdAt: string;
}

interface TaskData {
  id: string;
  phaseKey: string;
  taskKey: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  client_label?: string;
  client_visible?: boolean;
}

interface PhaseInfo {
  key: string;
  title: string;
  client_label?: string;
  client_visible?: boolean;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
}

// --- Motivational subtitles ---

const MOTIVATIONAL_MESSAGES: Record<string, string> = {
  intake: "We are getting everything set up for you!",
  requirements: "Laying the groundwork for something great.",
  design: "Your vision is coming to life on screen!",
  development: "Your store is being built piece by piece.",
  content: "Adding the finishing touches to your content.",
  review_internal: "Our team is making sure everything is perfect.",
  client_review: "Take a look and let us know what you think!",
  revisions: "Making it exactly the way you want it.",
  final_qa: "Almost there -- just a few final checks!",
  launch_prep: "Countdown to launch has begun!",
  launched: "Congratulations, your store is live!",
  post_launch: "We are here to help you grow.",
  completed: "Your project is complete. What an achievement!",
  on_hold: "Your project is paused. We will pick up right where we left off.",
};

// --- Helpers ---

function getPhaseStatusLabel(phaseKey: string, currentPhase: string | null): string {
  const order = PROJECT_STATUS_ORDER;
  const currentIndex = currentPhase ? order.indexOf(currentPhase as ProjectStatus) : -1;
  const phaseIndex = order.indexOf(phaseKey as ProjectStatus);

  if (phaseIndex < 0) return "";
  if (phaseIndex < currentIndex) return "Completed";
  if (phaseIndex === currentIndex) return "In Progress";
  return "Upcoming";
}

function mapTaskStatus(status: TaskStatus): PhaseTask["status"] {
  if (status === "completed" || status === "skipped") return "completed";
  if (status === "in_progress") return "in_progress";
  return "not_started";
}

function formatEstDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// --- Loading skeleton ---

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-3 py-8">
        <Skeleton className="h-48 w-48 rounded-full" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}

// --- Main component ---

export default function ProjectDashboardPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [phases, setPhases] = useState<PhaseInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [projRes, tasksRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/tasks`),
        ]);

        if (!projRes.ok) throw new Error("API unavailable");
        const projData = await projRes.json();
        setProject(projData);

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const taskList = Array.isArray(tasksData)
            ? tasksData
            : tasksData.tasks || [];
          setTasks(taskList);

          if (tasksData.phases) {
            setPhases(tasksData.phases);
          }
        }
      } catch {
        // Demo mode: provide mock data
        const mockProjects: Record<string, ProjectData> = {
          proj_1: {
            id: "proj_1",
            name: "Artisan Candles Store",
            status: "design" as ProjectStatus,
            progressPercent: 35,
            estimatedLaunchDate: new Date(Date.now() + 30 * 86400000).toISOString(),
            currentPhase: "design",
            createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
          },
          proj_2: {
            id: "proj_2",
            name: "FitGear Pro Relaunch",
            status: "development" as ProjectStatus,
            progressPercent: 62,
            estimatedLaunchDate: new Date(Date.now() + 14 * 86400000).toISOString(),
            currentPhase: "development",
            createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
          },
        };
        const mockTasks: TaskData[] = [
          { id: "t1", phaseKey: "intake", taskKey: "kickoff", title: "Project kickoff call", status: "completed" as TaskStatus, dueDate: null, completedAt: new Date(Date.now() - 40 * 86400000).toISOString() },
          { id: "t2", phaseKey: "intake", taskKey: "access", title: "Gather store access credentials", status: "completed" as TaskStatus, dueDate: null, completedAt: new Date(Date.now() - 38 * 86400000).toISOString() },
          { id: "t3", phaseKey: "requirements", taskKey: "brand_guide", title: "Brand guidelines review", status: "completed" as TaskStatus, dueDate: null, completedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
          { id: "t4", phaseKey: "design", taskKey: "homepage", title: "Homepage design mockup", status: "in_progress" as TaskStatus, dueDate: new Date(Date.now() + 5 * 86400000).toISOString(), completedAt: null },
          { id: "t5", phaseKey: "design", taskKey: "product_page", title: "Product page template design", status: "not_started" as TaskStatus, dueDate: new Date(Date.now() + 10 * 86400000).toISOString(), completedAt: null },
          { id: "t6", phaseKey: "development", taskKey: "theme_setup", title: "Theme setup & configuration", status: "not_started" as TaskStatus, dueDate: null, completedAt: null },
          { id: "t7", phaseKey: "content", taskKey: "copy_review", title: "Content & copy review", status: "not_started" as TaskStatus, dueDate: null, completedAt: null },
        ];
        setProject(mockProjects[projectId] || mockProjects.proj_1);
        setTasks(mockTasks);
        setPhases([
          { key: "intake", title: "Project Setup", client_label: "Getting Started", sortOrder: 0 },
          { key: "requirements", title: "Requirements", client_label: "Planning", sortOrder: 1 },
          { key: "design", title: "Design", client_label: "Design Phase", sortOrder: 2 },
          { key: "development", title: "Development", client_label: "Building Your Store", sortOrder: 3 },
          { key: "content", title: "Content", client_label: "Content & Copy", sortOrder: 4 },
          { key: "final_qa", title: "Quality Assurance", client_label: "Final Review", sortOrder: 5 },
          { key: "launch_prep", title: "Launch Prep", client_label: "Ready to Launch", sortOrder: 6 },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [projectId]);

  // Derive milestone data
  const milestones = useMemo((): MilestoneItem[] => {
    if (!project) return [];

    // Build from phase info or project status order
    const phaseKeys =
      phases.length > 0
        ? phases
            .filter((p) => p.client_visible !== false)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((p) => ({
              key: p.key,
              label: p.client_label || p.title,
            }))
        : PROJECT_STATUS_ORDER.filter((s) => s !== "on_hold").map((s) => ({
            key: s,
            label: PROJECT_STATUS_MAP[s],
          }));

    const currentStatusIndex = PROJECT_STATUS_ORDER.indexOf(project.status);

    return phaseKeys.map((phase) => {
      const phaseStatusIndex = PROJECT_STATUS_ORDER.indexOf(
        phase.key as ProjectStatus
      );
      const phaseTasks = tasks.filter((t) => t.phaseKey === phase.key);
      const completedDate = phaseTasks.find((t) => t.completedAt)?.completedAt;

      let status: MilestoneItem["status"] = "upcoming";
      if (phaseStatusIndex >= 0) {
        if (phaseStatusIndex < currentStatusIndex) status = "completed";
        else if (phaseStatusIndex === currentStatusIndex) status = "current";
      }

      return {
        id: phase.key,
        label: phase.label,
        status,
        date: completedDate
          ? new Date(completedDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : undefined,
        subtitle:
          status === "current"
            ? `${phaseTasks.filter((t) => t.status === "completed").length} of ${phaseTasks.length} tasks done`
            : undefined,
      };
    });
  }, [project, tasks, phases]);

  // Derive phase accordion data
  const phaseAccordionData = useMemo((): Phase[] => {
    if (!project) return [];

    const phaseMap = new Map<string, { label: string; tasks: PhaseTask[] }>();

    // Build phase labels
    const phaseLabels =
      phases.length > 0
        ? new Map(
            phases
              .filter((p) => p.client_visible !== false)
              .map((p) => [p.key, p.client_label || p.title])
          )
        : new Map(
            PROJECT_STATUS_ORDER.filter((s) => s !== "on_hold").map((s) => [
              s,
              PROJECT_STATUS_MAP[s],
            ])
          );

    // Group tasks by phase
    for (const task of tasks) {
      if (task.client_visible === false) continue;

      const label = phaseLabels.get(task.phaseKey);
      if (!label) continue;

      if (!phaseMap.has(task.phaseKey)) {
        phaseMap.set(task.phaseKey, { label, tasks: [] });
      }

      phaseMap.get(task.phaseKey)!.tasks.push({
        id: task.id,
        label: task.client_label || task.title,
        status: mapTaskStatus(task.status),
      });
    }

    return Array.from(phaseMap.entries()).map(([key, data]) => ({
      key,
      label: data.label,
      tasks: data.tasks,
    }));
  }, [project, tasks, phases]);

  // Derive gantt data
  const ganttPhases = useMemo((): GanttPhase[] => {
    if (!project || phases.length === 0) {
      // Estimate from project dates
      if (!project) return [];
      const projectStartDate = project.createdAt;
      const endDate = project.estimatedLaunchDate || project.createdAt;
      const currentIndex = PROJECT_STATUS_ORDER.indexOf(project.status);
      const totalPhases = PROJECT_STATUS_ORDER.filter(
        (s) => s !== "on_hold"
      ).length;
      const startMs = new Date(projectStartDate).getTime();
      const endMs = new Date(endDate).getTime();
      const phaseDuration = (endMs - startMs) / totalPhases;

      return PROJECT_STATUS_ORDER.filter((s) => s !== "on_hold").map(
        (status, i) => {
          const phaseStart = new Date(startMs + i * phaseDuration);
          const phaseEnd = new Date(startMs + (i + 1) * phaseDuration);
          const phaseIndex = i;

          return {
            key: status,
            label: PROJECT_STATUS_MAP[status],
            startDate: phaseStart.toISOString(),
            endDate: phaseEnd.toISOString(),
            progress:
              phaseIndex < currentIndex
                ? 100
                : phaseIndex === currentIndex
                  ? project.progressPercent
                  : 0,
          };
        }
      );
    }

    return phases
      .filter((p) => p.client_visible !== false && p.startDate && p.endDate)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({
        key: p.key,
        label: p.client_label || p.title,
        startDate: p.startDate!,
        endDate: p.endDate!,
      }));
  }, [project, phases]);

  // Stats
  const stats = useMemo(() => {
    const completedMilestones = milestones.filter(
      (m) => m.status === "completed"
    ).length;
    const currentPhaseLabel = project
      ? PROJECT_STATUS_MAP[project.status]
      : "---";
    const estCompletion = formatEstDate(project?.estimatedLaunchDate ?? null);

    return { completedMilestones, currentPhaseLabel, estCompletion };
  }, [milestones, project]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Project not found
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          We could not load this project. Please try again later.
        </p>
      </div>
    );
  }

  const projectId_str = project.id;

  return (
    <div className="space-y-8">
      {/* ── Hero Section ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--portal-primary,#4F46E5)]/10 bg-gradient-to-br from-[var(--portal-primary,#4F46E5)] via-[#6366F1] to-[#818CF8] p-8 text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 size-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              {PROJECT_STATUS_MAP[project.status]}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              {project.name}
            </h1>
            <p className="mt-1.5 text-sm text-white/80">
              {MOTIVATIONAL_MESSAGES[project.status] ||
                "Your project is underway!"}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-white/70">Est. launch:</span>
                <span className="font-semibold">{stats.estCompletion}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-white/70">Milestones:</span>
                <span className="font-semibold">
                  {stats.completedMilestones}/{milestones.length}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Ring */}
          <div className="flex justify-center sm:justify-end">
            <div className="rounded-2xl bg-white/95 p-4 shadow-xl">
              <PortalProgressRing
                value={project.progressPercent}
                size="md"
                label="Complete"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ──────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
        {[
          {
            icon: Package,
            label: "Deliverables",
            desc: "Review files & previews",
            href: `/portal/${projectId_str}/deliverables`,
            color: "violet",
          },
          {
            icon: MessageSquare,
            label: "Messages",
            desc: "Chat with your team",
            href: `/portal/${projectId_str}/chat`,
            color: "blue",
          },
          {
            icon: Receipt,
            label: "Invoices",
            desc: "View billing",
            href: `/portal/${projectId_str}/invoices`,
            color: "emerald",
          },
        ].map((action) => {
          const colorClasses: Record<string, string> = {
            violet: "bg-violet-50 text-violet-600",
            blue: "bg-blue-50 text-blue-600",
            emerald: "bg-emerald-50 text-emerald-600",
          };
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-[var(--portal-primary,#4F46E5)]/30 hover:shadow-md"
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  colorClasses[action.color]
                )}
              >
                <action.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {action.label}
                </p>
                <p className="text-xs text-gray-500">{action.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-[var(--portal-primary,#4F46E5)]" />
            </Link>
          );
        })}
      </div>

      {/* ── Tabs Section ─────────────────────────────────────── */}
      <Tabs defaultValue={0}>
        {/* Tab navigation */}
        <TabsList
          variant="line"
          className="w-full justify-start border-b border-gray-100 pb-px"
        >
          <TabsTrigger value={0} className="gap-1.5">
            <TrendingUp className="h-4 w-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value={1} className="gap-1.5">
            <Flag className="h-4 w-4" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value={2} className="gap-1.5">
            <ListChecks className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value={3} className="gap-1.5">
            <GanttChart className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* VIEW 1 -- Progress */}
        <TabsContent value={0} className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: CheckCircle2,
                label: "Milestones Done",
                value: `${stats.completedMilestones} of ${milestones.length}`,
                color: "text-emerald-500",
                bg: "bg-emerald-50",
              },
              {
                icon: BarChart3,
                label: "Current Phase",
                value: stats.currentPhaseLabel,
                color: "text-[var(--portal-primary,#4F46E5)]",
                bg: "bg-[var(--portal-primary-light,#EEF2FF)]",
              },
              {
                icon: CalendarClock,
                label: "Est. Completion",
                value: stats.estCompletion,
                color: "text-amber-500",
                bg: "bg-amber-50",
              },
            ].map((stat, i) => (
              <Card
                key={stat.label}
                className="animate-in fade-in slide-in-from-bottom-3 duration-500"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
              >
                <CardContent className="flex items-center gap-3 py-4">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl",
                      stat.bg
                    )}
                  >
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider text-gray-400">
                      {stat.label}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-900 truncate">
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* VIEW 2 -- Milestones */}
        <TabsContent value={1} className="pt-8">
          <div className="mx-auto max-w-lg">
            <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-lg font-semibold text-gray-900">
                Project Milestones
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Track the major phases of your project from start to finish.
              </p>
            </div>
            <MilestoneTimeline milestones={milestones} />
          </div>
        </TabsContent>

        {/* VIEW 3 -- Phase Details */}
        <TabsContent value={2} className="pt-8">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-lg font-semibold text-gray-900">
                Phase Details
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Expand each phase to see individual tasks and their progress.
              </p>
            </div>
            <PhaseAccordion phases={phaseAccordionData} />
          </div>
        </TabsContent>

        {/* VIEW 4 -- Visual Timeline */}
        <TabsContent value={3} className="pt-8">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Project Timeline
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                A visual overview of when each phase is scheduled.
              </p>
            </div>
            <GanttTimeline
              phases={ganttPhases}
              projectStart={project.createdAt}
              projectEnd={project.estimatedLaunchDate || undefined}
            />
          </div>
        </TabsContent>
      </Tabs>

      <ProjectChatbot
        project={{
          name: project.name,
          status: project.status,
          progressPercent: project.progressPercent,
          currentPhase: project.currentPhase,
          estimatedLaunchDate: project.estimatedLaunchDate,
        }}
      />
    </div>
  );
}
