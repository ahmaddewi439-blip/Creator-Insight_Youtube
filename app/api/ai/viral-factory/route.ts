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

    // Prompt dengan Ancaman Matematika 5 Detik
    const prompt = `Kamu adalah Sutradara YouTube Shorts Profesional. Buatkan 4 script video pendek vertikal (9:16) berdasarkan topik dan angle yang diberikan.
Niche: "${niche}"
Topik Spesifik: "${topic}"
BAHASA NASKAH (VO) & JUDUL HARUS MENGGUNAKAN: "${language}"

ATURAN WAKTU DAN JUMLAH KATA SANGAT KETAT (SYARAT MUTLAK):
1. Setiap video WAJIB memiliki antara 8 hingga 10 scene (agar durasi total 40-55 detik).
2. SETIAP SCENE HARUS BERDURASI TEPAT 5 DETIK. Format waktu wajib kelipatan 5 detik (Contoh: "00:00 - 00:05", "00:05 - 00:10").
3. SYARAT MUTLAK VOICE OVER (VO): Kecepatan bicara manusia adalah 2.5 kata per detik. Oleh karena itu, teks VO UNTUK SETIAP SCENE WAJIB BERJUMLAH TEPAT 12 HINGGA 14 KATA. 
4. JANGAN KURANG DARI 10 KATA, JANGAN LEBIH DARI 13 KATA! Hitung manual kata-kata Anda sebelum menuliskannya. Jika kurang dari 12 kata, naskah akan ada jeda diam. Jika lebih dari 14 kata, naskah akan terpotong sebelum selesai dibaca.
5. BAHASA: Seluruh naskah narasi (Voice Over) HARUS menggunakan bahasa: [MASUKKAN_VARIABLE_BAHASA_DISINI].
6. DURASI: Sesuaikan panjang teks narasi agar pas diucapkan dalam durasi [MASUKKAN_VARIABLE_DURASI_DISINI] detik. Jangan terlalu pendek, jangan kepanjangan.
7. SCENE 1 (0-3 detik pertama): WAJIB berupa HOOK MAUT. Buat kalimat yang sangat memancing rasa penasaran, kontroversial, atau menjanjikan rahasia.
8. SCENE 3 (PENTING!): Pada scene ketiga, WAJIB sertakan narasi ajakan secara natural. Gunakan terjemahan yang tepat sesuai bahasa yang dipilih untuk kalimat ini: "Sebelum lanjut, bantu subscribe, like, dan share video ini ya!".
9. SCENE TERAKHIR (Outro): WAJIB sertakan Call to Action ulang di akhir video untuk Subscribe, Like, Share, dan Komen.
10. PROMPT VISUAL (Grok AI): Untuk setiap scene, sediakan "Prompt Gambar/Video" yang sangat detail, realistis, dan dramatis. Prompt visual ini WAJIB menggunakan bahasa Inggris (karena Grok AI memahami visual terbaik dalam bahasa Inggris), namun visualnya harus 100% mencerminkan niche dan konteks topik yang dibahas.

Format Output (berikan 4 script dengan struktur ini):
[Judul Script 1]
- Scene 1 (Hook 3 Detik): [Narasi Bahasa Target] | Visual Prompt untuk Grok AI: [Prompt Inggris Detail]
- Scene 2: [Narasi Bahasa Target] | Visual Prompt: [Prompt Inggris Detail]
- Scene 3 (Wajib CTA): [Narasi CTA Bahasa Target] | Visual Prompt: [Prompt Inggris Detail]
... dan seterusnya sampai Scene Terakhir.

Berikan hasil DALAM FORMAT JSON ARRAY murni yang berisi tepat 4 objek video. Struktur persis seperti ini:
[
  {
    "title": "Judul Konsep Video",
    "hook": "Hook 3 detik pertama yang mematikan",
    "audioMood": "Rekomendasi musik background",
    "thumbnailPrompt": "Prompt thumbnail bahasa inggris",
    "scenes": [
      {
        "waktu": "00:00 - 00:05",
        "vo": "Tuliskan kalimat Anda di sini dengan syarat mutlak harus dua belas sampai empat belas kata.",
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