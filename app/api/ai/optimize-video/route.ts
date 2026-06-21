import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { video, targetLanguage} = body;

    const apiKey = process.env.AI_API_KEYS;
    let baseUrl = process.env.AI_BASE_URL || "https://lite.koboillm.com/v1";
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) {
      return NextResponse.json({ error: "API Key belum diatur." }, { status: 400 });
    }

    baseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    const originalTitle = video?.snippet?.title || video?.title || "Video Tanpa Judul";
    const originalDesc = video?.snippet?.description || "";

const prompt = `Anda adalah Pakar SEO YouTube dan Copywriter kelas dunia.
Klien meminta optimasi metadata video YouTube agar mendapatkan ranking 1 di pencarian dan rasio klik (CTR) yang tinggi.

Data Video Asli:
Judul: "${originalTitle}"
Deskripsi: "${originalDesc.substring(0, 500)}"
Bahasa Target: ${targetLanguage || "English"}

ATURAN KETAT ANALISA SKOR (WAJIB DIIKUTI):
1. 'recommendedTitles': Buat TEPAT 5 pilihan judul clickbait namun SEO-friendly. SETIAP JUDUL WAJIB diberi skor di bagian AKHIR judul. SKOR HARUS REALISTIS hasil dari analisa Anda terhadap potensi klik dan pencarian. JANGAN berikan nilai palsu atau menyalin dari contoh!
2. 'description': Buat naskah deskripsi YouTube yang panjang, profesional, dan kaya akan keyword SEO.
3. 'keywords': Buat array yang berisi daftar minimal 15 hashtag. WAJIB diurutkan dari skor SEO tertinggi hingga terendah. SKOR HARUS REALISTIS berdasarkan persaingan keyword di YouTube. WAJIB cantumkan skornya di samping hashtag.

Berikan hasil DALAM FORMAT JSON MURNI (Object) dengan struktur persis seperti ini (Ganti "XX" dengan ANGKA SKOR ASLI hasil analisa Anda):
{
  "recommendedTitles": [
    "Ketik Judul Pilihan Pertama Di Sini [Skor SEO: XX/100]",
    "Ketik Judul Pilihan Kedua Di Sini [Skor SEO: XX/100]",
    "Ketik Judul Pilihan Ketiga Di Sini [Skor SEO: XX/100]",
    "Ketik Judul Pilihan Keempat Di Sini [Skor SEO: XX/100]",
    "Ketik Judul Pilihan Kelima Di Sini [Skor SEO: XX/100]"
  ],
  "description": "Tulis deskripsi video yang lengkap dan SEO friendly di sini...",
  "keywords": [
    "#keywordTerbaik (XX)",
    "#keywordKedua (XX)",
    "#keywordKetiga (XX)"
  ]
}

Gunakan bahasa yang sama dengan Bahasa Target. JANGAN gunakan format markdown seperti \`\`\`json. HANYA kembalikan JSON murni.`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || JSON.stringify(data));
    
    let textResponse = data.choices[0].message.content.trim();
    
    // Pembersih JSON Anti-Error
    const bt = "\x60\x60\x60";
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