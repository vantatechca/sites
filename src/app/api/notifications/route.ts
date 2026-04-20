import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, desc, count, inArray } from "drizzle-orm";

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

    const whereClause = eq(schema.notifications.userId, session.user.id);

    const [notificationRows, totalResult, unreadResult] = await Promise.all([
      db
        .select()
        .from(schema.notifications)
        .where(whereClause)
        .orderBy(desc(schema.notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(schema.notifications)
        .where(whereClause),
      db
        .select({ unread: count() })
        .from(schema.notifications)
        .where(
          and(
            eq(schema.notifications.userId, session.user.id),
            eq(schema.notifications.isRead, false)
          )
        ),
    ]);

    const total = totalResult[0]?.total ?? 0;
    const unreadCount = unreadResult[0]?.unread ?? 0;

    return NextResponse.json({
      notifications: notificationRows,
      total,
      unreadCount,
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

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const { notification_ids, mark_all_read } = body;

    if (mark_all_read) {
      await db
        .update(schema.notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(schema.notifications.userId, session.user.id),
            eq(schema.notifications.isRead, false)
          )
        );

      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
      return NextResponse.json(
        { error: "notification_ids array or mark_all_read is required" },
        { status: 400 }
      );
    }

    await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(schema.notifications.userId, session.user.id),
          inArray(schema.notifications.id, notification_ids)
        )
      );

    return NextResponse.json({
      success: true,
      message: `${notification_ids.length} notification(s) marked as read`,
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
