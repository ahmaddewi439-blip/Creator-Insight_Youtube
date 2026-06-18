import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { topic, duration, language } = await req.json();

    const apiKey = process.env.AI_API_KEYS;
    // Mengamankan Base URL untuk Koboi LLM (biasanya butuh /v1)
    let baseUrl = process.env.AI_BASE_URL || "https://lite.koboillm.com/v1";
    // Default model disesuaikan dengan dashboard Anda
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) {
      return NextResponse.json({ error: "Variabel AI_API_KEYS belum terdeteksi di Vercel." }, { status: 400 });
    }

    // Merapikan URL endpoint agar pasti valid
    baseUrl = baseUrl.replace(/\/+$/, ""); // Hilangkan slash berlebih di akhir
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    const prompt = `You are an elite YouTube Director and Master Scriptwriter.
    Your task is to write a FULL, EXTENSIVE video script.
    Topic: "${topic}"
    Language: ${language}
    Target Duration: ${duration}

    CRITICAL RULES:
    1. NO PLACEHOLDERS. NO SHORT SUMMARIES.
    2. To fulfill a ${duration} video, the 'vo' (Voice Over) for EACH scene MUST contain massive, detailed paragraphs. Write exactly what the narrator will say word-for-word. Explain facts, build tension, and provide deep analysis.
    3. Aim for hundreds of words per scene to match the long duration.

    Output ONLY a valid JSON object. DO NOT wrap the output in markdown code blocks (\`\`\`json). Just the raw JSON format:
    {
      "videoTitle": "Catchy Clickbait Title",
      "scenes": [
        {
          "scene": 1,
          "name": "Intro Hook",
          "time": "00:00 - 02:00",
          "vo": "Write massive paragraphs of voice over here...",
          "visualPrompt": "Detailed cinematic 16:9 image prompt",
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
        // Kita hilangkan response_format strict agar Gemini via Koboi tidak error
      })
    });

    const data = await res.json();
    
    if (!res.ok) {
       throw new Error(data.error?.message || JSON.stringify(data));
    }
    
    let textResponse = data.choices[0].message.content;
    
    // PEMBERSIH SUPER: Membersihkan markdown jika AI bandel mengembalikan ```json
    textResponse = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();

    const scriptData = JSON.parse(textResponse);

    return NextResponse.json({ success: true, result: scriptData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}