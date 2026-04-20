import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAgencyAccess } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { eq, or, like, desc, count } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAgencyAccess();
    const { searchParams } = new URL(req.url);

    const searchQuery = searchParams.get("q");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const offset = (page - 1) * limit;

    let whereClause;

    if (searchQuery) {
      whereClause = or(
        like(schema.clients.companyName, `%${searchQuery}%`),
        like(schema.clients.contactName, `%${searchQuery}%`),
        like(schema.clients.contactEmail, `%${searchQuery}%`)
      );
    }

    const [clientRows, totalResult] = await Promise.all([
      db
        .select({
          id: schema.clients.id,
          userId: schema.clients.userId,
          companyName: schema.clients.companyName,
          contactName: schema.clients.contactName,
          contactEmail: schema.clients.contactEmail,
          contactPhone: schema.clients.contactPhone,
          industry: schema.clients.industry,
          websiteUrl: schema.clients.websiteUrl,
          tags: schema.clients.tags,
          createdAt: schema.clients.createdAt,
          updatedAt: schema.clients.updatedAt,
        })
        .from(schema.clients)
        .where(whereClause)
        .orderBy(desc(schema.clients.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(schema.clients).where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return NextResponse.json({
      clients: clientRows,
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
    const session = await requireAgencyAccess();
    const body = await req.json();

    const {
      company_name,
      contact_name,
      contact_email,
      contact_phone,
      industry,
      website_url,
      branding_assets,
      billing_address,
      notes,
      tags,
    } = body;

    if (!company_name || !contact_name || !contact_email) {
      return NextResponse.json(
        {
          error: "company_name, contact_name, and contact_email are required",
        },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, contact_email))
      .limit(1);

    if (existingUser.length) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const tempPassword = nanoid(16);
    const passwordHash = await hashPassword(tempPassword);

    const [user] = await db
      .insert(schema.users)
      .values({
        email: contact_email,
        name: contact_name,
        passwordHash,
        role: "client",
      })
      .returning();

    const [client] = await db
      .insert(schema.clients)
      .values({
        userId: user.id,
        companyName: company_name,
        contactName: contact_name,
        contactEmail: contact_email,
        contactPhone: contact_phone || null,
        industry: industry || null,
        websiteUrl: website_url || null,
        brandingAssets: branding_assets || null,
        billingAddress: billing_address || null,
        notes: notes || null,
        tags: tags || [],
      })
      .returning();

    await db.insert(schema.activityLog).values({
      userId: session.user.id,
      action: "client_created",
      entityType: "client",
      entityId: client.id,
      metadata: {
        companyName: company_name,
        contactEmail: contact_email,
      },
    });

    return NextResponse.json(
      {
        client,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tempPassword,
      },
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
