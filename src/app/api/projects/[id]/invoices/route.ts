import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth, requireAgencyAccess } from "@/lib/auth";
import { eq, and, desc, sql, count } from "drizzle-orm";

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
      eq(schema.invoices.projectId, projectId),
    ];

    if (isClient) {
      conditions.push(eq(schema.invoices.visibleToClient, true));
    }

    const invoiceRows = await db
      .select()
      .from(schema.invoices)
      .where(and(...conditions))
      .orderBy(desc(schema.invoices.createdAt));

    return NextResponse.json({ invoices: invoiceRows });
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
      amount,
      currency,
      description,
      milestone_name,
      status,
      due_date,
      visible_to_client,
    } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "amount is required" },
        { status: 400 }
      );
    }

    const [project] = await db
      .select({
        id: schema.projects.id,
        clientId: schema.projects.clientId,
      })
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const year = new Date().getFullYear();

    const [latestInvoice] = await db
      .select({ invoiceNumber: schema.invoices.invoiceNumber })
      .from(schema.invoices)
      .where(
        sql`${schema.invoices.invoiceNumber} LIKE ${"INV-" + year + "-%"}`
      )
      .orderBy(desc(schema.invoices.invoiceNumber))
      .limit(1);

    let nextNumber = 1;
    if (latestInvoice) {
      const parts = latestInvoice.invoiceNumber.split("-");
      const lastNum = parseInt(parts[2], 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    const invoiceNumber = `INV-${year}-${String(nextNumber).padStart(3, "0")}`;

    const [invoice] = await db
      .insert(schema.invoices)
      .values({
        projectId,
        clientId: project.clientId,
        invoiceNumber,
        amount: String(amount),
        currency: currency || "CAD",
        description: description || null,
        milestoneName: milestone_name || null,
        status: status || "draft",
        dueDate: due_date || null,
        visibleToClient:
          visible_to_client !== undefined ? visible_to_client : true,
      })
      .returning();

    await db.insert(schema.activityLog).values({
      projectId,
      userId: session.user.id,
      action: "invoice_created",
      entityType: "invoice",
      entityId: invoice.id,
      metadata: {
        invoiceNumber,
        amount,
        currency: currency || "CAD",
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
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
