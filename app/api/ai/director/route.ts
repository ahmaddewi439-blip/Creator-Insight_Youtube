import { NextResponse } from "next/server";

// Wajib: Beri Vercel waktu hingga 60 detik karena AI butuh waktu merangkai ribuan kata
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { topic, duration, language } = await req.json();

    // Otomatis mendeteksi kunci API yang Anda miliki di Vercel
    const openAiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!openAiKey && !geminiKey) {
      return NextResponse.json({ error: "Kunci API (OpenAI / OpenRouter / Gemini) belum dipasang di Vercel." }, { status: 400 });
    }

    const prompt = `You are an elite YouTube Director and Master Scriptwriter.
    Your task is to write a FULL, EXTENSIVE video script.
    Topic: "${topic}"
    Language: ${language}
    Target Duration: ${duration}

    CRITICAL RULES:
    1. NO PLACEHOLDERS. NO SHORT SUMMARIES.
    2. To fulfill a ${duration} video, the 'vo' (Voice Over) for EACH scene MUST contain massive, detailed paragraphs. Write exactly what the narrator will say word-for-word. Explain facts, build tension, and provide deep analysis.
    3. Aim for hundreds of words per scene to match the long duration.

    Output ONLY valid JSON:
    {
      "videoTitle": "Catchy Clickbait Title",
      "scenes": [
        {
          "scene": 1,
          "time": "00:00 - 02:00",
          "vo": "Write massive paragraphs of voice over here. Do not stop at one sentence. Keep writing detailed facts and engaging story...",
          "visualPrompt": "Detailed cinematic 16:9 image prompt",
          "editingDirection": "Professional editing style"
        }
      ]
    }`;

    let scriptData = null;

    // Logika Eksekusi AI Otentik
    if (geminiKey && !openAiKey) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(JSON.stringify(data));
      let text = data.candidates[0].content.parts[0].text;
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      scriptData = JSON.parse(text);
    } else {
      const endpoint = process.env.OPENROUTER_API_KEY 
        ? "https://openrouter.ai/api/v1/chat/completions" 
        : "https://api.openai.com/v1/chat/completions";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openAiKey}` },
        body: JSON.stringify({
          model: process.env.OPENROUTER_API_KEY ? "openai/gpt-4o-mini" : "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(JSON.stringify(data));
      scriptData = JSON.parse(data.choices[0].message.content);
    }

    return NextResponse.json({ success: true, result: scriptData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}