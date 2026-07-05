import { NextResponse } from 'next/server';

// WAJIB ADA: Memaksa Vercel tidak memakai ingatan lama (Cache)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const apiKey = (process.env.OPENROUTER_API_KEY || "").trim(); 

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

WAJIB KEMBALIKAN OUTPUT DALAM FORMAT JSON PERSIS SEPERTI INI (Tanpa teks Markdown):
{
  "blueprint": "Paragraf strategi brutal dan taktis...",
  "ideVideo": "Judul video spesifik...",
  "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"] 
}`;

    // INI YANG PALING PENTING: Jalur tembak sudah diubah ke server Koboi LLM!
    const urlTujuan = 'https://lite.koboillm.com/v1/chat/completions'; 

    const response = await fetch(urlTujuan, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o', // Model sesuai standar Koboi LLM
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