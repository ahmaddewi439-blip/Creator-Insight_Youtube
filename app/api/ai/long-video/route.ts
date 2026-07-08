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

    const prompt = `Anda adalah Sutradara & Penulis Naskah YouTube kelas dunia spesialis Faceless Channel.
Klien meminta naskah video panjang (Long Form).
Niche: "${niche}"
Topik: "${topic}"
Durasi Target: "${duration}"
Bahasa Voice Over (Narasi): "${language}"

ATURAN WAKTU DAN JUMLAH KATA SANGAT KETAT (SYARAT MUTLAK):
1. Pecah total durasi "${duration}" tersebut menjadi adegan-adegan (scenes).
2. SETIAP SCENE HARUS BERDURASI TEPAT 30 DETIK. (Contoh format wajib: "00:00 - 00:30", "00:30 - 01:00", "01:00 - 01:30", dst).
3. SYARAT MUTLAK VOICE OVER (VO): Kecepatan bicara manusia normal adalah 2.5 kata per detik. Oleh karena itu, teks VO UNTUK SETIAP SCENE 30 DETIK WAJIB BERJUMLAH TEPAT 65 HINGGA 75 KATA.
4. JANGAN KURANG DARI 65 KATA, JANGAN LEBIH DARI 75 KATA PER SCENE! Hitung manual jumlah kata Anda sebelum menuliskannya. Jika kurang, akan ada *dead air* (hening) di video. Jika lebih, naskah tidak akan muat di durasi 30 detik tersebut.
5. Visual B-Roll harus mendeskripsikan secara sangat detail apa yang muncul di layar selama 30 detik tersebut.
6. KUNCI KONTEKS NICHE (SANGAT FATAL): Niche channel ini adalah "${niche}". Kamu WAJIB menafsirkan semua input user dari kacamata niche ini.
7. DILARANG KERAS melakukan auto-koreksi atau mengubah kata benda dari input user (misal: "Fable" jangan diubah jadi "Fallout").
8. Jika topik terdengar seperti nama game atau film, TAPI niche-nya adalah "Science & Tech", maka bahaslah dari sisi TEKNOLOGI (seperti software, AI, hardware, update, dll), BUKAN dari sisi gameplay/fantasi.

Berikan hasil DALAM FORMAT JSON MURNI (Object) dengan struktur persis seperti ini:
{
  "title": "Judul Video yang sangat Clickbait dan SEO Friendly",
  "description": "Deskripsi YouTube yang mengandung keyword SEO",
  "tags": "tag1, tag2, keyword3, viral4",
  "scenes": [
    {
      "waktu": "00:00 - 00:30",
      "visual": "Deskripsi B-roll / visual sangat detail...",
      "vo": "Teks Voice Over (wajib 65 - 75 kata) menggunakan bahasa ${language}.",
      "prompt": "Prompt Midjourney/AI Image BERBAHASA INGGRIS untuk adegan ini."
    }
  ]
}
JANGAN gunakan format markdown seperti \`\`\`json. HANYA kembalikan JSON murni.`;
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