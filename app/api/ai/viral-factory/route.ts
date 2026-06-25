import { NextResponse } from "next/server";

export const maxDuration = 55;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { niche, topic, language, duration } = body;

    const apiKey = process.env.AI_API_KEYS;
    let baseUrl = process.env.AI_BASE_URL || "https://lite.koboillm.com/v1";
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) return NextResponse.json({ error: "API Key belum diatur." }, { status: 400 });

    baseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    // Prompt dengan Ancaman Matematika 6 Detik
    const prompt = `Kamu adalah Sutradara YouTube Shorts Profesional. Buatkan 4 script video pendek vertikal (9:16) berdasarkan topik dan angle yang diberikan.
Niche: "${niche}"
Topik Spesifik: "${topic}"
BAHASA NASKAH (VO) & JUDUL HARUS MENGGUNAKAN: "${language}"

ATURAN WAKTU DAN JUMLAH KATA SANGAT KETAT (SYARAT MUTLAK):
1. TARGET DURASI TOTAL ADALAH TEPAT ${duration} DETIK. Hitung jumlah scene agar total durasinya pas ${duration} detik (Tiap scene berdurasi kelipatan 6 detik. Contoh: "00:00 - 00:06").
2. SETIAP video WAJIB memiliki antara 7 hingga 10 scene tergantung durasi yang di pilih (agar durasi total 40-55 detik).
3. SETIAP SCENE HARUS BERDURASI TEPAT 6 DETIK. Format waktu wajib kelipatan 6 detik (Contoh: "00:00 - 00:06", "00:06 - 00:12").
4. SYARAT MUTLAK VOICE OVER (VO): Kecepatan bicara manusia adalah 2.5 kata per detik. Oleh karena itu, teks VO UNTUK SETIAP SCENE WAJIB BERJUMLAH TEPAT 10 HINGGA 12 KATA. 
5. JANGAN KURANG DARI 10 KATA, JANGAN LEBIH DARI 13 KATA! Hitung manual kata-kata Anda sebelum menuliskannya. Jika kurang dari 12 kata, naskah akan ada jeda diam. Jika lebih dari 12 kata, naskah akan terpotong sebelum selesai dibaca.
6. BAHASA: Seluruh naskah narasi (Voice Over) HARUS menggunakan bahasa: ${language}.
7. DURASI: Sesuaikan panjang teks narasi agar pas diucapkan dalam durasi ${duration} detik. Jangan terlalu pendek, jangan kepanjangan.
8. SCENE 1 (0-3 detik pertama): WAJIB berupa HOOK WAJIB MAUT MEMATIKAN agar orang berhenti scroll. Buat kalimat yang sangat memancing rasa penasaran, kontroversial, atau menjanjikan rahasia.
9. SCENE 3 (PENTING!): Pada scene ketiga, WAJIB sertakan narasi ajakan secara natural. Gunakan terjemahan yang luwes sesuai bahasa ${language} untuk kalimat ini: "Sebelum lanjut, bantu subscribe, like, dan share video ini ya!".
10. SCENE TERAKHIR (Outro): WAJIB sertakan Call to Action ulang di akhir video untuk Subscribe, Like, Share, dan Komen.
11. PROMPT VISUAL (Grok AI): Untuk setiap scene, sediakan "Prompt Gambar/Video" yang sangat detail, realistis, dan dramatis. Prompt visual ini WAJIB menggunakan bahasa Inggris (karena Grok AI memahami visual terbaik dalam bahasa Inggris), namun visualnya harus 100% mencerminkan niche dan konteks topik yang dibahas.

Berikan hasil DALAM FORMAT JSON ARRAY murni yang berisi tepat 4 objek video. Struktur persis seperti ini:
[
  {
    "title": "Judul Konsep Video",
    "hook": "Hook 3 detik pertama yang wajib mematikan agar orang berhenti scroll",
    "audioMood": "Rekomendasi musik background",
    "thumbnailPrompt": "Prompt thumbnail bahasa inggris",
    "scenes": [
      {
        "waktu": "00:00 - 00:06",
        "vo": "Tuliskan kalimat Anda di sini dengan syarat mutlak harus sepuluh sampai dua belas kata.",
        "visual": "Aksi visual/B-roll di layar",
        "imagePrompt": "Prompt gambar AI (Midjourney/Grok) BERBAHASA INGGRIS",
        "videoPrompt": "Prompt video AI (Kling/Runway) BERBAHASA INGGRIS"
      }
    ]
  }
]
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