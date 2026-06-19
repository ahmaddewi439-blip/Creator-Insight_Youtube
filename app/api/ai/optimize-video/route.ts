import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { video } = body;

    const apiKey = process.env.AI_API_KEYS;
    let baseUrl = process.env.AI_BASE_URL || "https://lite.koboillm.com/v1";
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) {
      return NextResponse.json({ error: "API Key belum diatur." }, { status: 400 });
    }

    baseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    const originalTitle = video?.snippet?.title || video?.title || "Video Tanpa Judul";
    const originalDesc = video?.snippet?.description || "";

  const prompt = `You are an elite YouTube SEO Expert and Viral Content Strategist. 
Analyze the following video content and provide highly optimized, high-CTR recommendations.

LANGUAGE INSTRUCTION: 
Detect the language of the video title and description provided below. 
You MUST respond in the SAME LANGUAGE as the input video.

Berikan output dengan aturan ketat berikut dalam format JSON:
1. "recommendedTitles": [5 viral & clickbait-style titles, under 60 characters, use emojis].
2. "description": "SEO-friendly description. First 3 lines must contain a powerful hook. Include a brief summary, CTA to subscribe, and relevant keywords."
3. "keywords": [15-20 trending tags/hashtags related to the video topic].
4. "caption": "Short 3-sentence caption for quick sharing."

Respond ONLY with a valid JSON object. DO NOT wrap in markdown.
Video yang dianalisis:
Judul: "${originalTitle}"
Deskripsi: "${originalDesc.substring(0, 500)}"`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || JSON.stringify(data));
    
    let textResponse = data.choices[0].message.content.trim();
    
    // Pembersih JSON Anti-Error
    const bt = "\x60\x60\x60";
    if (textResponse.startsWith(bt + "json")) textResponse = textResponse.slice(7);
    else if (textResponse.startsWith(bt + "JSON")) textResponse = textResponse.slice(7);
    else if (textResponse.startsWith(bt)) textResponse = textResponse.slice(3);
    if (textResponse.endsWith(bt)) textResponse = textResponse.slice(0, -3);
    textResponse = textResponse.trim();

    const result = JSON.parse(textResponse);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}