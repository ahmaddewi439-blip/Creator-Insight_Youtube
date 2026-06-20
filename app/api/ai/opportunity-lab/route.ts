import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Menangkap parameter bahasa dari web Anda
    const { category, audience, style, keyword, language } = body; 
    
    const apiKey = process.env.AI_API_KEYS;
    let baseUrl = process.env.AI_BASE_URL || "https://lite.koboillm.com/v1";
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) return NextResponse.json({ error: "API Key belum diatur." }, { status: 400 });
    baseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    // PROMPT BARU: MULTI-BAHASA & PERHITUNGAN DURASI KATA YANG SANGAT KETAT
    const prompt = `You are an elite AI YouTube Strategist. Find the BEST, low-competition, high-demand content opportunities.
Category: ${category}
Target Audience: ${audience || "Worldwide"}
Target Content Language: ${language || "English"}

CRITICAL LANGUAGE RULES: 
1. The "title", "vo" (Voice Over), "description", and "tags" MUST be written completely in ${language || "English"}.
2. "kenapa", "angle", and "audioMood" MUST be in strict Indonesian.
3. All "imagePrompt", "videoPrompt", and "thumbnailPrompt" MUST be in English.

CRITICAL PACING & TIMING RULES (MUST OBEY):
Assuming a normal speaking rate of 2.5 words per second. You MUST match the word count of the "vo" to the timestamp duration perfectly! 
- A 5-second scene MUST contain exactly 12 to 15 words in the "vo".
- A 10-second scene MUST contain exactly 22 to 25 words in the "vo".
Do NOT write short sentences for long timestamps. Fill the time block completely! The total script must be around 130-150 words for a 60-second Shorts.

Analyze the market and return EXACTLY 3 highly profitable content ideas (Score 32-35).
Format the output as a valid JSON array of objects. Do NOT use markdown code blocks. Keep the JSON keys exactly as shown.

Use this EXACT JSON structure:
[
  {
    "title": "Ide 1: [CLICKBAIT TITLE IN ${language || "English"}]",
    "score": 34,
    "kenapa": "Penjelasan rinci dalam BAHASA INDONESIA mengapa demand tinggi...",
    "angle": "Sudut pandang spesifik dalam BAHASA INDONESIA...",
    "keywords": [ {"word": "keyword 1", "power": 85} ],
    "thumbnailPrompt": "Grok Image Prompt: A YouTube Shorts thumbnail...",
    "audioMood": "Instruksi BAHASA INDONESIA untuk musik latar...",
    "scenes": [
      {
        "waktu": "[0:00-0:05]",
        "vo": "[Strictly 12-15 words in ${language || "English"}]...",
        "visual": "Description of visual action...",
        "imagePrompt": "Grok Image Prompt: A vertical 9:16 highly detailed...",
        "videoPrompt": "Grok Video Prompt: Smooth camera pan over..."
      }
    ],
    "description": "Draft description in ${language || "English"}...",
    "tags": "#shorts, #tagsin${language || "English"}"
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