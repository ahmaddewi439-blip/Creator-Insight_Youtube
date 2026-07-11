import { NextResponse } from 'next/server';

// WAJIB ADA: Memaksa Vercel tidak memakai ingatan lama (Cache)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    // 1. Tangkap kunci dari Frontend
  const userAiKey = req.headers.get('x-user-ai-key');
  
// Gembok Anti-Jebol (Jika admin, pakai OPENROUTER_API_KEY)
const apiKey = userAiKey ? userAiKey : process.env.OPENROUTER_API_KEY;
  try {
    const { prompt } = await req.json();
    

    if (!prompt) return NextResponse.json({ error: 'Ceritakan dulu kendalamu!' }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: 'API Key Vercel masih kosong/belum terbaca' }, { status: 500 });

 // Mengambil tahun saat ini secara otomatis dari sistem komputer
    const tahunSekarang = new Date().getFullYear();

    const systemInstruction = `Kamu adalah pakar YouTube Strategist kelas dunia yang tajam, brutal, dan sangat berorientasi pada data algoritma terbaru.
SAAT INI ADALAH TAHUN ${tahunSekarang}. JANGAN PERNAH merekomendasikan ide konten, judul, atau kata kunci untuk tahun-tahun sebelum ${tahunSekarang}.

Klienmu akan memberikan curhatan/ide. Tugasmu:
1. Berikan "blueprint" strategi eksekusi (maksimal 3 paragraf). DILARANG memberikan saran klise seperti "fokus pada kualitas" atau "konsisten upload". Berikan strategi growth-hacking, trik retensi, atau celah algoritma spesifik untuk niche tersebut.
2. Berikan 1 "ideVideo" pertama yang SANGAT SPESIFIK, clickbait (tapi tidak menipu), dan memancing rasa penasaran tingkat tinggi.
3. Berikan 5 "keywords" dengan volume pencarian tinggi di tahun ${tahunSekarang}.
4. KUNCI KONTEKS NICHE (SANGAT FATAL): Niche channel ini menyesuaikan dengan curhatan/ide spesifik dari klien. Kamu WAJIB menafsirkan semua input murni dari kacamata topik klien tersebut.
5. DILARANG KERAS melakukan auto-koreksi atau mengubah kata benda dari input user (misal: "Fable" jangan diubah jadi "Fallout").
6. Jika topik terdengar seperti nama game atau film, TAPI niche-nya adalah "Science & Tech", maka bahaslah dari sisi TEKNOLOGI (seperti software, AI, hardware, update, dll), BUKAN dari sisi gameplay/fantasi.
WAJIB KEMBALIKAN OUTPUT DALAM FORMAT JSON PERSIS SEPERTI INI (Tanpa teks Markdown):
{
  "blueprint": "Paragraf strategi brutal dan taktis...",
  "ideVideo": "Judul video spesifik...",
  "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"] 
}`;

    // INI YANG PALING PENTING: Jalur tembak sudah diubah ke server Koboi LLM!
    // === 3. SAKLAR MULTI-MESIN OTOMATIS ===
    // Mendeteksi apakah ini Kunci Google Gemini (diawali AIza) atau Kunci Koboi/OpenAI (diawali sk-)
    const isGeminiKey = apiKey.startsWith("AIza");

    // Jika Gemini, tembak ke server Google. Jika Koboi, tembak ke server Koboi.
    const urlTujuan = isGeminiKey 
      ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
      : 'https://lite.koboillm.com/v1/chat/completions';

    // Jika Gemini, pakai model gemini. Jika Koboi, pakai gpt-4o.
    const aiModel = isGeminiKey 
      ? 'gemini-1.5-flash' 
      : 'openai/gpt-4o';

    const response = await fetch(urlTujuan, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ]
      })
    });
    const data = await response.json();
    
    // Pelacak Error Akurat
    if (!response.ok) {
        throw new Error(`Ditolak Server Koboi: ${data.error?.message || response.statusText}`);
    }

    const resultText = data.choices[0].message.content;
    
    // Sistem Asuransi Anti-Crash
    let parsedResult;
    try {
        parsedResult = JSON.parse(resultText);
    } catch (e) {
        parsedResult = {
            blueprint: resultText,
            ideVideo: "AI memberikan format yang salah, tapi jawaban tetap masuk.",
            keywords: ["error", "format", "json"]
        };
    }

    return NextResponse.json({ success: true, result: parsedResult });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}