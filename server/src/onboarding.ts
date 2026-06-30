import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, TokenUsage } from "./chat.js";
import type { KnowledgeKind } from "./model.js";

const MODEL = "claude-sonnet-4-6";
const KINDS: KnowledgeKind[] = ["cv", "experience", "project", "personal", "custom"];

/**
 * System prompt for the onboarding interviewer. It runs a short, friendly
 * interview to gather exactly the grounded facts the person's bot will be
 * allowed to state - role and seniority, key positions, and standout projects.
 */
export function buildOnboardingSystemPrompt(
  subjectName: string,
  opts: { hasLinkedIn?: boolean } = {},
): string {
  const name = subjectName || "the user";

  // Users who signed up without LinkedIn have no profile to lean on, so gather
  // a bit more context and capture any professional links they do have.
  const noLinkedInStep = opts.hasLinkedIn
    ? ""
    : `\n5. Since they signed up without LinkedIn, ask whether they have a LinkedIn, portfolio, GitHub, or personal site URL to include so recruiters can cross-reference - capture any they share. Also spend an extra beat confirming their location and how they prefer to be contacted, since there is no profile to draw on.`;

  return `You are an onboarding interviewer helping ${name} build a grounded "interview agent" - an AI that will represent them to recruiters and answer ONLY from facts they provide.

Your job is to interview ${name} and draw out the concrete facts their agent needs. Cover, roughly in this order:
1. Their current or target role and seniority.
2. Their work history - for each meaningful position: employer, title, dates, and 1-2 concrete impacts or responsibilities.
3. Their 1-3 standout projects - what they built, the impact, and the tech/stack.
4. Optionally, a few light personal details for rapport (hobbies, location) if they want.${noLinkedInStep}

Rules for the interview:
- Ask ONE focused question at a time (occasionally two if tightly related). Keep your turns short.
- Be warm, sharp, and concrete. Push gently for specifics - numbers, technologies, outcomes - because vague input makes a weak agent.
- Acknowledge each answer briefly, then ask the next thing. Do not lecture.
- When you have enough for a solid agent (a role, at least one position, and at least one project), tell them they can click "Build my knowledge base" whenever they are ready, and offer to keep going for more depth.
- Never invent facts. You are only collecting what ${name} tells you.
- Write with a regular hyphen (-), never em dashes or emojis.

Start by greeting ${name} by name and asking about their current or target role.`;
}

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "propose_knowledge_items",
  description:
    "Turn the interview into a set of grounded knowledge items for the user's interview agent. Only include facts the user actually stated.",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "The proposed knowledge items, ordered by importance.",
        items: {
          type: "object",
          properties: {
            kind: {
              type: "string",
              enum: KINDS,
              description:
                "experience for a job/position, project for a built project, cv for a summary, personal for light rapport details, custom otherwise.",
            },
            title: {
              type: "string",
              description:
                "A short title, e.g. 'Senior Engineer at Acme (2021-2024)' or 'Project: Realtime analytics pipeline'.",
            },
            body: {
              type: "string",
              description:
                "A concise Markdown summary stating only what the user said - role/impact/stack or project/impact/stack. No invented facts.",
            },
          },
          required: ["kind", "title", "body"],
        },
      },
    },
    required: ["items"],
  },
};

export interface ProposedItem {
  kind: KnowledgeKind;
  title: string;
  body: string;
}

/**
 * Runs a single structured-output call that converts the interview transcript
 * into proposed knowledge items. Uses forced tool use so the result is always
 * the validated tool input.
 */
export async function extractKnowledge(
  client: Anthropic,
  subjectName: string,
  messages: ChatMessage[],
): Promise<{ items: ProposedItem[]; usage: TokenUsage }> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: "propose_knowledge_items" },
    system: `Convert this onboarding interview with ${subjectName || "the user"} into grounded knowledge items. Include only facts the user stated; never invent employers, dates, metrics, or technologies.`,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const usage: TokenUsage = {
    inputTokens: res.usage.input_tokens ?? 0,
    outputTokens: res.usage.output_tokens ?? 0,
    cacheCreationTokens: res.usage.cache_creation_input_tokens ?? 0,
    cacheReadTokens: res.usage.cache_read_input_tokens ?? 0,
  };

  const block = res.content.find((c) => c.type === "tool_use");
  if (!block || block.type !== "tool_use") return { items: [], usage };
  const input = block.input as { items?: ProposedItem[] };
  const raw = Array.isArray(input.items) ? input.items : [];
  const items = raw
    .filter((it) => it && it.title && it.body)
    .map((it) => ({
      kind: (KINDS as string[]).includes(it.kind) ? it.kind : "custom",
      title: String(it.title).trim(),
      body: String(it.body).trim(),
    }));
  return { items, usage };
}
