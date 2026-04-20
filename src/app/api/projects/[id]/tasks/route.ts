import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth, requireAgencyAccess } from "@/lib/auth";
import { eq, and, asc, inArray } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const projectId = params.id;
    const isClient = session.user.role === "client";

    if (isClient) {
      const clientRecord = await db
        .select({ id: schema.clients.id })
        .from(schema.clients)
        .where(eq(schema.clients.userId, session.user.id))
        .limit(1);

      if (clientRecord.length) {
        const [project] = await db
          .select({ clientId: schema.projects.clientId })
          .from(schema.projects)
          .where(eq(schema.projects.id, projectId))
          .limit(1);

        if (!project || project.clientId !== clientRecord[0].id) {
          return NextResponse.json(
            { error: "Access denied" },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    const tasks = await db
      .select()
      .from(schema.projectTasks)
      .where(eq(schema.projectTasks.projectId, projectId))
      .orderBy(asc(schema.projectTasks.sortOrder));

    const tasksByPhase: Record<string, unknown[]> = {};

    for (const task of tasks) {
      if (isClient && !task.clientVisible) continue;

      const phase = task.phaseName;
      if (!tasksByPhase[phase]) {
        tasksByPhase[phase] = [];
      }

      if (isClient) {
        tasksByPhase[phase].push({
          id: task.id,
          name: task.clientLabel || task.name,
          status: task.clientStatusOverride || task.status,
          isMilestone: task.isMilestone,
          phaseName: task.phaseName,
          sortOrder: task.sortOrder,
          completedAt: task.completedAt,
        });
      } else {
        tasksByPhase[phase].push(task);
      }
    }

    return NextResponse.json({ tasksByPhase });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Authentication required") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAgencyAccess();
    const projectId = params.id;
    const body = await req.json();

    const {
      phase_name,
      name,
      description,
      estimated_hours,
      is_milestone,
      client_visible,
      client_label,
      assigned_to,
      sort_order,
    } = body;

    if (!phase_name || !name) {
      return NextResponse.json(
        { error: "phase_name and name are required" },
        { status: 400 }
      );
    }

    const [project] = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    let finalSortOrder = sort_order;
    if (finalSortOrder === undefined) {
      const existingTasks = await db
        .select({ sortOrder: schema.projectTasks.sortOrder })
        .from(schema.projectTasks)
        .where(
          and(
            eq(schema.projectTasks.projectId, projectId),
            eq(schema.projectTasks.phaseName, phase_name)
          )
        )
        .orderBy(asc(schema.projectTasks.sortOrder));

      finalSortOrder =
        existingTasks.length > 0
          ? existingTasks[existingTasks.length - 1].sortOrder + 1
          : 0;
    }

    const [task] = await db
      .insert(schema.projectTasks)
      .values({
        projectId,
        phaseName: phase_name,
        name,
        description: description || null,
        estimatedHours: estimated_hours ? String(estimated_hours) : null,
        isMilestone: is_milestone || false,
        clientVisible: client_visible || false,
        clientLabel: client_label || null,
        assignedTo: assigned_to || null,
        sortOrder: finalSortOrder,
        tierApplicable: true,
      })
      .returning();

    await db.insert(schema.activityLog).values({
      projectId,
      userId: session.user.id,
      action: "task_created",
      entityType: "task",
      entityId: task.id,
      metadata: { taskName: name, phaseName: phase_name },
    });

    return NextResponse.json({ task }, { status: 201 });
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAgencyAccess();
    const projectId = params.id;
    const body = await req.json();

    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        {
          error:
            "updates array is required with objects containing id and fields to update",
        },
        { status: 400 }
      );
    }

    const results: unknown[] = [];

    for (const update of updates) {
      const { id: taskId, ...fields } = update;

      if (!taskId) continue;

      const updateData: Record<string, unknown> = {};

      if (fields.sort_order !== undefined) {
        updateData.sortOrder = fields.sort_order;
      }
      if (fields.status !== undefined) {
        updateData.status = fields.status;
      }
      if (fields.assigned_to !== undefined) {
        updateData.assignedTo = fields.assigned_to;
      }
      if (fields.phase_name !== undefined) {
        updateData.phaseName = fields.phase_name;
      }

      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date();

        const [updated] = await db
          .update(schema.projectTasks)
          .set(updateData)
          .where(
            and(
              eq(schema.projectTasks.id, taskId),
              eq(schema.projectTasks.projectId, projectId)
            )
          )
          .returning();

        if (updated) {
          results.push(updated);
        }
      }
    }

    return NextResponse.json({ tasks: results, updated: results.length });
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
