import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth, requireAgencyAccess, requireRole } from "@/lib/auth";
import { eq, and, desc, count, sum, sql } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const projectId = params.id;
    const isClient = session.user.role === "client";

    const [project] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (isClient) {
      const clientRecord = await db
        .select({ id: schema.clients.id })
        .from(schema.clients)
        .where(eq(schema.clients.userId, session.user.id))
        .limit(1);

      if (!clientRecord.length || clientRecord[0].id !== project.clientId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const [clientData] = await db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, project.clientId))
      .limit(1);

    const tasks = await db
      .select()
      .from(schema.projectTasks)
      .where(eq(schema.projectTasks.projectId, projectId))
      .orderBy(schema.projectTasks.sortOrder);

    const tasksByPhase: Record<string, typeof tasks> = {};
    for (const task of tasks) {
      if (isClient && !task.clientVisible) continue;
      const phase = task.phaseName;
      if (!tasksByPhase[phase]) {
        tasksByPhase[phase] = [];
      }
      tasksByPhase[phase].push(task);
    }

    const [messagesCount] = await db
      .select({ total: count() })
      .from(schema.messages)
      .where(eq(schema.messages.projectId, projectId));

    const [deliverablesCount] = await db
      .select({ total: count() })
      .from(schema.deliverables)
      .where(eq(schema.deliverables.projectId, projectId));

    const invoiceRows = await db
      .select({
        totalInvoiced: sum(schema.invoices.amount),
        totalPaid: sql<string>`COALESCE(SUM(CASE WHEN ${schema.invoices.status} = 'paid' THEN ${schema.invoices.amount} ELSE 0 END), '0')`,
        invoiceCount: count(),
      })
      .from(schema.invoices)
      .where(eq(schema.invoices.projectId, projectId));

    const invoiceSummary = {
      totalInvoiced: invoiceRows[0]?.totalInvoiced || "0",
      totalPaid: invoiceRows[0]?.totalPaid || "0",
      count: invoiceRows[0]?.invoiceCount || 0,
    };

    if (isClient) {
      const clientView = {
        id: project.id,
        projectName: project.projectName,
        tier: project.tier,
        status: project.status,
        progressPercent: project.progressPercent,
        currentPhase: project.currentPhase,
        startDate: project.startDate,
        estimatedCompletionDate: project.estimatedCompletionDate,
        clientVisibleNotes: project.clientVisibleNotes,
        client: clientData,
        tasksByPhase: Object.fromEntries(
          Object.entries(tasksByPhase).map(([phase, phaseTasks]) => [
            phase,
            phaseTasks.map((t) => ({
              id: t.id,
              name: t.clientLabel || t.name,
              status: t.clientStatusOverride || t.status,
              isMilestone: t.isMilestone,
              phaseName: t.phaseName,
            })),
          ])
        ),
        deliverablesCount: deliverablesCount.total,
        invoiceSummary,
      };
      return NextResponse.json({ project: clientView });
    }

    return NextResponse.json({
      project: {
        ...project,
        client: clientData,
        tasksByPhase,
        messagesCount: messagesCount.total,
        deliverablesCount: deliverablesCount.total,
        invoiceSummary,
      },
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAgencyAccess();
    const projectId = params.id;
    const body = await req.json();

    const [existing] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const allowedFields = [
      "status",
      "priority",
      "team_members",
      "estimated_completion_date",
      "client_visible_notes",
      "internal_notes",
      "project_manager_id",
    ];

    const updateData: Record<string, unknown> = {};
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    if (body.status !== undefined && body.status !== existing.status) {
      updateData.status = body.status;
      changes.status = { from: existing.status, to: body.status };

      const newHistory = [
        ...existing.statusHistory,
        {
          status: body.status,
          changedAt: new Date().toISOString(),
          changedBy: session.user.id,
        },
      ];
      updateData.statusHistory = newHistory;
    }

    if (body.priority !== undefined) {
      updateData.priority = body.priority;
      changes.priority = { from: existing.priority, to: body.priority };
    }

    if (body.team_members !== undefined) {
      updateData.teamMembers = body.team_members;
      changes.team_members = {
        from: existing.teamMembers,
        to: body.team_members,
      };
    }

    if (body.estimated_completion_date !== undefined) {
      updateData.estimatedCompletionDate = body.estimated_completion_date;
      changes.estimated_completion_date = {
        from: existing.estimatedCompletionDate,
        to: body.estimated_completion_date,
      };
    }

    if (body.client_visible_notes !== undefined) {
      updateData.clientVisibleNotes = body.client_visible_notes;
    }

    if (body.internal_notes !== undefined) {
      updateData.internalNotes = body.internal_notes;
    }

    if (body.project_manager_id !== undefined) {
      updateData.projectManagerId = body.project_manager_id;
      changes.project_manager_id = {
        from: existing.projectManagerId,
        to: body.project_manager_id,
      };
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(schema.projects)
      .set(updateData)
      .where(eq(schema.projects.id, projectId))
      .returning();

    await db.insert(schema.activityLog).values({
      projectId,
      userId: session.user.id,
      action: "project_updated",
      entityType: "project",
      entityId: projectId,
      metadata: { changes },
    });

    return NextResponse.json({ project: updated });
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["admin"]);
    const projectId = params.id;

    const [existing] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const [archived] = await db
      .update(schema.projects)
      .set({
        status: "completed",
        updatedAt: new Date(),
        metadata: {
          ...(existing.metadata || {}),
          archived: true,
          archivedAt: new Date().toISOString(),
          archivedBy: session.user.id,
        },
      })
      .where(eq(schema.projects.id, projectId))
      .returning();

    await db.insert(schema.activityLog).values({
      projectId,
      userId: session.user.id,
      action: "project_archived",
      entityType: "project",
      entityId: projectId,
    });

    return NextResponse.json({ project: archived, archived: true });
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
