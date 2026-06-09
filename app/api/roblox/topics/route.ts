import { callAIJson } from "@/lib/ai";
import { searchRecentRobloxVideos } from "@/lib/youtube";

export const runtime = "nodejs";

type TopicOption = {
  id: string;
  title: string;
  summary: string;
  whyTrending: string;
  viralScore: number;
  potentialViews: string;
  shortsFit: string;
  gameplayDirection: string;
  recommendedGameTypes: string[];
  sources: { title: string; url: string }[];
};

function fallbackTopics(query: string, language: string, sources: any[]): TopicOption[] {
  const isIndo = String(language).toLowerCase().includes("indo");
  const sourceList = sources.slice(0, 3).map((s: any) => ({
    title: s?.title || "Roblox source signal",
    url: s?.url || ""
  }));

  if (isIndo) {
    return [
      {
        id: "topic-1",
        title: `Update Roblox terbaru: ${query}`,
        summary: "Bahas update Roblox yang sedang dicari dan jelaskan dampaknya untuk player.",
        whyTrending: "Topik update Roblox biasanya menarik karena player ingin cepat tahu fitur, event, item, atau perubahan terbaru.",
        viralScore: 82,
        potentialViews: "High",
        shortsFit: "Cocok untuk Shorts karena bisa dibuka dengan hook kuat, dijelaskan cepat, lalu ditutup dengan pertanyaan ke penonton.",
        gameplayDirection: "Rekam avatar Roblox berjalan di lobby/event, membuka menu avatar/marketplace, lalu gunakan zoom cepat saat menjelaskan poin update.",
        recommendedGameTypes: ["event game", "avatar editor", "obby", "city roleplay"],
        sources: sourceList
      },
      {
        id: "topic-2",
        title: "Item atau event Roblox yang mungkin ramai dicari player",
        summary: "Ambil angle free item, limited item, reward event, atau item yang sulit didapat.",
        whyTrending: "Konten item Roblox sering mendorong komentar karena penonton ingin tahu cara mendapatkan dan apakah itemnya worth it.",
        viralScore: 86,
        potentialViews: "High",
        shortsFit: "Mudah divisualkan dengan inventory, avatar showcase, efek highlight item, dan countdown.",
        gameplayDirection: "Rekam avatar masuk area event, mencari reward, membuka inventory, dan memakai item di avatar editor.",
        recommendedGameTypes: ["event game", "avatar showcase", "UGC item showcase"],
        sources: sourceList
      },
      {
        id: "topic-3",
        title: "Game Roblox viral yang bisa jadi bahan Shorts",
        summary: "Bahas game Roblox yang sedang ramai dan kenapa player mulai membicarakannya.",
        whyTrending: "Game viral mudah menarik viewers karena ada rasa penasaran, challenge, atau momen lucu/menegangkan.",
        viralScore: 79,
        potentialViews: "Medium-High",
        shortsFit: "Bisa memakai hook dari momen gameplay paling seru, lalu jelaskan singkat kenapa game ini ramai.",
        gameplayDirection: "Mainkan game yang relevan, ambil clip berlari, hampir gagal, dikejar, menang, atau menemukan hal unik.",
        recommendedGameTypes: ["horror", "survival", "obby", "simulator", "challenge"],
        sources: sourceList
      }
    ];
  }

  return [
    {
      id: "topic-1",
      title: `Latest Roblox update: ${query}`,
      summary: "Cover a Roblox update and explain why players should care.",
      whyTrending: "Roblox updates often perform well because players want fast explanations about new features, events, items, or rule changes.",
      viralScore: 82,
      potentialViews: "High",
      shortsFit: "Works well for Shorts with a strong hook, fast context, one main fact, a twist, and a comment CTA.",
      gameplayDirection: "Record your avatar walking through a Roblox lobby/event, opening avatar or marketplace menus, and use fast zooms during the update reveal.",
      recommendedGameTypes: ["event game", "avatar editor", "obby", "city roleplay"],
      sources: sourceList
    },
    {
      id: "topic-2",
      title: "Roblox item or event players might be searching for",
      summary: "Use a free item, limited item, reward event, or hard-to-get item angle.",
      whyTrending: "Roblox item content often drives comments because viewers want to know how to get it and whether it is worth it.",
      viralScore: 86,
      potentialViews: "High",
      shortsFit: "Very visual: inventory, avatar showcase, item highlight effects, and countdown overlays.",
      gameplayDirection: "Record your avatar entering the event area, walking toward a reward, opening inventory, and wearing the item in avatar editor.",
      recommendedGameTypes: ["event game", "avatar showcase", "UGC item showcase"],
      sources: sourceList
    },
    {
      id: "topic-3",
      title: "Viral Roblox game worth turning into a Short",
      summary: "Cover a Roblox game gaining attention and explain why players are talking about it.",
      whyTrending: "Viral Roblox games are easy to package with curiosity, challenge, funny moments, or suspense.",
      viralScore: 79,
      potentialViews: "Medium-High",
      shortsFit: "You can open with the most exciting gameplay moment, then quickly explain why the game is popular.",
      gameplayDirection: "Play the relevant game and capture clips of running, almost failing, being chased, winning, or discovering something strange.",
      recommendedGameTypes: ["horror", "survival", "obby", "simulator", "challenge"],
      sources: sourceList
    }
  ];
}

export async function GET() {
  return Response.json({
    ok: true,
    endpoint: "/api/roblox/topics",
    method: "POST",
    message: "Roblox topic route is active. Use POST with { query, language }."
  });
}

export async function POST(request: Request) {
  let query = "Roblox update";
  let language = "English";
  let sources: any[] = [];

  try {
    const body = await request.json().catch(() => ({}));
    query = body?.query || "Roblox update";
    language = body?.language || "English";

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey) {
      sources = await searchRecentRobloxVideos(query, apiKey, 10);
    }

    const system = "You are a Roblox Shorts trend researcher. You filter topics, score video potential, and suggest gameplay direction. Return valid JSON only.";
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

    const result = await callAIJson([{ role: "system", content: system }, { role: "user", content: user }], 0.65);

    if (result.parsed) {
      return Response.json({ ...result.parsed, sourceSignals: sources });
    }

    return Response.json({
      topics: fallbackTopics(query, language, sources),
      sourceSignals: sources,
      fallback: true,
      warning: "AI response was not valid JSON, so fallback topics were returned.",
      raw: result.raw
    });
  } catch (err: any) {
    return Response.json({
      topics: fallbackTopics(query, language, sources),
      sourceSignals: sources,
      fallback: true,
      warning: err?.message || "Gagal mencari topik Roblox, fallback topics returned."
    });
  }
}
