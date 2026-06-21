import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { niche, topic, language } = body;

    const apiKey = process.env.AI_API_KEYS;
    let baseUrl = process.env.AI_BASE_URL || "https://lite.koboillm.com/v1";
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) return NextResponse.json({ error: "API Key belum diatur." }, { status: 400 });

    baseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    // Prompt ini sudah diubah agar menghasilkan format Scene-by-Scene percis seperti menu Lab
    const prompt = `Anda adalah Pakar TikTok & YouTube Shorts kelas dunia.
Klien meminta 4 ide konten vertikal (9:16) super viral (Durasi 45-60 detik per video).
Niche: "${niche}"
Topik Spesifik: "${topic}"
BAHASA NASKAH (VO) & JUDUL HARUS MENGGUNAKAN: "${language}"

Berikan hasil DALAM FORMAT JSON ARRAY murni yang berisi tepat 4 objek video. Struktur persis seperti ini:
[
  {
    "title": "Judul Konsep Video",
    "hook": "Hook 3 detik pertama yang sangat mematikan",
    "audioMood": "Rekomendasi musik background yang trending",
    "thumbnailPrompt": "Prompt bahasa inggris untuk generate gambar thumbnail/cover awal",
    "scenes": [
      {
        "waktu": "00:00 - 00:05",
        "vo": "Teks voice over untuk adegan ini",
        "visual": "Aksi visual/B-roll di layar",
        "imagePrompt": "Prompt gambar AI (Midjourney/Grok) BERBAHASA INGGRIS untuk adegan ini",
        "videoPrompt": "Prompt video AI (Kling/Runway) BERBAHASA INGGRIS untuk adegan ini"
      }
    ]
  }
]
PENTING: Setiap video minimal harus memiliki 5-6 scenes agar durasinya pas untuk Shorts. JANGAN gunakan format markdown seperti \`\`\`json. HANYA kembalikan JSON murni.`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: aiModel, messages: [{ role: "user", content: prompt }] })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || JSON.stringify(data));
    
    let textResponse = data.choices[0].message.content.trim();
    const bt = "\`\`\`";
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