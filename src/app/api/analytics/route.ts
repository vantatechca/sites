import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAgencyAccess } from "@/lib/auth";
import { eq, and, ne, desc, count, sum, avg, sql, lt, lte } from "drizzle-orm";

export async function GET() {
  try {
    const session = await requireAgencyAccess();

    // 1. Pipeline distribution: count of projects per status
    const pipelineDistribution = await db
      .select({
        status: schema.projects.status,
        count: count(),
      })
      .from(schema.projects)
      .groupBy(schema.projects.status);

    // 2. Average time per stage (computed from status_history)
    const allProjects = await db
      .select({
        statusHistory: schema.projects.statusHistory,
      })
      .from(schema.projects);

    const stageDurations: Record<string, number[]> = {};

    for (const project of allProjects) {
      const history = project.statusHistory;
      if (!Array.isArray(history) || history.length < 2) continue;

      for (let i = 0; i < history.length - 1; i++) {
        const current = history[i];
        const next = history[i + 1];
        const status = current.status;
        const startDate = new Date(current.changedAt);
        const endDate = new Date(next.changedAt);
        const daysInStage =
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

        if (!stageDurations[status]) {
          stageDurations[status] = [];
        }
        stageDurations[status].push(daysInStage);
      }
    }

    const avgTimePerStage: Record<string, number> = {};
    for (const [status, durations] of Object.entries(stageDurations)) {
      avgTimePerStage[status] =
        Math.round(
          (durations.reduce((a, b) => a + b, 0) / durations.length) * 10
        ) / 10;
    }

    // 3. Team performance
    const teamMembers = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        department: schema.users.department,
      })
      .from(schema.users)
      .where(ne(schema.users.role, "client"));

    const teamPerformance = [];

    for (const member of teamMembers) {
      const [completedTasksResult] = await db
        .select({ count: count() })
        .from(schema.projectTasks)
        .where(
          and(
            eq(schema.projectTasks.completedBy, member.id),
            eq(schema.projectTasks.status, "completed")
          )
        );

      const [totalHoursResult] = await db
        .select({
          total: sum(schema.projectTasks.actualHours),
        })
        .from(schema.projectTasks)
        .where(eq(schema.projectTasks.assignedTo, member.id));

      const [activeProjectsResult] = await db
        .select({ count: count() })
        .from(schema.projectTasks)
        .where(
          and(
            eq(schema.projectTasks.assignedTo, member.id),
            ne(schema.projectTasks.status, "completed"),
            ne(schema.projectTasks.status, "skipped")
          )
        );

      teamPerformance.push({
        id: member.id,
        name: member.name,
        department: member.department,
        tasksCompleted: completedTasksResult.count,
        totalHours: totalHoursResult.total || "0",
        activeTaskCount: activeProjectsResult.count,
      });
    }

    // 4. Revenue
    const revenueOverall = await db
      .select({
        totalInvoiced: sum(schema.invoices.amount),
        totalPaid: sql<string>`COALESCE(SUM(CASE WHEN ${schema.invoices.status} = 'paid' THEN ${schema.invoices.amount} ELSE 0 END), '0')`,
        totalOutstanding: sql<string>`COALESCE(SUM(CASE WHEN ${schema.invoices.status} NOT IN ('paid', 'cancelled') THEN ${schema.invoices.amount} ELSE 0 END), '0')`,
      })
      .from(schema.invoices);

    const revenueByMonth = await db
      .select({
        month: sql<string>`TO_CHAR(${schema.invoices.createdAt}, 'YYYY-MM')`,
        invoiced: sum(schema.invoices.amount),
        paid: sql<string>`COALESCE(SUM(CASE WHEN ${schema.invoices.status} = 'paid' THEN ${schema.invoices.amount} ELSE 0 END), '0')`,
      })
      .from(schema.invoices)
      .groupBy(sql`TO_CHAR(${schema.invoices.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${schema.invoices.createdAt}, 'YYYY-MM')`);

    // 5. Tier analysis: avg build time per tier
    const completedProjects = await db
      .select({
        tier: schema.projects.tier,
        startDate: schema.projects.startDate,
        actualCompletionDate: schema.projects.actualCompletionDate,
      })
      .from(schema.projects)
      .where(eq(schema.projects.status, "completed"));

    const tierBuildTimes: Record<string, number[]> = {};

    for (const project of completedProjects) {
      if (!project.startDate || !project.actualCompletionDate) continue;
      const start = new Date(project.startDate);
      const end = new Date(project.actualCompletionDate);
      const days =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

      if (!tierBuildTimes[project.tier]) {
        tierBuildTimes[project.tier] = [];
      }
      tierBuildTimes[project.tier].push(days);
    }

    const tierAnalysis: Record<string, { avgDays: number; count: number }> = {};
    for (const [tier, times] of Object.entries(tierBuildTimes)) {
      tierAnalysis[tier] = {
        avgDays:
          Math.round(
            (times.reduce((a, b) => a + b, 0) / times.length) * 10
          ) / 10,
        count: times.length,
      };
    }

    // 6. At-risk projects: behind schedule
    const today = new Date().toISOString().split("T")[0];
    const activeStatuses = [
      "intake",
      "requirements",
      "design",
      "development",
      "content",
      "review_internal",
      "client_review",
      "revisions",
      "final_qa",
      "launch_prep",
    ];

    const allActiveProjects = await db
      .select({
        id: schema.projects.id,
        projectName: schema.projects.projectName,
        tier: schema.projects.tier,
        status: schema.projects.status,
        progressPercent: schema.projects.progressPercent,
        estimatedCompletionDate: schema.projects.estimatedCompletionDate,
        clientCompanyName: schema.clients.companyName,
      })
      .from(schema.projects)
      .leftJoin(
        schema.clients,
        eq(schema.projects.clientId, schema.clients.id)
      )
      .where(
        sql`${schema.projects.status} IN (${sql.raw(activeStatuses.map((s) => `'${s}'`).join(","))})`
      );

    const atRisk = [];
    for (const project of allActiveProjects) {
      const reasons: string[] = [];

      if (
        project.estimatedCompletionDate &&
        project.estimatedCompletionDate < today
      ) {
        reasons.push("Past estimated completion date");
      }

      if (project.estimatedCompletionDate) {
        const daysUntilDue =
          (new Date(project.estimatedCompletionDate).getTime() -
            new Date().getTime()) /
          (1000 * 60 * 60 * 24);
        if (daysUntilDue <= 7 && daysUntilDue > 0 && project.progressPercent < 80) {
          reasons.push("Due within 7 days but less than 80% complete");
        }
      }

      const blockedTasks = await db
        .select({ count: count() })
        .from(schema.projectTasks)
        .where(
          and(
            eq(schema.projectTasks.projectId, project.id),
            eq(schema.projectTasks.status, "blocked")
          )
        );

      if (blockedTasks[0].count > 0) {
        reasons.push(`${blockedTasks[0].count} blocked task(s)`);
      }

      if (reasons.length > 0) {
        atRisk.push({
          id: project.id,
          projectName: project.projectName,
          clientName: project.clientCompanyName,
          tier: project.tier,
          status: project.status,
          progressPercent: project.progressPercent,
          estimatedCompletionDate: project.estimatedCompletionDate,
          reasons,
        });
      }
    }

    return NextResponse.json({
      pipeline_distribution: pipelineDistribution,
      avg_time_per_stage: avgTimePerStage,
      team_performance: teamPerformance,
      revenue: {
        total_invoiced: revenueOverall[0]?.totalInvoiced || "0",
        total_paid: revenueOverall[0]?.totalPaid || "0",
        outstanding: revenueOverall[0]?.totalOutstanding || "0",
        by_month: revenueByMonth,
      },
      tier_analysis: tierAnalysis,
      at_risk: atRisk,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Authentication required") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message.includes("Access denied")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
