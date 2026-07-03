import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    // Memanggil kunci sk-... dari brankas Vercel
    const apiKey = process.env.GEMINI_API_KEY;

    if (!query) return NextResponse.json({ error: 'Topik tidak boleh kosong' }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: 'API Key belum dipasang di sistem' }, { status: 500 });

    const prompt = `Anda adalah pakar SEO YouTube sangat profesional. Buatkan optimasi SEO untuk topik video berikut: "${query}".
    di 3 detik awal hook harus sangat kuat,agar semua orang berhenti scrool setelah melihat video,Dan Berikan balasan HANYA dalam format JSON murni dengan struktur seperti ini (tanpa awalan/akhiran markdown apapun):
    {
      "title": "Tulis 1 Judul yang sangat clickbait, memancing rasa penasaran, dan SEO friendly",
      "description": "Tulis deskripsi video yang menarik, informatif, dan mengandung kata kunci SEO secara natural (maksimal 2 paragraf).",
      "tags": "tuliskan, deretan, tag, relevan, dipisah, dengan, koma, minimal, 15, tag"
    }`;

    // 1. Menembak ke Server Koboi LLM (bukan Google lagi)
    const response = await fetch(`https://lite.koboillm.com/v1/chat/completions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // 2. Format otorisasi standar Bearer Token untuk Koboi
        'Authorization': `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        // 3. Menggunakan model yang sudah Anda seting di dashboard Koboi
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gagal menghubungi Server Koboi LLM');
    }

    // 4. Cara mengambil balasan dari Koboi berbeda dengan Google asli
    const aiText = data.choices[0].message.content;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}