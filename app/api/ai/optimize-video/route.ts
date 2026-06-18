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
    I have a video currently titled: "${originalTitle}"
    Description: "${originalDesc.substring(0, 500)}"

    TASK: Optimize this video for MAXIMUM YouTube Algorithm reach, high Click-Through-Rate (CTR), and top search ranking.
    Language: Indonesian (Gunakan gaya bahasa yang natural, asik, clickbait namun tidak berbohong, cocok untuk audiens Indonesia).

    REQUIREMENTS:
    1. recommendedTitles: Provide 3 highly engaging, clickbait (but accurate) titles. Keep them under 70 characters for best visibility. Use emojis strategically.
    2. description: Write a full SEO-optimized description. First 2 lines must hook the viewer. Include a brief summary, CTA to subscribe, and relevant keywords naturally woven in.
    3. keywords: Provide an array of 15-20 highly searched tags/keywords related to the topic.
    4. caption: A short 2-sentence version of the description for quick sharing.

    Respond ONLY with a valid JSON object. DO NOT wrap in markdown.
    {
      "recommendedTitles": ["Judul Viral 1", "Judul Viral 2", "Judul Viral 3"],
      "description": "Full SEO description here...",
      "keywords": ["tag1", "tag2", "tag3"],
      "caption": "Short hook caption..."
    }`;

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