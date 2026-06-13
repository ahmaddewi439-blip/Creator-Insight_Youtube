import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Menangkap instruksi paksaan bahasa dari UI
    const { video, videoFormat, instruction } = body; 
    
    const originalTitle = video?.snippet?.title || video?.title || "Untitled";
    const originalDesc = video?.snippet?.description || video?.description || "";

    // MENGGABUNGKAN INSTRUKSI MUTLAK KE OTAK AI
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

    // MENGGUNAKAN JALUR OPENROUTER API KEY YANG BENAR
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.AI_API_KEYS || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // Model JSON paling stabil
        messages: [{ role: "system", content: systemPrompt }],
        response_format: { type: "json_object" }
      })
    });

    const data = await res.json();

    // PENGAMAN ERROR
    if (data.error) {
      throw new Error("OpenRouter Error: " + data.error.message);
    }
    if (!data.choices || !data.choices[0]) {
      throw new Error("Gagal mendapat respon. Pastikan API Key OpenRouter Anda aktif di setting Vercel.");
    }

    const content = data.choices[0].message.content;
    return NextResponse.json({ result: JSON.parse(content) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}