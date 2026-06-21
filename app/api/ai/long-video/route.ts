import { NextResponse } from "next/server";

export const maxDuration = 60; // Durasinya kita maksimalkan karena naskahnya panjang
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { niche, topic, duration, language } = body;

    if (!topic) return NextResponse.json({ error: "Topik tidak boleh kosong" }, { status: 400 });

    const apiKey = process.env.AI_API_KEYS;
    let baseUrl = process.env.AI_BASE_URL || "https://lite.koboillm.com/v1";
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) return NextResponse.json({ error: "API Key belum diatur." }, { status: 400 });

    baseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    const prompt = `Anda adalah Sutradara & Pakar Naskah YouTube kelas dunia spesialis Faceless Channel.
Klien meminta naskah video panjang (Long Form).
Niche: "${niche}"
Topik: "${topic}"
Durasi Target: "${duration}"
Bahasa Voice Over (Narasi): "${language}"

Tugas Anda: Buat naskah YouTube yang sangat detail, memikat, dengan retensi tinggi.
Berikan hasil DALAM FORMAT JSON MURNI (Object) dengan struktur persis seperti ini:
{
  "title": "Judul Video yang sangat Clickbait dan SEO Friendly",
  "description": "Deskripsi YouTube yang mengandung keyword SEO",
  "tags": "tag1, tag2, keyword3, viral4",
  "scenes": [
    {
      "waktu": "00:00 - 01:30 (Contoh Timestamp)",
      "visual": "Deskripsi sedetail mungkin tentang video B-roll / gambar apa yang harus muncul di layar.",
      "vo": "Teks Voice Over (Narasi/Bicara) menggunakan bahasa ${language}. Gunakan gaya bahasa memikat.",
      "prompt": "Prompt Midjourney/AI Image BERBAHASA INGGRIS untuk menghasilkan gambar adegan ini."
    }
  ]
}
PENTING: 
1. Buat minimal 5-8 scene yang padat agar sesuai durasi ${duration}.
2. Pastikan bahasa VO benar-benar menggunakan ${language}.
3. JANGAN gunakan format markdown seperti \`\`\`json. HANYA kembalikan JSON murni.`;

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