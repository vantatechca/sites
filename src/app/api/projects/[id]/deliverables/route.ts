import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth, requireAgencyAccess } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

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

    const conditions: ReturnType<typeof eq>[] = [
      eq(schema.deliverables.projectId, projectId),
    ];

    if (isClient) {
      conditions.push(eq(schema.deliverables.clientVisible, true));
    }

    const deliverableRows = await db
      .select({
        id: schema.deliverables.id,
        projectId: schema.deliverables.projectId,
        taskId: schema.deliverables.taskId,
        name: schema.deliverables.name,
        description: schema.deliverables.description,
        type: schema.deliverables.type,
        fileUrl: schema.deliverables.fileUrl,
        previewUrl: schema.deliverables.previewUrl,
        clientVisible: schema.deliverables.clientVisible,
        clientApproved: schema.deliverables.clientApproved,
        clientFeedback: schema.deliverables.clientFeedback,
        publishedAt: schema.deliverables.publishedAt,
        createdBy: schema.deliverables.createdBy,
        createdAt: schema.deliverables.createdAt,
        creatorName: schema.users.name,
      })
      .from(schema.deliverables)
      .leftJoin(
        schema.users,
        eq(schema.deliverables.createdBy, schema.users.id)
      )
      .where(and(...conditions))
      .orderBy(desc(schema.deliverables.createdAt));

    return NextResponse.json({ deliverables: deliverableRows });
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

    const { name, description, type, file_url, preview_url, client_visible, task_id } =
      body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "name and type are required" },
        { status: 400 }
      );
    }

    const validTypes = [
      "screenshot",
      "live_preview_link",
      "file",
      "video",
      "text_update",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid deliverable type" },
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

    if (task_id) {
      const [task] = await db
        .select({ id: schema.projectTasks.id })
        .from(schema.projectTasks)
        .where(
          and(
            eq(schema.projectTasks.id, task_id),
            eq(schema.projectTasks.projectId, projectId)
          )
        )
        .limit(1);

      if (!task) {
        return NextResponse.json(
          { error: "Task not found in this project" },
          { status: 404 }
        );
      }
    }

    const [deliverable] = await db
      .insert(schema.deliverables)
      .values({
        projectId,
        taskId: task_id || null,
        name,
        description: description || null,
        type,
        fileUrl: file_url || null,
        previewUrl: preview_url || null,
        clientVisible: client_visible !== undefined ? client_visible : true,
        createdBy: session.user.id,
      })
      .returning();

    await db.insert(schema.activityLog).values({
      projectId,
      userId: session.user.id,
      action: "deliverable_created",
      entityType: "deliverable",
      entityId: deliverable.id,
      metadata: { deliverableName: name, type },
    });

    return NextResponse.json({ deliverable }, { status: 201 });
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
    const session = await requireAuth();
    const projectId = params.id;
    const isClient = session.user.role === "client";
    const body = await req.json();

    const { deliverable_id } = body;

    if (!deliverable_id) {
      return NextResponse.json(
        { error: "deliverable_id is required" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(schema.deliverables)
      .where(
        and(
          eq(schema.deliverables.id, deliverable_id),
          eq(schema.deliverables.projectId, projectId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Deliverable not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (isClient) {
      if (body.client_approved !== undefined) {
        updateData.clientApproved = body.client_approved;
      }
      if (body.client_feedback !== undefined) {
        updateData.clientFeedback = body.client_feedback;
      }
    } else {
      if (body.publish === true && !existing.publishedAt) {
        updateData.publishedAt = new Date();
        updateData.clientVisible = true;
      }
      if (body.client_visible !== undefined) {
        updateData.clientVisible = body.client_visible;
      }
      if (body.name !== undefined) {
        updateData.name = body.name;
      }
      if (body.description !== undefined) {
        updateData.description = body.description;
      }
      if (body.file_url !== undefined) {
        updateData.fileUrl = body.file_url;
      }
      if (body.preview_url !== undefined) {
        updateData.previewUrl = body.preview_url;
      }
      if (body.client_approved !== undefined) {
        updateData.clientApproved = body.client_approved;
      }
      if (body.client_feedback !== undefined) {
        updateData.clientFeedback = body.client_feedback;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(schema.deliverables)
      .set(updateData)
      .where(eq(schema.deliverables.id, deliverable_id))
      .returning();

    await db.insert(schema.activityLog).values({
      projectId,
      userId: session.user.id,
      action: "deliverable_updated",
      entityType: "deliverable",
      entityId: deliverable_id,
      metadata: { updates: Object.keys(updateData) },
    });

    return NextResponse.json({ deliverable: updated });
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
