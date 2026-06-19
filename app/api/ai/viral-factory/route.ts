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

    // 1. TARIK DATA REAL-TIME DARI YOUTUBE (Anti Data Palsu)
  // 1. TARIK DATA GLOBAL (Hapus parameter Indonesia, ganti ke hl=en untuk Global)
    const ytRes = await fetch(`http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=en&q=trending+roblox`);
    const ytData = await ytRes.json();
    const liveTrends = ytData[1] ? ytData[1].slice(0, 4).join(", ") : "Roblox trending, Roblox new game, Roblox update";

    // 2. PROMPT MASTER GLOBAL + GROK AI SYSTEM + ANTI MINECRAFT
    const prompt = `You are an Elite Global Viral Content Strategist for YouTube Shorts & TikTok.
Target Audience: GLOBAL (English).
Current Global YouTube Search Trends: "${liveTrends}".

Create 4 video concepts based on these actual trends. 
CRITICAL RULE: Focus ENTIRELY on ROBLOX. DO NOT mention, generate, or hint at anything related to Minecraft. The visual style must strictly look like Roblox avatars, environments, and physics.

DO NOT USE JSON. Provide clean text ready to be copy-pasted with the exact structure below for each video:

🔥 VIDEO [NUMBER]
Title: (Max 60 characters, highly engaging, clickbait, English)
Description: (Short, punchy, English, include a natural CTA)
Hashtags: (5 global trending Roblox hashtags)
Best Upload Time: (Suggest the best time to upload for a global audience, e.g., '14:00 EST / 18:00 GMT')

🎬 Grok AI Video Prompts (Vertical 9:16):
*Crucial Rule: Grok AI can ONLY generate 10-second videos per prompt. To make a full 40-60 second Short, you MUST provide 4 to 6 sequential 10-second scene prompts.*
- Prompt 1 (0s-10s): "Vertical 9:16 video. Roblox gameplay style. [Describe the initial 10-second hook/action]. Premium dark green aesthetic, cinematic lighting, high contrast, sharp focus."
- Prompt 2 (10s-20s): "Vertical 9:16 video. Roblox gameplay style. [Describe the next 10-second progression]. Premium dark green aesthetic, cinematic lighting, high contrast, sharp focus."
- Prompt 3 (20s-30s): "Vertical 9:16 video. Roblox gameplay style. [Describe the next 10-second action]. Premium dark green aesthetic, cinematic lighting, high contrast, sharp focus."
- Prompt 4 (30s-40s): "Vertical 9:16 video. Roblox gameplay style. [Describe the climax or continued action]. Premium dark green aesthetic, cinematic lighting, high contrast, sharp focus."
- Prompt 5 (40s-50s): "Vertical 9:16 video. Roblox gameplay style. [Describe the ending or loop setup]. Premium dark green aesthetic, cinematic lighting, high contrast, sharp focus."
- Prompt 6 (50s-60s): (Provide this if the story needs a final 10s resolution) "Vertical 9:16 video. Roblox gameplay style. [Describe the final call to action]. Premium dark green aesthetic, cinematic lighting, high contrast, sharp focus."

-----------------------------------
(Separate each video with the dashed line above)`;

    // 3. PROSES AI
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: aiModel, messages: [{ role: "user", content: prompt }] })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Gagal menghubungi AI");

    const textResponse = data.choices[0].message.content.trim();

    // Mengembalikan Teks Bersih ke Web Anda
    return NextResponse.json({ 
      success: true, 
      resultText: textResponse 
    });

  } catch (error: any) {
    console.error("Viral Factory Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}