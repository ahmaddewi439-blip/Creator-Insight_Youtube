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

    // PROMPT BARU: PENGUNCI BAHASA INDONESIA & TAMBAHAN RESEP THUMBNAIL/AUDIO
    const prompt = `You are an elite AI YouTube Strategist. Find the BEST, low-competition, high-demand content opportunities.
Target Audience: ${audience || "Worldwide"}
Category: ${category}
Style: ${style || "AI Cinematic Documentary"}

Analyze the market and return EXACTLY 3 highly profitable content ideas for "${category}". 
CRITICAL LANGUAGE RULES: 
- "kenapa", "angle", "audioMood" MUST be in strict Indonesian.
- The "vo" (Voice Over) and all Prompts (Image, Video, Thumbnail) MUST be in English.

Only provide ideas with a Very High Opportunity Score (32 to 35).
Format the output as a valid JSON array of objects. Do NOT use markdown code blocks.

Use this EXACT JSON structure:
[
  {
    "title": "Ide 1: [JUDUL CLICKBAIT HURUF KAPITAL]",
    "score": 34,
    "kenapa": "Penjelasan rinci dalam BAHASA INDONESIA mengapa demand tinggi dan kompetisi rendah...",
    "angle": "Sudut pandang spesifik dalam BAHASA INDONESIA...",
    "keywords": [ {"word": "keyword 1", "power": 85} ],
    "thumbnailPrompt": "Grok Image Prompt: A YouTube Shorts thumbnail showing... premium dark green aesthetic, high contrast, highly clickable.",
    "audioMood": "Instruksi BAHASA INDONESIA untuk musik latar dan SFX (contoh: Gunakan musik dark synthwave yang pelan, tambahkan efek detak jantung...).",
    "scenes": [
      {
        "waktu": "[0:00-0:05]",
        "vo": "English Voice Over here...",
        "visual": "Description of visual action...",
        "imagePrompt": "Grok Image Prompt: A vertical 9:16 highly detailed...",
        "videoPrompt": "Grok Video Prompt: Smooth camera pan over..."
      }
    ],
    "description": "Draft deskripsi siap copy...",
    "tags": "#shorts, #mystery"
  }
]
Ensure the scenes cover 45-60 seconds. Return ONLY raw JSON.`;

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