import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { processCheckin } from "@/lib/ai";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  let checkinId: string | null = null;

  try {
    const body = await req.json();

    const { checkin_id, raw_response, user_projects } = body;
    checkinId = checkin_id;

    if (!checkin_id || !raw_response) {
      return NextResponse.json(
        { error: "checkin_id and raw_response are required" },
        { status: 400 }
      );
    }

    const [checkin] = await db
      .select()
      .from(schema.dailyCheckins)
      .where(eq(schema.dailyCheckins.id, checkin_id))
      .limit(1);

    if (!checkin) {
      return NextResponse.json(
        { error: "Check-in not found" },
        { status: 404 }
      );
    }

    const result = await processCheckin(raw_response, user_projects || []);

    const [updated] = await db
      .update(schema.dailyCheckins)
      .set({
        aiSummary: result.ai_summary,
        aiExtractedUpdates: result.ai_extracted_updates,
        aiConfidenceScore: String(result.ai_confidence_score),
        aiFlags: result.ai_flags,
        status: "ai_processed",
      })
      .where(eq(schema.dailyCheckins.id, checkin_id))
      .returning();

    return NextResponse.json({
      checkin: updated,
      ai_result: result,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Check-in processing error:", message);

    if (checkinId) {
      try {
        await db
          .update(schema.dailyCheckins)
          .set({
            aiFlags: [
              {
                type: "processing_error",
                message: `AI processing failed: ${message}`,
                severity: "high",
              },
            ],
          })
          .where(eq(schema.dailyCheckins.id, checkinId));
      } catch {
        // Silently fail the error recording
      }
    }

    return NextResponse.json(
      { error: "Failed to process check-in" },
      { status: 500 }
    );
  }
}
