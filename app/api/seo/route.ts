import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    // Kita menggunakan Gemini API untuk otaknya
    const apiKey = process.env.AI_API_KEYS;

    if (!query) return NextResponse.json({ error: 'Topik tidak boleh kosong' }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: 'API Key Gemini belum dipasang di sistem' }, { status: 500 });

    // Perintah khusus (Prompt) untuk meracik SEO
    const prompt = `Anda adalah pakar SEO YouTube sangat profesional. Buatkan optimasi SEO untuk topik video berikut: "${query}".
    di 3 detik awal hook harus sangat kuat,agar semua orang berhenti scrool setelah melihat video,Dan Berikan balasan HANYA dalam format JSON murni dengan struktur seperti ini (tanpa awalan/akhiran markdown apapun):
    {
      "title": "Tulis 1 Judul yang sangat clickbait, memancing rasa penasaran, dan SEO friendly",
      "description": "Tulis deskripsi video yang menarik, informatif, dan mengandung kata kunci SEO secara natural (maksimal 2 paragraf).",
      "tags": "tuliskan, deretan, tag, relevan, dipisah, dengan, koma, minimal, 15, tag"
    }`;

    // Menembak ke server pusat Gemini AI Google
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gagal menghubungi Server AI');
    }

    // Mengambil dan membersihkan hasil balasan AI agar menjadi format yang bisa dibaca web
    const aiText = data.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}