import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Menangkap niche, topik, dan BAHASA dari frontend
    const { niche, topic, language } = body;

    const apiKey = process.env.AI_API_KEYS;
    let baseUrl = process.env.AI_BASE_URL || "https://lite.koboillm.com/v1";
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) return NextResponse.json({ error: "API Key belum diatur." }, { status: 400 });

    baseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    // Prompt yang sudah diupgrade untuk menyesuaikan bahasa
    const prompt = `Anda adalah Pakar TikTok & YouTube Shorts.
Klien meminta 4 ide konten vertikal (9:16) super viral.
Niche: "${niche}"
Topik Spesifik: "${topic}"
BAHASA NASKAH HARUS MENGGUNAKAN: "${language}"

Berikan hasil DALAM FORMAT JSON ARRAY murni yang berisi tepat 4 objek. Struktur persis seperti ini:
[
  {
    "title": "Judul Konsep Video",
    "hook": "Kalimat pertama (3 detik awal) yang sangat clickbait/memicu penasaran",
    "script": "Isi naskah lengkap dari awal sampai akhir video (durasi 30-40 detik). Tuliskan dengan gaya bahasa yang sesuai dengan target negara/bahasa."
  }
]
JANGAN gunakan format markdown seperti \`\`\`json. HANYA kembalikan array JSON murni.`;

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