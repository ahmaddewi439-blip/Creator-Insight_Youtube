import { NextResponse } from 'next/server';

// WAJIB ADA: Memaksa Vercel tidak memakai ingatan lama (Cache)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const apiKey = (process.env.OPENROUTER_API_KEY || "").trim(); 

    if (!prompt) return NextResponse.json({ error: 'Ceritakan dulu kendalamu!' }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: 'API Key Vercel masih kosong/belum terbaca' }, { status: 500 });

    const systemInstruction = `Kamu adalah pakar YouTube Strategist kelas dunia. 
Tugasmu adalah memberikan saran strategis, ide video pertama, dan daftar kata kunci untuk klien. 
Gunakan bahasa Indonesia yang santai, memotivasi, logis, dan berorientasi pada data.

WAJIB KEMBALIKAN OUTPUT DALAM FORMAT JSON PERSIS SEPERTI INI (Tanpa teks Markdown):
{
  "blueprint": "Paragraf strategi eksekusi dan langkah awal (maksimal 3 paragraf pendek).",
  "ideVideo": "1 Judul video spesifik yang sangat menarik, clickbait tapi tidak menipu.",
  "keywords": ["kata kunci 1", "kata kunci 2", "kata kunci 3", "kata kunci 4", "kata kunci 5"] 
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