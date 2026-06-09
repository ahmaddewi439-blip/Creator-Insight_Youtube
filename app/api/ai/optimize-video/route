import { callAIJson } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const video = body?.video;
    if (!video) return Response.json({ error: "Video belum dipilih." }, { status: 400 });

    const system = `Kamu adalah YouTube strategist untuk channel gaming/Roblox. Jawab hanya JSON valid. Jangan markdown.`;
    const user = `Analisis video YouTube berikut dan buat optimasi yang bisa langsung dicopy.

Data video:
${JSON.stringify(video, null, 2)}

Output wajib JSON dengan struktur:
{
  "score": {"title": number, "seo": number, "ctr": number, "retention": number, "overall": number},
  "diagnosis": "ringkasan singkat masalah dan peluang",
  "recommendedTitles": ["5 judul alternatif kuat"],
  "caption": "caption singkat untuk posting/Shorts",
  "description": "deskripsi YouTube yang natural dan SEO friendly",
  "hashtags": ["#Roblox"],
  "keywords": ["keyword"],
  "thumbnailTexts": ["3 opsi teks thumbnail maksimal 5 kata"],
  "pinnedComment": "komentar pin yang mengundang diskusi",
  "cta": "CTA natural untuk subscribe/like/comment",
  "actionPlan": ["5 langkah perbaikan praktis"]
}

Aturan:
- Bahasa output Indonesia.
- Kalau topik Roblox, gunakan gaya global Roblox news.
- CTA harus kuat, bukan sekadar 'like and subscribe'.
- Jangan klaim data yang tidak ada.`;

    const result = await callAIJson([ { role: "system", content: system }, { role: "user", content: user } ], 0.7);
    return Response.json(result.parsed ? { result: result.parsed } : { raw: result.raw });
  } catch (err: any) {
    return Response.json({ error: err?.message || "AI gagal membuat optimasi." }, { status: 500 });
  }
}
