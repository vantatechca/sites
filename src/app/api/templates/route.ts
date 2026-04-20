import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAgencyAccess, requireRole } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await requireAgencyAccess();

    const templates = await db
      .select({
        id: schema.checklistTemplates.id,
        name: schema.checklistTemplates.name,
        version: schema.checklistTemplates.version,
        phases: schema.checklistTemplates.phases,
        isActive: schema.checklistTemplates.isActive,
        createdBy: schema.checklistTemplates.createdBy,
        createdAt: schema.checklistTemplates.createdAt,
        updatedAt: schema.checklistTemplates.updatedAt,
        creatorName: schema.users.name,
      })
      .from(schema.checklistTemplates)
      .leftJoin(
        schema.users,
        eq(schema.checklistTemplates.createdBy, schema.users.id)
      )
      .orderBy(desc(schema.checklistTemplates.updatedAt));

    return NextResponse.json({ templates });
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

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["admin"]);
    const body = await req.json();

    const { name, phases, is_active } = body;

    if (!name || !phases || !Array.isArray(phases)) {
      return NextResponse.json(
        { error: "name and phases array are required" },
        { status: 400 }
      );
    }

    for (const phase of phases) {
      if (!phase.name || !Array.isArray(phase.tasks)) {
        return NextResponse.json(
          { error: "Each phase must have a name and tasks array" },
          { status: 400 }
        );
      }

      for (const task of phase.tasks) {
        if (!task.name) {
          return NextResponse.json(
            { error: "Each task must have a name" },
            { status: 400 }
          );
        }
        if (!task.tierApplicable) {
          task.tierApplicable = { basic: true, pro: true, enterprise: true };
        }
        if (task.estimatedHours === undefined) {
          task.estimatedHours = 0;
        }
        if (task.isMilestone === undefined) {
          task.isMilestone = false;
        }
        if (task.clientVisible === undefined) {
          task.clientVisible = false;
        }
      }

      if (phase.sortOrder === undefined) {
        phase.sortOrder = phases.indexOf(phase);
      }
    }

    if (is_active) {
      await db
        .update(schema.checklistTemplates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(schema.checklistTemplates.isActive, true));
    }

    const [template] = await db
      .insert(schema.checklistTemplates)
      .values({
        name,
        phases,
        isActive: is_active !== undefined ? is_active : false,
        createdBy: session.user.id,
        version: 1,
      })
      .returning();

    return NextResponse.json({ template }, { status: 201 });
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

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole(["admin"]);
    const body = await req.json();

    const { template_id, name, phases, is_active } = body;

    if (!template_id) {
      return NextResponse.json(
        { error: "template_id is required" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(schema.checklistTemplates)
      .where(eq(schema.checklistTemplates.id, template_id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (phases !== undefined) {
      if (!Array.isArray(phases)) {
        return NextResponse.json(
          { error: "phases must be an array" },
          { status: 400 }
        );
      }
      updateData.phases = phases;
    }

    if (is_active !== undefined) {
      if (is_active) {
        await db
          .update(schema.checklistTemplates)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(schema.checklistTemplates.isActive, true));
      }
      updateData.isActive = is_active;
    }

    updateData.version = existing.version + 1;
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(schema.checklistTemplates)
      .set(updateData)
      .where(eq(schema.checklistTemplates.id, template_id))
      .returning();

    return NextResponse.json({ template: updated });
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
