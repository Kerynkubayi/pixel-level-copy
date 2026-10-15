// Server-only: calls Lovable AI Gateway (Responses API) with streaming and returns final text.
const MODEL = "openai/gpt-6-astra";

export type JsonSchema = { name: string; schema: Record<string, unknown> };

export class AIError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function callAI(opts: {
  instructions: string;
  input: string | { role: "user" | "assistant"; content: string }[];
  schema?: JsonSchema;
}): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AIError("AI is not configured.", 500);

  const body: Record<string, unknown> = {
    model: MODEL,
    instructions: opts.instructions,
    input: opts.input,
    stream: true,
    store: false,
    reasoning: { effort: "low" },
  };
  if (opts.schema) {
    body.text = { format: { type: "json_schema", name: opts.schema.name, strict: true, schema: opts.schema.schema } };
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      Authorization: `Bearer ${key}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    let msg = `AI request failed (${res.status}).`;
    try {
      const j = (await res.json()) as { error?: { message?: string }; message?: string };
      msg = j.error?.message || j.message || msg;
    } catch {
      /* ignore */
    }
    if (res.status === 429) msg = "Too many requests right now. Please wait a moment and try again.";
    if (res.status === 402) msg = "AI credits have run out. Add credits in your workspace to continue.";
    throw new AIError(msg, res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const evt = JSON.parse(data) as { type?: string; delta?: string; response?: { error?: { message?: string } }; message?: string };
        if (evt.type === "response.output_text.delta" && evt.delta) text += evt.delta;
        if (evt.type === "response.failed" || evt.type === "error") {
          throw new AIError(evt.response?.error?.message || evt.message || "AI request failed.", 502);
        }
      } catch (e) {
        if (e instanceof AIError) throw e;
      }
    }
  }
  if (!text.trim()) throw new AIError("The AI returned an empty response.", 502);
  return text;
}
