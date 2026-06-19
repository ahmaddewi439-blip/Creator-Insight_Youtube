import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, audience, style, keyword } = body;
    
    const apiKey = process.env.AI_API_KEYS;
    let baseUrl = process.env.AI_BASE_URL || "https://lite.koboillm.com/v1";
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) return NextResponse.json({ error: "API Key belum diatur." }, { status: 400 });
    baseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    // PROMPT MASTER: GAYA VIDIQ + RISET CONTENT GAP
    const prompt = `You are an elite AI YouTube Strategist. Find low-competition, high-demand content opportunities.
Target Audience: ${audience || "Worldwide"}
Category: ${category || "Gaming / Roblox"}
Style: ${style || "Fast-paced Shorts"}
Topic: ${keyword || "Find a hidden opportunity"}

Analyze the market and return EXACTLY 3 highly profitable content ideas in Indonesian language (except for the English VO Script). 
You MUST format the output as a valid JSON array of objects. Do NOT use markdown code blocks.

Use this EXACT JSON structure for each of the 3 ideas:
[
  {
    "title": "Ide 1: [JUDUL CLICKBAIT HURUF KAPITAL]",
    "score": 33,
    "kenapa": "Penjelasan detail kenapa topik ini berpeluang tinggi (sebutkan demand tinggi, kompetisi rendah/format usang).",
    "angle": "Sudut pandang spesifik yang membedakan video ini dari kompetitor.",
    "keywords": [
      {"word": "keyword terkait 1", "power": 85},
      {"word": "keyword terkait 2", "power": 72}
    ],
    "visualStructure": [
      {"layer": "Background", "posisi": "Layar Penuh 9:16", "konten": "Deskripsi visual AI. Prompt: [Grok AI Prompt for the scene, premium dark green aesthetic]"},
      {"layer": "Text Overlay", "posisi": "Tengah", "konten": "Teks hook kapital"}
    ],
    "script": [
      {"time": "[0:00-0:05] HOOK", "vo": "English Voice Over hook here...", "visual": "Visual: Fast zoom in. SFX: Boom sound."},
      {"time": "[0:05-0:15] STORY", "vo": "English Voice Over continuing the story...", "visual": "Visual: Quick cuts. SFX: Mysterious ambient."}
    ],
    "description": "Ranking momen-momen paling gila... [Draft deskripsi siap copy]",
    "tags": "#shorts, #roblox, #mystery, #gaming",
    "quickNotes": [
      "Gunakan musik background tipe suspense.",
      "Pastikan suara VO berat dan misterius."
    ]
  }
]
Return ONLY raw JSON.`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: aiModel, messages: [{ role: "user", content: prompt }] })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Gagal menghubungi AI");

    let textResponse = data.choices[0].message.content.trim();
    if (textResponse.startsWith("```")) {
       textResponse = textResponse.replace(/^```[a-z]*\s*/, "").replace(/\s*```$/, "");
    }

    const ideasArray = JSON.parse(textResponse);
    return NextResponse.json({ success: true, results: ideasArray });

  } catch (error: any) {
    console.error("Opportunity Lab Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}