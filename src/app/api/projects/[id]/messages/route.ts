import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, desc, count, or, inArray } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const projectId = params.id;
    const isClient = session.user.role === "client";
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10))
    );
    const offset = (page - 1) * limit;
    const threadTypeFilter = searchParams.get("thread_type");

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
      eq(schema.messages.projectId, projectId),
    ];

    if (isClient) {
      conditions.push(
        or(
          eq(schema.messages.threadType, "client_chat"),
          eq(schema.messages.threadType, "deliverable_comment")
        )!
      );
    } else if (threadTypeFilter) {
      conditions.push(
        eq(
          schema.messages.threadType,
          threadTypeFilter as (typeof schema.messageThreadTypeEnum.enumValues)[number]
        )
      );
    }

    const whereClause = and(...conditions);

    const [messageRows, totalResult] = await Promise.all([
      db
        .select({
          id: schema.messages.id,
          projectId: schema.messages.projectId,
          threadType: schema.messages.threadType,
          parentMessageId: schema.messages.parentMessageId,
          senderId: schema.messages.senderId,
          body: schema.messages.body,
          attachments: schema.messages.attachments,
          deliverableId: schema.messages.deliverableId,
          isVisibleToClient: schema.messages.isVisibleToClient,
          isReadByClient: schema.messages.isReadByClient,
          createdAt: schema.messages.createdAt,
          senderName: schema.users.name,
          senderEmail: schema.users.email,
          senderRole: schema.users.role,
          senderAvatarUrl: schema.users.avatarUrl,
        })
        .from(schema.messages)
        .leftJoin(schema.users, eq(schema.messages.senderId, schema.users.id))
        .where(whereClause)
        .orderBy(desc(schema.messages.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(schema.messages).where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return NextResponse.json({
      messages: messageRows,
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const projectId = params.id;
    const isClient = session.user.role === "client";
    const body = await req.json();

    const { thread_type, body: messageBody, parent_message_id, deliverable_id, attachments } = body;

    if (!thread_type || !messageBody) {
      return NextResponse.json(
        { error: "thread_type and body are required" },
        { status: 400 }
      );
    }

    const validThreadTypes = ["client_chat", "internal_chat", "deliverable_comment"];
    if (!validThreadTypes.includes(thread_type)) {
      return NextResponse.json(
        { error: "Invalid thread_type" },
        { status: 400 }
      );
    }

    if (isClient && thread_type === "internal_chat") {
      return NextResponse.json(
        { error: "Clients cannot post to internal chat" },
        { status: 403 }
      );
    }

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

    const isVisibleToClient =
      thread_type === "client_chat" || thread_type === "deliverable_comment";

    const [message] = await db
      .insert(schema.messages)
      .values({
        projectId,
        threadType: thread_type,
        senderId: session.user.id,
        body: messageBody,
        parentMessageId: parent_message_id || null,
        deliverableId: deliverable_id || null,
        attachments: attachments || null,
        isVisibleToClient,
      })
      .returning();

    return NextResponse.json({ message }, { status: 201 });
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
