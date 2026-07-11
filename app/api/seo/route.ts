import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // --- 1. TANGKAP KABEL DARI FRONTEND ---
  const userAiKey = req.headers.get('x-user-ai-key');
  
  // --- 2. LOGIKA SATPAM DAPUR ---
  const apiKey = userAiKey ? userAiKey : process.env.GEMINI_API_KEY;

  try {
    const { query } = await req.json();
    
    if (!query) return NextResponse.json({ error: 'Topik tidak boleh kosong' }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: 'API Key belum dipasang di sistem' }, { status: 500 });

    const prompt = `Anda adalah pakar SEO YouTube sangat profesional. Buatkan optimasi SEO untuk topik video berikut: "${query}".
    di 3 detik awal hook harus sangat kuat,agar semua orang berhenti scrool setelah melihat video,Dan Berikan balasan HANYA dalam format JSON murni dengan struktur seperti ini (tanpa awalan/akhiran markdown apapun):
    {
      "title": "Tulis 1 Judul yang sangat clickbait, memancing rasa penasaran, dan SEO friendly",
      "description": "Tulis deskripsi video yang menarik, informatif, dan mengandung kata kunci SEO secara natural (maksimal 2 paragraf).",
      "tags": "tuliskan, deretan, tag, relevan, dipisah, dengan, koma, minimal, 15, tag"
    }`;

    // === 3. SAKLAR MULTI-MESIN OTOMATIS ===
    const isGeminiKey = apiKey.startsWith("AIza");

    const urlTujuan = isGeminiKey 
      ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
      : 'https://lite.koboillm.com/v1/chat/completions'; // Server Admin (Koboi)

    const aiModel = isGeminiKey 
      ? 'gemini-1.5-flash' // Model untuk User (Google Gemini)
      : 'gemini-2.5-flash'; // Model untuk Admin (Koboi)

    // 4. MENEMBAK KE SERVER YANG TEPAT
    const response = await fetch(urlTujuan, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gagal menghubungi Server AI');
    }

    const aiText = data.choices[0].message.content;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}