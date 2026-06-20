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

    // PROMPT BARU: FOKUS PADA SCENE-BY-SCENE FULL VIDEO PACK ALA VIRAL FACTORY
    const prompt = `You are an elite AI YouTube Strategist. Find low-competition, high-demand content opportunities.
Target Audience: ${audience || "Worldwide"}
Category: ${category || "Travel & Events"}
Style: ${style || "AI Cinematic Documentary"}
Topic: ${keyword || "Find a hidden opportunity"}

Analyze the market and return EXACTLY 3 highly profitable content ideas in Indonesian language (except for the English VO Script and AI Prompts). 
You MUST format the output as a valid JSON array of objects. Do NOT use markdown code blocks.

CRITICAL REQUIREMENT: The video must be a FULL 45-60 seconds. You must break it down into 5 to 7 specific Scenes. 
For EACH scene, provide the Voice Over, Visual Action, and highly detailed AI Prompts for Grok (both Image and Video).

Use this EXACT JSON structure for each of the 3 ideas:
[
  {
    "title": "Ide 1: [JUDUL CLICKBAIT HURUF KAPITAL]",
    "score": 34,
    "kenapa": "Penjelasan detail...",
    "angle": "Sudut pandang spesifik...",
    "keywords": [ {"word": "keyword 1", "power": 85} ],
    "scenes": [
      {
        "waktu": "[0:00-0:05]",
        "vo": "English Voice Over here...",
        "visual": "Description of what happens on screen...",
        "imagePrompt": "Grok Image Prompt: A vertical 9:16 highly detailed cinematic image of... premium dark green aesthetic, dramatic lighting.",
        "videoPrompt": "Grok Video Prompt: Smooth camera pan over... realistic motion, vertical 9:16 cinematic."
      }
    ],
    "description": "Draft deskripsi siap copy...",
    "tags": "#shorts, #mystery"
  }
]
Ensure the "scenes" array has enough objects to reach up to 60 seconds. Return ONLY raw JSON.`;

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