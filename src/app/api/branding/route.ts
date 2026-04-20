import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const [branding] = await db
      .select()
      .from(schema.brandingConfig)
      .where(eq(schema.brandingConfig.isActive, true))
      .orderBy(desc(schema.brandingConfig.createdAt))
      .limit(1);

    if (!branding) {
      return NextResponse.json({
        branding: {
          agencyName: "SiteForge",
          primaryColor: "#2D5A8C",
          secondaryColor: "#1A1A2E",
          accentColor: "#E8491D",
          fontHeading: "Inter",
          fontBody: "Inter",
        },
      });
    }

    return NextResponse.json({ branding });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole(["admin"]);
    const body = await req.json();

    const allowedFields = [
      "agency_name",
      "logo_light_url",
      "logo_dark_url",
      "favicon_url",
      "primary_color",
      "secondary_color",
      "accent_color",
      "font_heading",
      "font_body",
      "portal_domain",
      "welcome_message",
      "footer_text",
    ];

    const [existing] = await db
      .select()
      .from(schema.brandingConfig)
      .where(eq(schema.brandingConfig.isActive, true))
      .orderBy(desc(schema.brandingConfig.createdAt))
      .limit(1);

    const updateData: Record<string, unknown> = {};

    if (body.agency_name !== undefined) updateData.agencyName = body.agency_name;
    if (body.logo_light_url !== undefined)
      updateData.logoLightUrl = body.logo_light_url;
    if (body.logo_dark_url !== undefined)
      updateData.logoDarkUrl = body.logo_dark_url;
    if (body.favicon_url !== undefined) updateData.faviconUrl = body.favicon_url;
    if (body.primary_color !== undefined)
      updateData.primaryColor = body.primary_color;
    if (body.secondary_color !== undefined)
      updateData.secondaryColor = body.secondary_color;
    if (body.accent_color !== undefined)
      updateData.accentColor = body.accent_color;
    if (body.font_heading !== undefined)
      updateData.fontHeading = body.font_heading;
    if (body.font_body !== undefined) updateData.fontBody = body.font_body;
    if (body.portal_domain !== undefined)
      updateData.portalDomain = body.portal_domain;
    if (body.welcome_message !== undefined)
      updateData.welcomeMessage = body.welcome_message;
    if (body.footer_text !== undefined) updateData.footerText = body.footer_text;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updateData.updatedAt = new Date();

    if (existing) {
      const [updated] = await db
        .update(schema.brandingConfig)
        .set(updateData)
        .where(eq(schema.brandingConfig.id, existing.id))
        .returning();

      return NextResponse.json({ branding: updated });
    }

    const [created] = await db
      .insert(schema.brandingConfig)
      .values({
        agencyName: (updateData.agencyName as string) || "SiteForge",
        primaryColor: (updateData.primaryColor as string) || "#2D5A8C",
        secondaryColor: (updateData.secondaryColor as string) || "#1A1A2E",
        accentColor: (updateData.accentColor as string) || "#E8491D",
        fontHeading: (updateData.fontHeading as string) || "Inter",
        fontBody: (updateData.fontBody as string) || "Inter",
        logoLightUrl: (updateData.logoLightUrl as string) || null,
        logoDarkUrl: (updateData.logoDarkUrl as string) || null,
        faviconUrl: (updateData.faviconUrl as string) || null,
        portalDomain: (updateData.portalDomain as string) || null,
        welcomeMessage: (updateData.welcomeMessage as string) || null,
        footerText: (updateData.footerText as string) || null,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ branding: created }, { status: 201 });
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
