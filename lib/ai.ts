import { safeJsonParse } from "@/lib/utils";

export type AIMessage = { role: "system" | "user" | "assistant"; content: string };

export async function callAI(messages: AIMessage[], temperature = 0.75) {
  const baseUrl = (process.env.AI_BASE_URL || "https://lite.koboillm.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "openai/gpt-4o-mini";
  const keys = (process.env.AI_API_KEYS || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

  if (!keys.length) {
    throw new Error("AI_API_KEYS belum diisi di Vercel Environment Variables.");
  }

  let lastError = "AI request failed.";

  for (const key of keys) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          response_format: { type: "json_object" }
        })
      });

      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

      if (!res.ok) {
        lastError = data?.error?.message || data?.message || text || `AI error ${res.status}`;
        continue;
      }

      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        lastError = "AI tidak mengembalikan content.";
        continue;
      }

      return content;
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  throw new Error(lastError);
}

export async function callAIJson<T = any>(messages: AIMessage[], temperature = 0.75): Promise<{ parsed: T | null; raw: string }> {
  const raw = await callAI(messages, temperature);
  const parsed = safeJsonParse<T>(raw);
  return { parsed, raw };
}
