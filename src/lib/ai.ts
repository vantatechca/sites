import Anthropic from "@anthropic-ai/sdk";

interface UserProject {
  projectId: string;
  projectName: string;
  tasks: {
    taskId: string;
    taskName: string;
    status: string;
  }[];
}

interface ExtractedUpdate {
  projectId?: string;
  taskId?: string;
  statusUpdate?: string;
  hoursWorked?: number;
  blockers?: string[];
}

interface AIFlag {
  type: string;
  message: string;
  severity: string;
}

interface CheckinResult {
  ai_summary: string;
  ai_extracted_updates: ExtractedUpdate[];
  ai_confidence_score: number;
  ai_flags: AIFlag[];
}

const SYSTEM_PROMPT = `You are an AI assistant that processes daily check-in reports from team members at a web development agency. Your job is to extract structured data from their natural language check-in responses.

Given a team member's check-in response and their current project/task assignments, extract the following information:

1. **Summary**: A concise 1-2 sentence summary of what they did and plan to do.
2. **Task Updates**: For each project/task mentioned, determine:
   - Which project it relates to (match to provided project list)
   - Which specific task it relates to (match to provided task list)
   - Status update (e.g., "in_progress", "completed", "blocked")
   - Hours worked on that task
3. **Blockers**: Any blockers or issues mentioned
4. **Flags**: Any concerns such as:
   - Team member seems overwhelmed
   - Deadlines at risk
   - Dependencies not met
   - Vague or unclear response
   - No progress reported on assigned tasks

Respond ONLY with valid JSON in this exact format:
{
  "summary": "string",
  "extracted_updates": [
    {
      "projectId": "string or null if unclear",
      "taskId": "string or null if unclear",
      "statusUpdate": "not_started | in_progress | completed | blocked",
      "hoursWorked": number,
      "blockers": ["string"] or []
    }
  ],
  "confidence_score": number between 0 and 1,
  "flags": [
    {
      "type": "string (overwhelmed|deadline_risk|dependency_blocked|vague_response|no_progress|scope_creep)",
      "message": "string",
      "severity": "low|medium|high"
    }
  ]
}

If the check-in is vague or you cannot confidently match to projects/tasks, set confidence_score lower and add appropriate flags. Always return valid JSON.`;

export async function processCheckin(
  rawResponse: string,
  userProjects: UserProject[]
): Promise<CheckinResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      ai_summary: "AI processing unavailable - API key not configured",
      ai_extracted_updates: [],
      ai_confidence_score: 0,
      ai_flags: [
        {
          type: "processing_error",
          message: "Anthropic API key not configured",
          severity: "high",
        },
      ],
    };
  }

  const client = new Anthropic({ apiKey });

  const projectContext = userProjects
    .map(
      (p) =>
        `Project: "${p.projectName}" (ID: ${p.projectId})\n  Tasks:\n${p.tasks
          .map(
            (t) =>
              `    - "${t.taskName}" (ID: ${t.taskId}, Status: ${t.status})`
          )
          .join("\n")}`
    )
    .join("\n\n");

  const userMessage = `Here are the team member's current project and task assignments:

${projectContext || "No projects/tasks currently assigned."}

Here is their daily check-in response:
"""
${rawResponse}
"""

Extract the structured data from this check-in.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return {
        ai_summary: "AI processing returned no text content",
        ai_extracted_updates: [],
        ai_confidence_score: 0,
        ai_flags: [
          {
            type: "processing_error",
            message: "No text content in AI response",
            severity: "medium",
          },
        ],
      };
    }

    const rawJson = textContent.text.trim();
    const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        ai_summary: "AI processing returned invalid format",
        ai_extracted_updates: [],
        ai_confidence_score: 0,
        ai_flags: [
          {
            type: "processing_error",
            message: "Could not parse JSON from AI response",
            severity: "medium",
          },
        ],
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      ai_summary: parsed.summary || "",
      ai_extracted_updates: Array.isArray(parsed.extracted_updates)
        ? parsed.extracted_updates.map(
            (u: Record<string, unknown>) => ({
              projectId: u.projectId || undefined,
              taskId: u.taskId || undefined,
              statusUpdate: u.statusUpdate || undefined,
              hoursWorked:
                typeof u.hoursWorked === "number" ? u.hoursWorked : undefined,
              blockers: Array.isArray(u.blockers) ? u.blockers : [],
            })
          )
        : [],
      ai_confidence_score:
        typeof parsed.confidence_score === "number"
          ? Math.min(1, Math.max(0, parsed.confidence_score))
          : 0.5,
      ai_flags: Array.isArray(parsed.flags)
        ? parsed.flags.map((f: Record<string, unknown>) => ({
            type: String(f.type || "unknown"),
            message: String(f.message || ""),
            severity: String(f.severity || "low"),
          }))
        : [],
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown AI processing error";

    return {
      ai_summary: `AI processing failed: ${message}`,
      ai_extracted_updates: [],
      ai_confidence_score: 0,
      ai_flags: [
        {
          type: "processing_error",
          message,
          severity: "high",
        },
      ],
    };
  }
}
