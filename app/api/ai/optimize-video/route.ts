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

// =========================================================================
// 🔥 PROMPT EMAS: OTAK AI 4 ELEMEN YOUTUBE KELAS DUNIA 🔥
// =========================================================================
const prompt = `Anda adalah Pakar SEO YouTube dan Copywriter kelas dunia.
Klien meminta optimasi metadata video YouTube agar mendapatkan ranking 1 di pencarian dan rasio klik (CTR) yang tinggi.

Data Video Asli:
Judul: "${originalTitle}"
Deskripsi: "${originalDesc.substring(0, 500)}"
Bahasa Target: ${targetLanguage || "English"}

ATURAN KETAT ANALISA & PENULISAN (WAJIB DIIKUTI):
1. 'recommendedTitles': Buat TEPAT 5 pilihan judul clickbait namun SEO-friendly. SETIAP JUDUL WAJIB diberi skor di bagian AKHIR judul (contoh: "Judul Video [Skor SEO: 95/100]").
2. 'recommendedDescriptions': Buat TEPAT 3 variasi naskah deskripsi YouTube yang memikat dan profesional.
   WAJIB MEMBAGI TEKS DESKRIPSI MENJADI 4 BAGIAN PARAGRAF MENGGUNAKAN BARIS BARU (\\n\\n):
   - [Paragraf 1: Pengantar Natural] Buat 2-3 kalimat pembuka menarik yang mengandung 2-3 kata kunci utama.
   - [Paragraf 2: Detail Isi Video] Berikan penjelasan/ringkasan isi video menggunakan kata kunci turunan.
   - [Paragraf 3: Call to Action] Berikan ajakan Like, Comment, Subscribe, dan berikan teks placeholder persis seperti ini: "[Link Sosial Media / Produk Anda]"
   - [Paragraf 4: Hashtag] Berikan TEPAT 3 sampai 5 hashtag relevan di paling bawah menggunakan tanda #.
   Berikan skor SEO (angka 1-100) untuk setiap variasi deskripsi.
3. 'keywords': Buat array daftar minimal 15 hashtag/tag berurutan dari skor SEO tertinggi untuk diisi ke dalam kotak TAGS YouTube. Cantumkan skornya (contoh: "#roblox (99)").

Berikan hasil DALAM FORMAT JSON MURNI (Object) dengan struktur persis seperti ini:
{
  "recommendedTitles": [
    "Ketik Judul Pilihan Pertama Di Sini [Skor SEO: 95/100]"
  ],
  "recommendedDescriptions": [
    {
      "text": "Kalimat pengantar yang sangat memikat penonton ada di sini...\\n\\nDi video kali ini kita akan membahas detail bla bla bla...\\n\\nJangan lupa untuk Like dan Subscribe ya! Terus dukung channel ini:\\n[Link Sosial Media / Produk Anda]\\n\\n#KeywordSatu #KeywordDua #KeywordTiga",
      "score": 98
    }
  ],
  "keywords": [
    "#keywordTerbaik (98)"
  ]
}

Gunakan bahasa yang sama dengan Bahasa Target. JANGAN gunakan format markdown seperti \`\`\`json. HANYA kembalikan JSON murni.`;
// =========================================================================

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