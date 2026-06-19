import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.AI_API_KEYS;
    let baseUrl = process.env.AI_BASE_URL || "https://lite.koboillm.com/v1";
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) return NextResponse.json({ error: "API Key belum diatur." }, { status: 400 });
    baseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    // 1. TARIK DATA REAL-TIME DARI YOUTUBE (Anti Data Palsu)
    // Kita mencari apa yang sedang diketik audiens Indonesia tentang Roblox detik ini.
    const ytRes = await fetch(`http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=roblox+indonesia+terbaru`);
    const ytData = await ytRes.json();
    const liveTrends = ytData[1] ? ytData[1].slice(0, 4).join(", ") : "Roblox update, Roblox horor, Roblox lucu";

    // 2. PROMPT MASTER (Instruksi Teks Bersih)
    const prompt = `Kamu adalah Strategis Konten YouTube Shorts.
Ini adalah daftar kata kunci yang SEDANG TREN dan DICARI ORANG di YouTube Indonesia detik ini: "${liveTrends}".

Buat 4 konsep video berdasarkan kata kunci nyata tersebut. 
JANGAN GUNAKAN FORMAT JSON. Berikan teks rapi yang siap di-copy-paste dengan struktur berikut untuk setiap video:

🔥 VIDEO [NOMOR]
Judul: (Maks 60 Karakter, wajib sangat memancing penasaran)
Deskripsi: (Singkat, padat, sertakan ajakan natural seperti 'cek keranjang kuning' jika ini produk UGC, atau 'subscribe' untuk konten biasa)
Hashtag: (5 hashtag spesifik berdasarkan tren di atas)

Visual Prompt (Bahasa Inggris untuk Midjourney/DALL-E):
"Vertical 9:16 mobile-first composition. [DESKRIPSI SCENE]. Premium dark green aesthetic, cinematic lighting, high contrast, sharp focus. Ensure extreme visual consistency."

-----------------------------------
(Pisahkan tiap video dengan garis pembatas di atas)`;

    // 3. PROSES AI
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: aiModel, messages: [{ role: "user", content: prompt }] })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Gagal menghubungi AI");

    const textResponse = data.choices[0].message.content.trim();

    // Mengembalikan Teks Bersih ke Web Anda
    return NextResponse.json({ 
      success: true, 
      resultText: textResponse 
    });

  } catch (error: any) {
    console.error("Viral Factory Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}