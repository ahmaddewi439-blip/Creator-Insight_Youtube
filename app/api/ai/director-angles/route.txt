import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { niche, topic } = body;

    if (!topic || !niche) {
      return NextResponse.json({ error: "Niche dan Topik harus diisi." }, { status: 400 });
    }

    const apiKey = process.env.AI_API_KEYS;
    let baseUrl = process.env.AI_BASE_URL || "https://lite.koboillm.com/v1";
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) {
      return NextResponse.json({ error: "API Key belum diatur." }, { status: 400 });
    }

    baseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    // Prompt Khusus Sniper Angle
    const prompt = `Anda adalah Pakar Algoritma YouTube dan Produser Konten spesialis channel Automation/Faceless global.
Klien Anda memilih Niche: "${niche}" dengan Topik dasar: "${topic}".

Tugas Anda: Carikan 3 ANGLE (Sudut Pandang) turunan dari topik dasar tersebut yang memiliki peluang viral tertinggi.
Berikan hasil DALAM FORMAT JSON ARRAY murni yang berisi tepat 3 objek. Struktur persis seperti ini:
[
  {
    "title": "Ide Judul Konten Clickbait (Maks 10 kata)",
    "angle": "Penjelasan singkat fokus materi video ini",
    "score": 95, // Beri skor 0-100. Buat 1 angle skor tinggi (sangat disarankan), 1 sedang, 1 rendah.
    "searchVolume": "Tinggi", // Tinggi, Sedang, atau Rendah
    "competition": "Rendah", // Tinggi, Sedang, atau Rendah
    "reason": "Alasan spesifik mengapa algoritma YouTube akan menyukai sudut pandang ini."
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
    
    // Pembersih JSON Anti-Error
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