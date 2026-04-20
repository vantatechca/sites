import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAgencyAccess } from "@/lib/auth";
import { eq, and, count, sql } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const session = await requireAgencyAccess();
    const { id: projectId, taskId } = params;
    const body = await req.json();

    const [existing] = await db
      .select()
      .from(schema.projectTasks)
      .where(
        and(
          eq(schema.projectTasks.id, taskId),
          eq(schema.projectTasks.projectId, projectId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
      changes.status = { from: existing.status, to: body.status };

      if (body.status === "completed") {
        updateData.completedAt = new Date();
        updateData.completedBy = session.user.id;
      }

      if (existing.status === "completed" && body.status !== "completed") {
        updateData.completedAt = null;
        updateData.completedBy = null;
      }
    }

    if (body.assigned_to !== undefined) {
      updateData.assignedTo = body.assigned_to;
      changes.assigned_to = { from: existing.assignedTo, to: body.assigned_to };
    }

    if (body.actual_hours !== undefined) {
      updateData.actualHours = String(body.actual_hours);
      changes.actual_hours = {
        from: existing.actualHours,
        to: body.actual_hours,
      };
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (body.client_visible !== undefined) {
      updateData.clientVisible = body.client_visible;
    }

    if (body.client_label !== undefined) {
      updateData.clientLabel = body.client_label;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(schema.projectTasks)
      .set(updateData)
      .where(eq(schema.projectTasks.id, taskId))
      .returning();

    // Recalculate project progress
    const allTasks = await db
      .select({
        status: schema.projectTasks.status,
      })
      .from(schema.projectTasks)
      .where(eq(schema.projectTasks.projectId, projectId));

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(
      (t) => t.status === "completed" || t.status === "skipped"
    ).length;

    const progressPercent =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    await db
      .update(schema.projects)
      .set({
        progressPercent,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, projectId));

    await db.insert(schema.activityLog).values({
      projectId,
      userId: session.user.id,
      action: "task_updated",
      entityType: "task",
      entityId: taskId,
      metadata: {
        taskName: existing.name,
        changes,
      },
    });

    return NextResponse.json({ task: updated, projectProgress: progressPercent });
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
