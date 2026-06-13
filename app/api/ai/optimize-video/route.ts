import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { video, videoFormat } = body;
    
    const originalTitle = video?.snippet?.title || video?.title || "";
    const originalDesc = video?.snippet?.description || video?.description || "";

    // INSTRUKSI MUTLAK DI LEVEL SERVER
    const systemPrompt = `You are an elite YouTube SEO Expert.
    CRITICAL RULE: You MUST generate your response in the EXACT SAME LANGUAGE as the original video title.
    - If the original title "${originalTitle}" is in ENGLISH, your entire JSON response MUST be in ENGLISH.
    - If it is in INDONESIAN, your response MUST be in INDONESIAN.
    - DO NOT translate. DO NOT mix languages.
    
    Original Title: "${originalTitle}"
    Original Description: "${originalDesc}"
    Format Target: ${videoFormat}
    
    Return a valid JSON object with the following keys:
    {
      "score": {"Title": 85, "SEO": 90, "CTR": 88, "Retention": 80, "Overall": 85},
      "diagnosis": "Short analysis of the current metadata",
      "recommendedTitles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
      "caption": "Short caption with hashtag",
      "description": "Full organic description",
      "hashtags": ["#tag1", "#tag2"],
      "keywords": ["tag1", "tag2"],
      "pinnedComment": "Comment text",
      "cta": "Call to action",
      "thumbnailTexts": ["Text 1"],
      "actionPlan": ["Step 1"]
    }`;

    const res = await fetch(process.env.AI_BASE_URL || "https://lite.koboillm.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AI_API_KEYS}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "openai/gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }],
        response_format: { type: "json_object" }
      })
    });

    const data = await res.json();
    const content = data.choices[0].message.content;
    return NextResponse.json({ result: JSON.parse(content) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}