import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { video, videoFormat, instruction } = body; 
    
    const originalTitle = video?.snippet?.title || video?.title || "Untitled";
    const originalDesc = video?.snippet?.description || video?.description || "";

    const systemPrompt = `You are an elite YouTube SEO Expert.
    ${instruction || `CRITICAL RULE: You MUST generate your response in the EXACT SAME LANGUAGE as the original video title. DO NOT translate.`}
    
    Original Title: "${originalTitle}"
    Original Description: "${originalDesc}"
    Format Target: ${videoFormat}
    
    Return a valid JSON object exactly matching this structure:
    {
      "score": {"Title": 85, "SEO": 90, "CTR": 88, "Retention": 80, "Overall": 85},
      "diagnosis": "Short analysis",
      "recommendedTitles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
      "caption": "Short caption with hashtag",
      "description": "Full description",
      "hashtags": ["#tag1", "#tag2"],
      "keywords": ["tag1", "tag2"],
      "pinnedComment": "Comment text",
      "cta": "Call to action",
      "thumbnailTexts": ["Text 1"],
      "actionPlan": ["Step 1"]
    }`;

    // AKAR MASALAH DIPECAHKAN: Sistem kini mencari Key dari SEMUA nama variabel yang paling umum digunakan
    const apiKey = process.env.OPENROUTER_API_KEY || 
                   process.env.OPENAI_API_KEY || 
                   process.env.AI_API_KEYS || 
                   process.env.AI_API_KEY || 
                   process.env.GEMINI_API_KEY || 
                   process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("API Key kosong. Masuk ke Vercel > Settings > Environment Variables, pastikan API Key Anda sudah dimasukkan.");
    }

    // Menggunakan URL bawaan Anda jika ada, jika tidak otomatis pakai OpenRouter
    const baseUrl = process.env.AI_BASE_URL || "https://openrouter.ai/api/v1/chat/completions";

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "openai/gpt-4o-mini", 
        messages: [{ role: "system", content: systemPrompt }],
        response_format: { type: "json_object" }
      })
    });

    const data = await res.json();

    // Deteksi Error dari Server AI
    if (!res.ok) {
      throw new Error(`AI Provider Error: ${data.error?.message || res.statusText}`);
    }

    if (!data.choices || !data.choices[0]) {
      throw new Error("Format respons AI tidak valid.");
    }

    const content = data.choices[0].message.content;
    return NextResponse.json({ result: JSON.parse(content) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}