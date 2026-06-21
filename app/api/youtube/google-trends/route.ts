import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topik atau keyword tidak boleh kosong." }, { status: 400 });
    }

    const apiKey = process.env.AI_API_KEYS;
    let baseUrl = process.env.AI_BASE_URL || "https://lite.koboillm.com/v1";
    const aiModel = process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite";

    if (!apiKey) {
      return NextResponse.json({ error: "API Key belum diatur." }, { status: 400 });
    }

    baseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

    // Prompt Khusus untuk Riset Kata Kunci
    const prompt = `Anda adalah Pakar Data Analis dan SEO YouTube Global. 
Tugas Anda adalah melakukan riset mendalam terhadap kata kunci / topik ini: "${topic}".

Berikan hasil riset Anda DALAM FORMAT JSON YANG VALID dengan struktur persis seperti ini:
{
  "score": 85, // Berikan angka 0-100. Semakin tinggi pencarian & semakin rendah kompetisi = skor mendekati 100.
  "volume": "Tinggi", // Pilih salah satu: Tinggi, Sedang, atau Rendah.
  "competition": "Sedang", // Pilih salah satu: Tinggi, Sedang, atau Rendah.
  "reason": "Alasan singkat (2-3 kalimat) kenapa kata kunci ini memiliki skor tersebut berdasarkan algoritma YouTube.",
  "relatedKeywords": ["ide kata kunci turunan 1", "ide kata kunci turunan 2", "ide kata kunci turunan 3"]
}

Aturan:
1. Analisis harus realistis. Jika topiknya sangat umum (misal: "Minecraft"), kompetisinya pasti Tinggi.
2. JANGAN gunakan format markdown seperti \`\`\`json.
3. HANYA kembalikan JSON murni.`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || JSON.stringify(data));
    
    let textResponse = data.choices[0].message.content.trim();
    
    // Pembersih JSON Anti-Error
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