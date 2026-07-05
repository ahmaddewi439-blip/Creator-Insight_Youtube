import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    // JURUS ANTI-SPASI: .trim() akan otomatis memotong spasi atau "enter" gaib di awal/akhir token
    const apiKey = (process.env.OPENROUTER_API_KEY || "").trim(); 

    if (!prompt) return NextResponse.json({ error: 'Ceritakan dulu kendalamu!' }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: 'API Key belum dikonfigurasi' }, { status: 500 });

    const systemInstruction = `Kamu adalah pakar YouTube Strategist kelas dunia. 
Tugasmu adalah memberikan saran strategis, ide video pertama, dan daftar kata kunci untuk klien. 
Gunakan bahasa Indonesia yang santai, memotivasi, logis, dan berorientasi pada data.

WAJIB KEMBALIKAN OUTPUT DALAM FORMAT JSON PERSIS SEPERTI INI (Tanpa Markdown, cukup format JSON valid):
{
  "blueprint": "Paragraf strategi eksekusi dan langkah awal (maksimal 3 paragraf pendek).",
  "ideVideo": "1 Judul video spesifik yang sangat menarik, clickbait tapi tidak menipu.",
  "keywords": ["kata kunci 1", "kata kunci 2", "kata kunci 3", "kata kunci 4", "kata kunci 5"] 
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        // Tambahan khusus OpenRouter agar mereka tidak menolak request kita
        'HTTP-Referer': 'https://creator-insight-youtube.vercel.app', 
        'X-Title': 'Creator Insight'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' } 
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error?.message || "Gagal menghubungi AI Provider.");
    }

    const resultText = data.choices[0].message.content;
    const parsedResult = JSON.parse(resultText);

    return NextResponse.json({ success: true, result: parsedResult });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}