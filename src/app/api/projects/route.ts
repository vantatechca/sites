import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth, requireAgencyAccess } from "@/lib/auth";
import {
  eq,
  and,
  desc,
  asc,
  like,
  sql,
  count,
  or,
  inArray,
} from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const offset = (page - 1) * limit;

    const statusFilter = searchParams.get("status");
    const tierFilter = searchParams.get("tier");
    const pmFilter = searchParams.get("pm_id");
    const searchQuery = searchParams.get("q");
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrder = searchParams.get("sort_order") || "desc";

    const isClient = session.user.role === "client";

    const conditions: ReturnType<typeof eq>[] = [];

    if (isClient) {
      const clientRecord = await db
        .select({ id: schema.clients.id })
        .from(schema.clients)
        .where(eq(schema.clients.userId, session.user.id))
        .limit(1);

      if (!clientRecord.length) {
        return NextResponse.json({ projects: [], total: 0, page, limit });
      }

      conditions.push(
        eq(schema.projects.clientId, clientRecord[0].id)
      );
    }

    if (statusFilter) {
      conditions.push(
        eq(
          schema.projects.status,
          statusFilter as (typeof schema.projectStatusEnum.enumValues)[number]
        )
      );
    }

    if (tierFilter) {
      conditions.push(
        eq(
          schema.projects.tier,
          tierFilter as (typeof schema.projectTierEnum.enumValues)[number]
        )
      );
    }

    if (pmFilter) {
      conditions.push(eq(schema.projects.projectManagerId, pmFilter));
    }

    if (searchQuery) {
      conditions.push(
        like(schema.projects.projectName, `%${searchQuery}%`)
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = (() => {
      switch (sortBy) {
        case "name":
          return schema.projects.projectName;
        case "status":
          return schema.projects.status;
        case "progress":
          return schema.projects.progressPercent;
        case "created_at":
        default:
          return schema.projects.createdAt;
      }
    })();

    const orderFn = sortOrder === "asc" ? asc : desc;

    const [projectRows, totalResult] = await Promise.all([
      db
        .select({
          id: schema.projects.id,
          clientId: schema.projects.clientId,
          projectName: schema.projects.projectName,
          tier: schema.projects.tier,
          status: schema.projects.status,
          progressPercent: schema.projects.progressPercent,
          currentPhase: schema.projects.currentPhase,
          startDate: schema.projects.startDate,
          estimatedCompletionDate: schema.projects.estimatedCompletionDate,
          projectManagerId: schema.projects.projectManagerId,
          contractValue: schema.projects.contractValue,
          priority: schema.projects.priority,
          tags: schema.projects.tags,
          createdAt: schema.projects.createdAt,
          clientCompanyName: schema.clients.companyName,
          clientContactName: schema.clients.contactName,
          clientContactEmail: schema.clients.contactEmail,
        })
        .from(schema.projects)
        .leftJoin(
          schema.clients,
          eq(schema.projects.clientId, schema.clients.id)
        )
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(schema.projects)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return NextResponse.json({
      projects: projectRows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Authentication required") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAgencyAccess();
    const body = await req.json();

    const {
      client_id,
      project_name,
      tier,
      start_date,
      estimated_completion_date,
      project_manager_id,
      contract_value,
    } = body;

    if (!client_id || !project_name || !tier) {
      return NextResponse.json(
        { error: "client_id, project_name, and tier are required" },
        { status: 400 }
      );
    }

    const validTiers = ["basic", "pro", "enterprise"];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: "Invalid tier. Must be basic, pro, or enterprise" },
        { status: 400 }
      );
    }

    const clientExists = await db
      .select({ id: schema.clients.id })
      .from(schema.clients)
      .where(eq(schema.clients.id, client_id))
      .limit(1);

    if (!clientExists.length) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const [project] = await db
      .insert(schema.projects)
      .values({
        clientId: client_id,
        projectName: project_name,
        tier,
        status: "intake",
        startDate: start_date || null,
        estimatedCompletionDate: estimated_completion_date || null,
        projectManagerId: project_manager_id || null,
        contractValue: contract_value ? String(contract_value) : null,
        amountRemaining: contract_value ? String(contract_value) : null,
        statusHistory: [
          {
            status: "intake",
            changedAt: new Date().toISOString(),
            changedBy: session.user.id,
          },
        ],
        progressPercent: 0,
      })
      .returning();

    const activeTemplate = await db
      .select()
      .from(schema.checklistTemplates)
      .where(eq(schema.checklistTemplates.isActive, true))
      .orderBy(desc(schema.checklistTemplates.version))
      .limit(1);

    let tasksCreated = 0;

    if (activeTemplate.length > 0 && activeTemplate[0].phases) {
      const template = activeTemplate[0];
      const taskInserts: (typeof schema.projectTasks.$inferInsert)[] = [];

      for (const phase of template.phases) {
        let taskSortOrder = 0;
        for (const task of phase.tasks) {
          const tierKey = tier as keyof typeof task.tierApplicable;
          if (!task.tierApplicable[tierKey]) {
            continue;
          }

          taskInserts.push({
            projectId: project.id,
            templateTaskId: `${template.id}:${phase.name}:${task.name}`,
            phaseName: phase.name,
            name: task.name,
            description: task.description || null,
            status: "not_started",
            estimatedHours: task.estimatedHours
              ? String(task.estimatedHours)
              : null,
            isMilestone: task.isMilestone,
            clientVisible: task.clientVisible,
            clientLabel: task.clientLabel || null,
            tierApplicable: true,
            sortOrder: phase.sortOrder * 1000 + taskSortOrder,
          });

          taskSortOrder++;
        }
      }

      if (taskInserts.length > 0) {
        await db.insert(schema.projectTasks).values(taskInserts);
        tasksCreated = taskInserts.length;
      }
    }

    await db.insert(schema.activityLog).values({
      projectId: project.id,
      userId: session.user.id,
      action: "project_created",
      entityType: "project",
      entityId: project.id,
      metadata: {
        projectName: project_name,
        tier,
        tasksCreated,
      },
    });

    return NextResponse.json(
      { project, tasksCreated },
      { status: 201 }
    );
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
