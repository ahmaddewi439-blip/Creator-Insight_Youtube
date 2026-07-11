import { NextResponse } from "next/server";

export const maxDuration = 55;
export const runtime = "nodejs";

export async function POST(req: Request) {
  // 1. TANGKAP KABEL FRONTEND
  const userAiKey = req.headers.get('x-user-ai-key');
  
  // 2. GEMBOK ANTI-JEBOL
  const apiKey = userAiKey ? userAiKey : process.env.AI_API_KEYS;

  try {
    const body = await req.json();
    const { niche, topic, language, duration } = body;

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
      
    // Prompt dengan Ancaman Matematika 10 Detik
    const prompt = `Kamu adalah Sutradara YouTube Shorts Profesional. Buatkan 4 script video pendek vertikal (9:16) berdasarkan topik dan angle yang diberikan.
Niche: "${niche}"
Topik Spesifik: "${topic}"
BAHASA NASKAH (VO) & JUDUL HARUS MENGGUNAKAN: "${language}"

ATURAN WAKTU DAN JUMLAH KATA SANGAT KETAT (SYARAT MUTLAK):
1. TARGET DURASI TOTAL ADALAH TEPAT ${duration} DETIK. 
2. SETIAP SCENE HARUS BERDURASI TEPAT 10 DETIK! (Artinya jika total durasi 30 detik = wajib 3 scene. Jika 40 detik = wajib 4 scene). Format waktu wajib kelipatan 10 detik (Contoh: "00:00 - 00:10", "00:10 - 00:20").
3. SYARAT MUTLAK VOICE OVER (VO): Kecepatan bicara manusia rata-rata adalah 2.5 kata per detik. Oleh karena itu, teks VO UNTUK SETIAP SCENE 10 DETIK WAJIB BERJUMLAH TEPAT 23 HINGGA 26 KATA SAJA!
4. JANGAN KURANG DARI 23 KATA, JANGAN LEBIH DARI 26 KATA per scene! Hitung manual kata-kata Anda. Jika melanggar, suara akan terpotong.
5. BAHASA: Seluruh naskah narasi (Voice Over) HARUS menggunakan bahasa: ${language}.
6. DURASI: Sesuaikan panjang teks narasi agar pas diucapkan dalam durasi ${duration} detik. Jangan terlalu pendek, jangan kepanjangan.
7. SCENE 1 (0-3 detik pertama): WAJIB berupa HOOK WAJIB MAUT MEMATIKAN agar orang berhenti scroll. Buat kalimat yang sangat memancing rasa penasaran, kontroversial, atau menjanjikan rahasia.
8. SCENE 3 (PENTING!): Pada scene ketiga, WAJIB sertakan narasi ajakan secara natural. Gunakan terjemahan yang luwes sesuai bahasa ${language} untuk kalimat ini: "Sebelum lanjut, bantu subscribe, like, dan share video ini ya!".
9. SCENE TERAKHIR (Outro): WAJIB sertakan Call to Action ulang di akhir video untuk Subscribe, Like, Share, dan Komen.
10. ATURAN VISUAL CERDAS BERDASARKAN NICHE (SANGAT PENTING):
    - Jika Niche adalah "Gaming / E-sports", "Review", atau "Tech": Buat "imagePrompt" dan "videoPrompt" AI (berbahasa Inggris) HANYA untuk Scene 1 (sebagai Intro/Hook). Untuk Scene 2 dan seterusnya, JANGAN BUAT prompt AI. Sebagai gantinya, isi dengan instruksi bahasa ${language} yang menyarankan "RECOMMENDED REAL FOOTAGE" (Contoh: "Tampilkan rekaman layar / real gameplay saat [Aksi Spesifik]", "Gunakan screen record asli dari game tersebut").
    - Jika Niche SELAIN Gaming/Review (seperti Edukasi, Sejarah, Misteri): Sediakan "imagePrompt" dan "videoPrompt" berbahasa INGGRIS yang sangat detail, realistis, dan dramatis untuk SEMUA SCENE agar bisa di-generate oleh AI (Grok/Midjourney).
11. KESESUAIAN NASKAH (SYARAT MUTLAK): Keempat (4) naskah video yang kamu buat HARUS 100% terikat dan fokus membahas 'Topik Spesifik' yang diminta di atas. DILARANG KERAS membuat naskah generik, melakukan auto-koreksi, atau melenceng ke topik lain (seperti robot/AI mengambil alih pekerjaan). Gunakan subjek/kata benda secara mentah-mentah sesuai input!
12. KUNCI KONTEKS NICHE (SANGAT FATAL): Niche channel ini adalah "${niche}". Kamu WAJIB menafsirkan Judul dan Topik murni dari kacamata niche ini! Jika niche yang dipilih adalah "Science & Tech", maka subjek apa pun di dalam topik (meskipun namanya mirip game, film, atau hewan) HARUS dibahas sebagai Teknologi, Software, AI, atau Sains. DILARANG KERAS membahasnya sebagai Video Game Fantasi/RPG kecuali niche-nya memang "Gaming"!
13. VARIASI MULTIPLIKASI (DILARANG REPETITIF): Ke-4 naskah video (Shorts 1, 2, 3, dan 4) HARUS memiliki alur cerita, hook (kalimat pembuka), visual action, dan image/video prompt yang BERBEDA TOTAL SATU SAMA LAIN. Jangan malas! Jangan mengulang adegan, deskripsi, atau struktur kalimat yang sama di naskah yang berbeda. Berikan 4 sudut pandang (angle) kreatif yang unik untuk topik yang sama!

Berikan hasil DALAM FORMAT JSON ARRAY murni yang berisi tepat 4 objek video. Struktur persis seperti ini:
[
  {
    "title": "Judul Konsep Video",
    "hook": "Hook 3 detik pertama yang wajib hook mematikan agar orang berhenti scroll",
    "audioMood": "Rekomendasi musik background",
    "thumbnailPrompt": "Prompt thumbnail bahasa inggris",
    "scenes": [
      {
        "waktu": "00:00 - 00:10",
    "vo": "Tuliskan kalimat Anda di sini dengan syarat mutlak harus 23 sampai 26 kata.",
        "visual": "Aksi visual/B-roll di layar",
        "imagePrompt": "Prompt gambar AI (Grok/Midjourney) BERBAHASA INGGRIS",
        "videoPrompt": "Prompt video AI (Grok/Kling/Runway) BERBAHASA INGGRIS"
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