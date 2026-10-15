import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const S = (n: number) => z.string().max(n);

const EmailInput = z.object({
  purpose: S(500).min(1),
  points: S(4000),
  tone: S(40),
  length: z.enum(["short", "medium", "long"]),
  recipient: S(200).optional(),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data }) => {
    const { callAI } = await import("./ai.server");
    const text = await callAI({
      instructions:
        "You write clear, professional emails. Output plain text only: first line 'Subject: ...', blank line, then the body with greeting and sign-off. No markdown.",
      input: `Purpose: ${data.purpose}\nRecipient: ${data.recipient || "unspecified"}\nKey points:\n${data.points || "(none)"}\nTone: ${data.tone}\nLength: ${data.length}`,
    });
    return { text };
  });

const EditInput = z.object({
  email: S(8000).min(1),
  action: z.enum(["improve", "shorten", "expand", "tone"]),
  tone: S(40).optional(),
});

export const editEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EditInput.parse(d))
  .handler(async ({ data }) => {
    const { callAI } = await import("./ai.server");
    const how = {
      improve: "Improve clarity, flow and professionalism without changing meaning.",
      shorten: "Make it noticeably more concise while keeping all key information.",
      expand: "Expand with helpful detail and context while staying professional.",
      tone: `Rewrite in a ${data.tone || "friendly"} tone.`,
    }[data.action];
    const text = await callAI({
      instructions: `You edit emails. ${how} Keep the 'Subject: ...' first line format. Output plain text only, no markdown, no commentary.`,
      input: data.email,
    });
    return { text };
  });

const taskItem = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    priority: { type: "string", enum: ["high", "medium", "low"] },
    dueInDays: { type: "integer" },
    minutes: { type: "integer" },
  },
  required: ["title", "priority", "dueInDays", "minutes"],
};

export const breakDownGoal = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ goal: S(6000).min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { callAI } = await import("./ai.server");
    const raw = await callAI({
      instructions:
        "You are a productivity planner. Break the user's goal or text into 3-8 concrete, actionable tasks in logical order. Each has a priority, a realistic due date offset in days from today (0-30), and an estimate in minutes.",
      input: data.goal,
      schema: {
        name: "task_breakdown",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: { tasks: { type: "array", items: taskItem } },
          required: ["tasks"],
        },
      },
    });
    return JSON.parse(raw) as { tasks: { title: string; priority: "high" | "medium" | "low"; dueInDays: number; minutes: number }[] };
  });

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        today: S(20),
        tasks: z.array(z.object({ id: S(60), title: S(300), due: S(20).nullable(), priority: S(10) })).max(60),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { callAI } = await import("./ai.server");
    const raw = await callAI({
      instructions:
        "You are a productivity planner. Given open tasks and today's date, suggest a priority for each (consider deadlines and overdue items), a one-sentence reason, and a short plain-text schedule for today and the next few days (use '- ' bullets, no markdown headings).",
      input: JSON.stringify(data),
      schema: {
        name: "task_plan",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  id: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  reason: { type: "string" },
                },
                required: ["id", "priority", "reason"],
              },
            },
            schedule: { type: "string" },
          },
          required: ["items", "schedule"],
        },
      },
    });
    return JSON.parse(raw) as { items: { id: string; priority: "high" | "medium" | "low"; reason: string }[]; schedule: string };
  });

export type ResearchResult = {
  summary: string;
  keyPoints: string[];
  notes: string;
  outline: string[];
  keywords: string[];
  sources: { title: string; note: string }[];
};

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ topic: S(2000).min(1), depth: z.enum(["brief", "standard", "deep"]) }).parse(d))
  .handler(async ({ data }) => {
    const { callAI } = await import("./ai.server");
    const raw = await callAI({
      instructions:
        "You are a careful research assistant. Produce a structured briefing. Sources must be real, well-known publications, organisations or reference works the user can look up; describe what to look for rather than inventing URLs. Plain text, no markdown.",
      input: `Topic: ${data.topic}\nDepth: ${data.depth}`,
      schema: {
        name: "research",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            keyPoints: { type: "array", items: { type: "string" } },
            notes: { type: "string" },
            outline: { type: "array", items: { type: "string" } },
            keywords: { type: "array", items: { type: "string" } },
            sources: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: { title: { type: "string" }, note: { type: "string" } },
                required: ["title", "note"],
              },
            },
          },
          required: ["summary", "keyPoints", "notes", "outline", "keywords", "sources"],
        },
      },
    });
    return JSON.parse(raw) as ResearchResult;
  });

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        context: S(8000),
        messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: S(6000) })).min(1).max(30),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { callAI } = await import("./ai.server");
    const text = await callAI({
      instructions: `You are the SmartWork AI assistant inside a productivity workspace with an Email Generator, Task Planner and Research Assistant. Be concise and practical. Plain text, short paragraphs or '- ' bullets, no markdown headings. Here is a snapshot of the user's workspace:\n${data.context}`,
      input: data.messages,
    });
    return { text };
  });
