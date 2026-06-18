import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { topic, duration, language } = await req.json();

    const apiKey = process.env.AI_API_KEYS;
    let baseUrl = process.env.AI_BASE_URL || "https://lite.koboillm.com/v1";
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) {
      return NextResponse.json({ error: "Variabel AI_API_KEYS belum terdeteksi di Vercel." }, { status: 400 });
    }

    baseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    const prompt = `You are an elite YouTube Director specializing in "High-Retention Micro-Pacing" (like top-tier viral Shorts and fast-paced documentaries).
    Topic: "${topic}"
    Language: ${language} (Write the Voice Over COMPLETELY in this language. Ensure native-level, engaging storytelling).
    Target Total Duration: ${duration}

    CRITICAL RULES:
    1. HYPER-SYNCED SLIDE-BY-SLIDE: The visuals MUST perfectly sync with the Voice Over (VO) concept by concept. Change the visual every 3 to 6 seconds to keep the viewer hooked.
    2. EXACT TIMESTAMPS & OVERLAYS: For EVERY single visual, you must provide exact timestamps (e.g., "00:00 - 00:03") AND explicit instructions for on-screen text/overlays.
    3. NATURAL PACING: Write the VO naturally. Do not force word counts, just ensure the spoken words comfortably fit the duration of the scene at a natural human speaking pace.
    4. AESTHETIC: All image prompts MUST seamlessly incorporate a premium dark green gaming aesthetic, cinematic lighting, high contrast, and sharp focus.
    
    Output ONLY a valid JSON object. DO NOT wrap the output in markdown. Just the raw JSON format:
    {
      "videoTitle": "Catchy Clickbait Title",
      "scenes": [
        {
          "scene": 1,
          "name": "Intro Hook",
          "time": "00:00 - 00:15",
          "vo": "Write the natural voice over here. Focus on flow so it takes exactly 15 seconds to read aloud...",
          "visuals": [
            {
              "time": "00:00 - 00:04",
              "prompt": "Detailed 16:9 image prompt matching the exact first sentence. Premium dark green gaming style...",
              "overlay": "+ Overlay Teks: 'KATA KUNCI 1' (Tampil dari 00:00 - 00:04)"
            },
            {
              "time": "00:04 - 00:08",
              "prompt": "Next detailed 16:9 image prompt matching the next sentence...",
              "overlay": "+ Overlay Teks: 'KATA KUNCI 2' (Tampil dari 00:04 - 00:08)"
            }
          ],
          "editingDirection": "Fast zoom, pop-up text animation, add whoosh sound effect."
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
    
    if (textResponse.startsWith("```json")) {
        textResponse = textResponse.slice(7);
    } else if (textResponse.startsWith("
```JSON")) {
        textResponse = textResponse.slice(7);
    } else if (textResponse.startsWith("```")) {
        textResponse = textResponse.slice(3);
    }
    
    if (textResponse.endsWith("
```")) {
        textResponse = textResponse.slice(0, -3);
    }
    
    textResponse = textResponse.trim();

    const scriptData = JSON.parse(textResponse);
    return NextResponse.json({ success: true, result: scriptData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}