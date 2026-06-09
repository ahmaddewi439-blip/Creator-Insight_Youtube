import { callAIJson } from "@/lib/ai";
import { searchRecentRobloxVideos } from "@/lib/youtube";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body?.query || "Roblox update";
    const language = body?.language || "English";
    const apiKey = process.env.YOUTUBE_API_KEY;

    let sources: any[] = [];
    if (apiKey) {
      sources = await searchRecentRobloxVideos(query, apiKey, 10);
    }

    const system = `You are a Roblox Shorts trend researcher. You filter topics, score video potential, and suggest gameplay direction. Return valid JSON only.`;
    const user = `Create 3-5 updated Roblox Shorts topic options from these recent YouTube search signals.

User query: ${query}
Language requested: ${language}
Recent source signals:
${JSON.stringify(sources, null, 2)}

Return JSON exactly:
{
  "topics": [
    {
      "id": "topic-1",
      "title": "topic title",
      "summary": "short summary",
      "whyTrending": "why this is likely interesting now",
      "viralScore": number,
      "potentialViews": "Low/Medium/High/Very High",
      "shortsFit": "why it works for 45-60s Shorts",
      "gameplayDirection": "specific Roblox gameplay to record for this topic",
      "recommendedGameTypes": ["event game", "obby", "avatar editor", "horror", "simulator"],
      "sources": [{"title":"source title", "url":"source url"}]
    }
  ]
}

Scoring criteria total 50 then convert to 100: Unique/Shocking, Relevance/Trend, Visualizability, Ease of Understanding, Engagement Potential.
Rules:
- Prioritize updated Roblox news, updates, events, limited/free items, viral games, avatar/marketplace changes, safety warnings.
- If sources are weak, be honest and create topic options based on available signals only.
- Include gameplay direction for every topic.
- The final Shorts must later use a very strong first 3 seconds and a strong CTA ending.
- Output language: ${language}.`;

    const result = await callAIJson([ { role: "system", content: system }, { role: "user", content: user } ], 0.65);
    return Response.json(result.parsed ? { ...result.parsed, sourceSignals: sources } : { raw: result.raw, sourceSignals: sources });
  } catch (err: any) {
    return Response.json({ error: err?.message || "Gagal mencari topik Roblox." }, { status: 500 });
  }
}
