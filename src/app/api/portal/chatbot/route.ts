import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface ProjectContext {
  name: string;
  status: string;
  progressPercent: number;
  currentPhase?: string | null;
  estimatedLaunchDate?: string | null;
  description?: string | null;
}

const SYSTEM_PROMPT = `You are a helpful assistant for a client viewing their website project portal at a digital agency called SiteForge.

You have access to basic information about the client's project. Answer questions in a friendly, concise, and professional tone.

Guidelines:
- Keep responses under 3 sentences when possible
- Use the project data provided to answer accurately
- If asked about something not in the provided data, say "I don't have that information — your project manager can help with that"
- Never make up facts about tasks, team members, or dates not explicitly given
- Be encouraging and reassuring about the project's progress
- Use plain language — no jargon like "kanban" or "sprint"
- Refer to phases by their friendly names (e.g., "Design" not "design")`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "sk-ant-xxxxx") {
      return NextResponse.json({
        reply:
          "AI assistant is not configured yet. Your project manager can help answer any questions directly!",
      });
    }

    const body = await req.json();
    const { message, project, history } = body as {
      message: string;
      project: ProjectContext;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const projectContext = `Here is the current project information:
- Project name: ${project.name}
- Current phase: ${project.currentPhase ?? project.status}
- Progress: ${project.progressPercent}% complete
- Estimated launch: ${project.estimatedLaunchDate ?? "not set yet"}
${project.description ? `- Description: ${project.description}` : ""}`;

    const client = new Anthropic({ apiKey });

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

    if (Array.isArray(history)) {
      for (const m of history.slice(-6)) {
        if (m.role === "user" || m.role === "assistant") {
          messages.push({ role: m.role, content: String(m.content) });
        }
      }
    }

    messages.push({
      role: "user",
      content: `${projectContext}\n\nClient's question: ${message}`,
    });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const reply =
      textBlock && textBlock.type === "text"
        ? textBlock.text
        : "Sorry, I didn't get that. Could you rephrase?";

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "AI assistant error";
    return NextResponse.json(
      {
        reply:
          "Sorry, I ran into a problem answering that. Your project manager can help!",
        error: message,
      },
      { status: 500 }
    );
  }
}
