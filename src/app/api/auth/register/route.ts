import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    // Option B: First user becomes admin, all subsequent signups are clients
    const [{ total }] = await db.select({ total: count() }).from(users);
    const role = total === 0 ? "admin" : "client";

    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
        isActive: true,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    return NextResponse.json(
      {
        success: true,
        user: newUser,
        message: "Account created successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
