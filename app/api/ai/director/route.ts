import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { topic, duration, language } = await req.json();

    const apiKey = process.env.AI_API_KEYS;
    let baseUrl = process.env.AI_BASE_URL || "[https://lite.koboillm.com/v1](https://lite.koboillm.com/v1)";
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) {
      return NextResponse.json({ error: "Variabel AI_API_KEYS belum terdeteksi di Vercel." }, { status: 400 });
    }

    baseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    const prompt = `You are an elite YouTube Director and Master Scriptwriter.
    Topic: "${topic}"
    Language: ${language} (Write the Voice Over COMPLETELY in this language. Target audience is international. Ensure native-level storytelling).
    Target Duration: ${duration}

    CRITICAL RULES:
    1. TRUE DURATION MATCH: Average speaking rate is 130 words per minute. For a 5-minute video, you MUST write at least 650-750 words. For 10 minutes, write 1300+ words. Do NOT summarize. Write massive, extensive, detailed paragraphs for the Voice Over ('vo') to genuinely fill the time.
    2. SLIDE-BY-SLIDE VISUALS: Provide a visual presentation style. For every single sentence or concept in the VO, provide a specific image prompt. Use the "visuals" array to list multiple images per scene with exact timestamps (e.g., 00:00 - 00:05, 00:05 - 00:12) that synchronize perfectly with the spoken VO.
    3. AESTHETIC: All image prompts MUST seamlessly incorporate a premium dark green gaming aesthetic, cinematic lighting, high contrast, and sharp focus.
    
    Output ONLY a valid JSON object. DO NOT wrap the output in markdown code blocks. Just the raw JSON format:
    {
      "videoTitle": "Catchy Clickbait Title",
      "scenes": [
        {
          "scene": 1,
          "name": "Intro Hook",
          "time": "00:00 - 01:00",
          "vo": "Write massive paragraphs of voice over here. Hundreds of words to fill the duration...",
          "visuals": [
            {
              "time": "00:00 - 00:08",
              "prompt": "Detailed 16:9 image prompt matching the exact first sentence. Premium dark green gaming style, cinematic lighting..."
            },
            {
              "time": "00:08 - 00:15",
              "prompt": "Next detailed 16:9 image prompt matching the next sentence..."
            }
          ],
          "editingDirection": "Professional editing style"
        }
      ]
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
    
    // PEMBERSIH SUPER AMAN: Tanpa Regex, 100% Anti Error Vercel
    if (textResponse.startsWith("```json")) {
        textResponse = textResponse.slice(7);
    } else if (textResponse.startsWith("```JSON")) {
        textResponse = textResponse.slice(7);
    } else if (textResponse.startsWith("```")) {
        textResponse = textResponse.slice(3);
    }
    
    if (textResponse.endsWith("```")) {
        textResponse = textResponse.slice(0, -3);
    }
    
    textResponse = textResponse.trim();

    const scriptData = JSON.parse(textResponse);
    return NextResponse.json({ success: true, result: scriptData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}