import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  // 1. TANGKAP KABEL FRONTEND
  const userAiKey = req.headers.get('x-user-ai-key');
  
  // 2. GEMBOK ANTI-JEBOL (Satpam Cerdas Anti-Trik String Null)
  // Default pertama: Ambil kunci milik Admin dari Vercel Environment
  let apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEYS;

  // Cek Cerdas: Jika user bawa kunci valid, dan isinya bukan kosong / string "null"
  if (userAiKey && userAiKey.trim() !== "" && userAiKey !== "null" && userAiKey !== "undefined") {
    apiKey = userAiKey; // Maka paksa gunakan kunci milik user!
  }

  try {
    const body = await req.json();
    const { niche, topic } = body;

    if (!topic || !niche) {
      return NextResponse.json({ error: "Niche dan Topik harus diisi." }, { status: 400 });
    }

    // Jika setelah disaring ternyata kedua kunci kosong, baru tolak di sini
    if (!apiKey) {
      return NextResponse.json({ error: "API Key belum diatur." }, { status: 400 });
    }

    // === SAKLAR MULTI-MESIN OTOMATIS ===
    const isGeminiKey = apiKey.startsWith("AIza");

    const endpoint = isGeminiKey 
      ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
      : 'https://lite.koboillm.com/v1/chat/completions'; // Jalur server Admin

    const aiModel = isGeminiKey 
      ? 'gemini-1.5-flash'               // Model untuk User (Gemini gratisan)
      : 'gemini/gemini-2.5-flash-lite';  // Model premium untuk Admin

    // Prompt Khusus Sniper Angle
    const prompt = `Anda adalah Pakar Algoritma YouTube dan Produser Konten spesialis channel Automation/Faceless global.
Klien Anda memilih Niche: "${niche}" dengan Topik dasar: "${topic}".
Target Bahasa: "${body.language || 'Indonesia'}".

Tugas Anda: Carikan 3 ANGLE (Sudut Pandang) turunan dari topik dasar tersebut yang memiliki peluang viral tertinggi. 
PENTING: Judul, angle, dan alasan HARUS menggunakan bahasa "${body.language || 'Indonesia'}".

ATURAN MUTLAK FATAL: 
1. DILARANG KERAS melakukan auto-koreksi, memanipulasi, atau menebak-nebak input dari user! 
2. Jika user memasukkan kata "Fable", gunakan kata "Fable". JANGAN PERNAH merubahnya menjadi "Fallout" atau kata lain.
3. Gunakan subjek/kata benda asli dari input user sebagai inti utama dari 3 Angle Judul yang kamu buat. Pelanggaran terhadap aturan ini akan merusak sistem.
4. KUNCI KONTEKS NICHE (SANGAT FATAL): Niche channel ini adalah "${niche}". Kamu WAJIB menafsirkan semua input user dari kacamata niche ini.
5. DILARANG KERAS melakukan auto-koreksi atau mengubah kata benda dari input user (misal: "Fable" jangan diubah jadi "Fallout").
6. Jika topik terdengar seperti nama game atau film, TAPI niche-nya adalah "Science & Tech", maka bahaslah dari sisi TEKNOLOGI (seperti software, AI, hardware, update, dll), BUKAN dari sisi gameplay/fantasi.
Berikan hasil DALAM FORMAT JSON ARRAY murni yang berisi tepat 3 objek. Struktur persis seperti ini:
[
  {
    "title": "Ide Judul Konten Clickbait (Maks 10 kata)",
    "angle": "Penjelasan singkat fokus materi video ini",
    "score": 95, 
    "searchVolume": "Tinggi", 
    "competition": "Rendah", 
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