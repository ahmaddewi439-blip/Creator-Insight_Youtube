import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { niche } = await req.json();
    
    const apiKey = process.env.GEMINI_API_KEY;

    if (!niche) return NextResponse.json({ error: 'Topik/Niche tidak boleh kosong' }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: 'API Key belum dipasang' }, { status: 500 });

    const prompt = `Anda adalah YouTube Channel Strategist kelas dunia. Buatkan konsep channel YouTube yang berpotensi viral untuk topik/niche: "${niche}".
    Berikan balasan HANYA dalam format JSON murni dengan struktur persis seperti ini (tanpa awalan/akhiran markdown apapun):
    {
      "channelNames": ["Nama Channel 1", "Nama Channel 2", "Nama Channel 3"],
      "targetAudience": "Deskripsi spesifik tentang siapa yang akan menonton channel ini",
      "description": "Draft deskripsi 'Tentang' (About) channel yang menarik dan SEO friendly",
      "contentPillars": ["Pilar Konten 1", "Pilar Konten 2", "Pilar Konten 3"],
      "first5Videos": ["Judul Video 1", "Judul Video 2", "Judul Video 3", "Judul Video 4", "Judul Video 5"]
    }`;

    const response = await fetch(`https://lite.koboillm.com/v1/chat/completions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gagal menghubungi Server Koboi LLM');
    }

    const aiText = data.choices[0].message.content;
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}