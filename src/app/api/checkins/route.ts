import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth, requireAgencyAccess } from "@/lib/auth";
import { eq, and, desc, gte, lte, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAgencyAccess();
    const { searchParams } = new URL(req.url);

    const userIdFilter = searchParams.get("user_id");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [];

    if (userIdFilter) {
      conditions.push(eq(schema.dailyCheckins.userId, userIdFilter));
    }

    if (dateFrom) {
      conditions.push(gte(schema.dailyCheckins.checkinDate, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(schema.dailyCheckins.checkinDate, dateTo));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [checkinRows, totalResult] = await Promise.all([
      db
        .select({
          id: schema.dailyCheckins.id,
          userId: schema.dailyCheckins.userId,
          checkinDate: schema.dailyCheckins.checkinDate,
          rawResponse: schema.dailyCheckins.rawResponse,
          aiSummary: schema.dailyCheckins.aiSummary,
          aiExtractedUpdates: schema.dailyCheckins.aiExtractedUpdates,
          aiConfidenceScore: schema.dailyCheckins.aiConfidenceScore,
          aiFlags: schema.dailyCheckins.aiFlags,
          status: schema.dailyCheckins.status,
          submittedAt: schema.dailyCheckins.submittedAt,
          createdAt: schema.dailyCheckins.createdAt,
          userName: schema.users.name,
          userEmail: schema.users.email,
          userDepartment: schema.users.department,
        })
        .from(schema.dailyCheckins)
        .leftJoin(
          schema.users,
          eq(schema.dailyCheckins.userId, schema.users.id)
        )
        .where(whereClause)
        .orderBy(desc(schema.dailyCheckins.checkinDate))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(schema.dailyCheckins)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return NextResponse.json({
      checkins: checkinRows,
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
    if (message.includes("Access denied")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const { raw_response, checkin_date } = body;

    if (!raw_response) {
      return NextResponse.json(
        { error: "raw_response is required" },
        { status: 400 }
      );
    }

    if (session.user.role === "client") {
      return NextResponse.json(
        { error: "Clients cannot submit check-ins" },
        { status: 403 }
      );
    }

    const today = checkin_date || new Date().toISOString().split("T")[0];

    const existingCheckin = await db
      .select({ id: schema.dailyCheckins.id })
      .from(schema.dailyCheckins)
      .where(
        and(
          eq(schema.dailyCheckins.userId, session.user.id),
          eq(schema.dailyCheckins.checkinDate, today)
        )
      )
      .limit(1);

    if (existingCheckin.length) {
      const [updated] = await db
        .update(schema.dailyCheckins)
        .set({
          rawResponse: raw_response,
          status: "submitted",
          submittedAt: new Date(),
        })
        .where(eq(schema.dailyCheckins.id, existingCheckin[0].id))
        .returning();

      await db
        .update(schema.users)
        .set({ lastCheckinAt: new Date() })
        .where(eq(schema.users.id, session.user.id));

      return NextResponse.json({ checkin: updated });
    }

    const [checkin] = await db
      .insert(schema.dailyCheckins)
      .values({
        userId: session.user.id,
        checkinDate: today,
        rawResponse: raw_response,
        status: "submitted",
        submittedAt: new Date(),
      })
      .returning();

    await db
      .update(schema.users)
      .set({ lastCheckinAt: new Date() })
      .where(eq(schema.users.id, session.user.id));

    // Trigger AI processing asynchronously
    try {
      const userTasks = await db
        .select({
          taskId: schema.projectTasks.id,
          taskName: schema.projectTasks.name,
          taskStatus: schema.projectTasks.status,
          projectId: schema.projects.id,
          projectName: schema.projects.projectName,
        })
        .from(schema.projectTasks)
        .leftJoin(
          schema.projects,
          eq(schema.projectTasks.projectId, schema.projects.id)
        )
        .where(eq(schema.projectTasks.assignedTo, session.user.id));

      const projectsMap = new Map<
        string,
        {
          projectId: string;
          projectName: string;
          tasks: { taskId: string; taskName: string; status: string }[];
        }
      >();

      for (const row of userTasks) {
        if (!row.projectId) continue;
        if (!projectsMap.has(row.projectId)) {
          projectsMap.set(row.projectId, {
            projectId: row.projectId,
            projectName: row.projectName || "",
            tasks: [],
          });
        }
        projectsMap.get(row.projectId)!.tasks.push({
          taskId: row.taskId,
          taskName: row.taskName,
          status: row.taskStatus,
        });
      }

      const userProjects = Array.from(projectsMap.values());

      const baseUrl = req.headers.get("x-forwarded-proto")
        ? `${req.headers.get("x-forwarded-proto")}://${req.headers.get("host")}`
        : `http://${req.headers.get("host")}`;

      fetch(`${baseUrl}/api/checkins/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkin_id: checkin.id,
          raw_response,
          user_projects: userProjects,
        }),
      }).catch(() => {
        // Fire and forget - processing happens asynchronously
      });
    } catch {
      // Don't fail the check-in submission if AI processing setup fails
    }

    return NextResponse.json({ checkin }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Authentication required") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
