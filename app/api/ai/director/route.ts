import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  // 1. Tangkap kunci dari Frontend
  const userAiKey = req.headers.get('x-user-ai-key');
  
  // 2. Gembok Anti-Jebol (Jika admin, pakai AI_API_KEYS)
  const apiKey = userAiKey ? userAiKey : process.env.AI_API_KEYS;

  try {
    const { topic, duration, language } = await req.json();
    
    // BARIS 14 YANG LAMA SUDAH DIHAPUS DARI SINI!
    
    let baseUrl = process.env.AI_BASE_URL || "https://lite.koboillm.com/v1";
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) return NextResponse.json({ error: "API Key belum diatur." }, { status: 400 });
    baseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    // PROMPT MASTER: AI Mengarang Dinamis, Sinkronisasi Visual, & Akurasi Durasi Matematis
    const prompt = `You are an Elite Video Director and Master Storyteller.
Your task is to creatively write a highly engaging Voice Over (VO) and break it down into perfectly synchronized 'Slide-by-Slide' visual prompts.

Topic / News Source: "${topic}"
Target Language: ${language}
Exact Target Duration: ${duration} minutes

CRITICAL INSTRUCTIONS:
1. DYNAMIC CREATIVE WRITING: Do not use generic templates. Analyze the provided topic/news source, and INVENT a captivating, storytelling-driven Voice Over.
2. EXACT TIMING MATHEMATICS (NO SHORTCUTS): 
   - 1 Minute of Voice Over = EXACTLY 130 to 140 words.
   - You MUST mathematically calculate your word count to match the ${duration} minutes target perfectly. (e.g., If 5 minutes, you MUST write exactly 650-700 words of VO). Do not finish the story early!
3. STRICT VISUAL SYNCHRONIZATION (SLIDE-BY-SLIDE):
   - The 'Image Prompt' for each slide MUST perfectly and accurately depict the exact action, emotion, or subject being spoken in the Voice Over at that specific timestamp.
   - Every single Image Prompt MUST strictly end with your master visual lock: "Vertical 9:16 video. Roblox gameplay style. Premium dark green aesthetic, cinematic lighting, high contrast, sharp focus."
4. NO MINECRAFT: Strictly Roblox gameplay elements only.

OUTPUT FORMAT:
Provide raw, clean text ready to be read and produced. Do NOT use markdown code blocks. Use this exact structure for every slide until the exact ${duration}-minute target is reached:

Slide [Number] ([Start Time] - [End Time])
Voice Over: [Write the creative VO in ${language}]
Image Prompt: [Describe the specific scene matching the VO perfectly in English. Vertical 9:16 video. Roblox gameplay style. Premium dark green aesthetic, cinematic lighting, high contrast, sharp focus.]
Overlay Text: [Short punchy text in ${language}]
-----------------------------------`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: aiModel, messages: [{ role: "user", content: prompt }] })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Gagal menghubungi AI");

    let textResponse = data.choices[0].message.content.trim();
    
    // Pembersihan markdown jika AI masih bandel
    if (textResponse.startsWith("```")) {
       textResponse = textResponse.replace(/^```[a-z]*\s*/, "").replace(/\s*```$/, "");
    }

    return NextResponse.json({ success: true, script: textResponse });

  } catch (error: any) {
    console.error("Director Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}