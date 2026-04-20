import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAgencyAccess, requireRole, hashPassword } from "@/lib/auth";
import { eq, ne, and, desc, count, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAgencyAccess();
    const { searchParams } = new URL(req.url);

    const departmentFilter = searchParams.get("department");

    const conditions: ReturnType<typeof eq>[] = [
      ne(schema.users.role, "client"),
    ];

    if (departmentFilter) {
      conditions.push(
        eq(
          schema.users.department,
          departmentFilter as (typeof schema.departmentEnum.enumValues)[number]
        )
      );
    }

    const whereClause = and(...conditions);

    const teamMembers = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        avatarUrl: schema.users.avatarUrl,
        department: schema.users.department,
        specialization: schema.users.specialization,
        maxConcurrentProjects: schema.users.maxConcurrentProjects,
        currentProjectCount: schema.users.currentProjectCount,
        timezone: schema.users.timezone,
        lastLoginAt: schema.users.lastLoginAt,
        lastCheckinAt: schema.users.lastCheckinAt,
        isActive: schema.users.isActive,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(whereClause)
      .orderBy(schema.users.name);

    return NextResponse.json({ team: teamMembers });
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

    const {
      email,
      name,
      password,
      role,
      department,
      specialization,
      max_concurrent_projects,
      timezone,
    } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "email, name, and password are required" },
        { status: 400 }
      );
    }

    const validRoles = ["admin", "manager", "team_member"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role for team member" },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existingUser.length) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(schema.users)
      .values({
        email,
        name,
        passwordHash,
        role: role || "team_member",
        department: department || null,
        specialization: specialization || null,
        maxConcurrentProjects: max_concurrent_projects || 5,
        timezone: timezone || "America/Toronto",
      })
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        department: schema.users.department,
        specialization: schema.users.specialization,
        maxConcurrentProjects: schema.users.maxConcurrentProjects,
        timezone: schema.users.timezone,
        isActive: schema.users.isActive,
        createdAt: schema.users.createdAt,
      });

    await db.insert(schema.activityLog).values({
      userId: session.user.id,
      action: "team_member_created",
      entityType: "user",
      entityId: user.id,
      metadata: {
        memberName: name,
        memberEmail: email,
        memberRole: role || "team_member",
      },
    });

    return NextResponse.json({ user }, { status: 201 });
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
