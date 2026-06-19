import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.AI_API_KEYS;
    let baseUrl = process.env.AI_BASE_URL || "https://lite.koboillm.com/v1";
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) return NextResponse.json({ error: "API Key belum diatur." }, { status: 400 });
    baseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    const prompt = `You are an Elite Global Viral News Scraper and Content Strategist for YouTube Shorts.
Your task is to analyze the ABSOLUTE LATEST, breaking Roblox global trends happening RIGHT NOW (e.g., massive new game releases, huge updates, community drama, or viral glitches). DO NOT use generic topics.

Create 4 distinct video concepts based heavily on these real, current news/trends.
Focus ENTIRELY on Roblox. No Minecraft.

You MUST output valid JSON containing an array of exactly 4 objects. 
JSON Structure:
[
  {
    "videoNumber": 1,
    "title": "MUST BE ENGAGING AND RELATED TO REAL NEWS (Max 60 chars)",
    "description": "Short, punchy explanation of the news/trend.",
    "hashtags": "#RobloxNews #RobloxTrend #SpecificGameName",
    "uploadTime": "Recommend best global time (EST/GMT)",
    "prompts": [
      "Write 4 to 6 highly dynamic scene descriptions based on the specific news. EACH string MUST end strictly with: 'Vertical 9:16 video. Roblox gameplay style. Premium dark green aesthetic, cinematic lighting, high contrast, sharp focus.'"
    ]
  }
]
Return ONLY raw JSON. No markdown, no introduction.`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: aiModel, messages: [{ role: "user", content: prompt }] })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Gagal menghubungi AI");

    let textResponse = data.choices[0].message.content.trim();
    if (textResponse.startsWith("```json")) textResponse = textResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    else if (textResponse.startsWith("```")) textResponse = textResponse.replace(/^```\s*/, "").replace(/\s*```$/, "");

    const videosArray = JSON.parse(textResponse);

    // Mengirim data array terpisah agar Frontend bisa membuat 4 tombol copy
    return NextResponse.json({ success: true, videos: videosArray });

  } catch (error: any) {
    console.error("Viral Factory Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}